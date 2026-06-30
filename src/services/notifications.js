import { supabase } from '../config/supabase';

// Push sends go through the send-push-notification edge function, which holds
// the OneSignal REST key server-side (and runs with verify_jwt off, so a stale
// or expired client session can't block a send). The client only resolves WHO
// to notify (by user id) and the edge function targets them by external_id —
// so push survives app updates / reinstalls without chasing subscription IDs.

// Helper: Get all user IDs except sender
const getAllUserIds = async (excludeUserId) => {
  const { data, error } = await supabase.from('users').select('id');
  if (error) {
    console.error('[Push] Error fetching users:', error);
    return [];
  }
  return data.map(u => u.id).filter(id => id !== excludeUserId);
};

// Helper: Get user IDs filtered by organization
// - If isAllOrgs: return all users
// - If organizationId: return users in that org + admins/owners/full_line
const getUserIdsByOrg = async (excludeUserId, organizationId = null, isAllOrgs = false) => {
  console.log('[Push] getUserIdsByOrg - orgId:', organizationId, 'isAllOrgs:', isAllOrgs);

  // If posting to all orgs, return all users
  if (isAllOrgs || !organizationId) {
    console.log('[Push] All orgs or no org specified - returning all users');
    return getAllUserIds(excludeUserId);
  }

  // Get users who should receive this org-specific notification:
  // 1. Users in the same organization
  // 2. Admins, owners, or full_line users (they see everything)
  const { data, error } = await supabase
    .from('users')
    .select('id, organization_id, is_admin, is_owner, is_full_line')
    .neq('id', excludeUserId);

  if (error) {
    console.error('[Push] Error fetching users by org:', error);
    return [];
  }

  const eligibleUsers = data.filter(user => {
    // Include if user is in the same org
    if (user.organization_id === organizationId) return true;
    // Include if user is admin, owner, or full_line (they see all orgs)
    if (user.is_admin || user.is_owner || user.is_full_line) return true;
    return false;
  });

  const userIds = eligibleUsers.map(u => u.id);
  console.log('[Push] Users eligible for org', organizationId, ':', userIds.length, 'users');
  console.log('[Push] Breakdown - same org:', eligibleUsers.filter(u => u.organization_id === organizationId).length,
    ', admin/owner/full_line:', eligibleUsers.filter(u => u.is_admin || u.is_owner || u.is_full_line).length);

  return userIds;
};

// Helper: Resolve WHICH users should receive a notification, honoring the
// per-type preference. Returns USER IDs (not subscription IDs): delivery
// targets users by external_id, so OneSignal routes to each user's CURRENT
// device(s). That makes push survive app updates / reinstalls without chasing
// subscription IDs that change underneath us.
const getSubscriptionIds = async (userIds, preferenceColumn = null) => {
  if (!userIds.length) return [];
  if (!preferenceColumn) return [...new Set(userIds)];

  // A user with no preference row is opted-in by default (defaults are created
  // all-on at registration), so only drop users who EXPLICITLY set it to false.
  const { data: prefs, error: prefError } = await supabase
    .from('user_notification_preferences')
    .select(`user_id, ${preferenceColumn}`)
    .in('user_id', userIds);

  if (prefError) {
    console.error('[Push] Error fetching preferences:', prefError);
    return [];
  }

  const disabled = new Set(
    (prefs || []).filter(p => p[preferenceColumn] === false).map(p => p.user_id)
  );
  const eligibleUserIds = [...new Set(userIds.filter(id => !disabled.has(id)))];
  console.log('[Push]', eligibleUserIds.length, 'eligible users for', preferenceColumn || 'all');
  return eligibleUserIds;
};

// Legacy alias for backward compatibility
const getPlayerIds = getSubscriptionIds;

// Helper: Send push via the send-push-notification edge function.
// `recipientUserIds` is the resolved set of USER IDs to notify (preferences
// already applied above). The edge function targets them by external_id, so
// OneSignal delivers to each user's CURRENT device — push keeps working across
// app updates, reinstalls, and new devices with no ID chasing.
const sendPush = async (recipientUserIds, title, message, data = {}) => {
  console.log('[Push] sendPush called for', recipientUserIds.length, 'users');

  if (!recipientUserIds.length) {
    console.log('[Push] No recipients to send to');
    return { success: false, reason: 'no_recipients' };
  }

  try {
    const { data: result, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        external_user_ids: recipientUserIds,
        title,
        message,
        notification_type: data.type || 'new_post',
        data,
      },
    });

    if (error) {
      console.error('[Push] Edge function error:', error);
      return { success: false, error: error.message };
    }

    console.log('[Push] === SEND-PUSH RESULT ===');
    console.log('[Push] sent:', result?.sent, 'onesignal_id:', result?.onesignal_id);

    return { success: result?.success !== false, result };
  } catch (err) {
    console.error('[Push] Error:', err);
    return { success: false, error: err.message };
  }
};

// ========== Post Notification Helpers ==========

/**
 * Send notification for a new post
 * Filters by organization:
 * - isAllOrgs=true: notify all users
 * - organizationId set: notify users in that org + admins/owners/full_line
 */
export const notifyNewPost = async ({
  senderId,
  senderName,
  postId,
  postPreview,
  organizationId = null,
  isAllOrgs = false,
  notifyPush = true,
}) => {
  console.log('[Push] notifyNewPost called');
  console.log('[Push] Sender ID (excluded):', senderId);
  console.log('[Push] Organization ID:', organizationId, '| isAllOrgs:', isAllOrgs);

  if (!notifyPush) {
    console.log('[Push] Push disabled for this post');
    return { success: true, skipped: true };
  }

  // Get users filtered by organization
  const userIds = await getUserIdsByOrg(senderId, organizationId, isAllOrgs);
  console.log('[Push] Target user IDs:', userIds);

  // Get player IDs for users with push enabled for new posts
  const playerIds = await getPlayerIds(userIds, 'push_new_posts');
  console.log('[Push] After preference filter, subscription IDs:', playerIds);

  return sendPush(
    playerIds,
    `${senderName || 'Someone'} posted`,
    postPreview || 'Shared a new post',
    { post_id: postId, type: 'new_post' }
  );
};

/**
 * Send notification when a post is liked
 */
export const notifyPostLiked = async ({
  senderId,
  senderName,
  postId,
  postAuthorId,
}) => {
  console.log('[Push] notifyPostLiked called');

  if (senderId === postAuthorId) return { success: true, skipped: true };

  const playerIds = await getPlayerIds([postAuthorId], 'push_post_likes');

  return sendPush(
    playerIds,
    'Post Liked',
    `${senderName || 'Someone'} liked your post`,
    { post_id: postId, type: 'post_liked' }
  );
};

// ========== Chat Notification Helpers ==========

/**
 * Send notification for a direct message
 */
export const notifyDirectMessage = async ({
  senderId,
  senderName,
  chatId,
  messagePreview,
}) => {
  console.log('[Push] notifyDirectMessage called');

  // Get chat members except sender
  const { data: members } = await supabase
    .from('chat_members')
    .select('user_id')
    .eq('chat_id', chatId)
    .eq('is_muted', false)
    .neq('user_id', senderId);

  const userIds = members?.map(m => m.user_id) || [];
  const playerIds = await getPlayerIds(userIds, 'push_direct_messages');

  return sendPush(
    playerIds,
    senderName || 'New Message',
    messagePreview || 'You have a new message',
    { chat_id: chatId, type: 'direct_message' }
  );
};

/**
 * Send notification for a group message
 */
export const notifyGroupMessage = async ({
  senderId,
  senderName,
  chatId,
  chatName,
  messagePreview,
}) => {
  console.log('[Push] notifyGroupMessage called');

  // Get unmuted chat members except sender
  const { data: members } = await supabase
    .from('chat_members')
    .select('user_id')
    .eq('chat_id', chatId)
    .eq('is_muted', false)
    .neq('user_id', senderId);

  const userIds = members?.map(m => m.user_id) || [];
  const playerIds = await getPlayerIds(userIds, 'push_group_messages');

  return sendPush(
    playerIds,
    chatName || 'Group Chat',
    `${senderName || 'Someone'}: ${messagePreview || 'sent a message'}`,
    { chat_id: chatId, type: 'group_message' }
  );
};

/**
 * Send notification when user is added to a chat
 */
export const notifyChatMemberAdded = async ({
  senderId,
  targetUserId,
  chatId,
  chatName,
}) => {
  console.log('[Push] notifyChatMemberAdded called');

  const playerIds = await getPlayerIds([targetUserId], 'push_chat_added');

  return sendPush(
    playerIds,
    'Added to Chat',
    `You were added to ${chatName || 'a group chat'}`,
    { chat_id: chatId, type: 'chat_member_added' }
  );
};

/**
 * Send notification when user is removed from a chat
 */
export const notifyChatMemberRemoved = async ({
  senderId,
  targetUserId,
  chatId,
  chatName,
}) => {
  console.log('[Push] notifyChatMemberRemoved called');

  const playerIds = await getPlayerIds([targetUserId], 'push_chat_removed');

  return sendPush(
    playerIds,
    'Removed from Chat',
    `You were removed from ${chatName || 'a group chat'}`,
    { chat_id: chatId, type: 'chat_member_removed' }
  );
};

// ========== Update/Event Notification Helpers ==========

/**
 * Send notification for a new update
 */
export const notifyNewUpdate = async ({
  senderId,
  notificationId,
  title,
  body,
}) => {
  console.log('[Push] notifyNewUpdate called');

  const userIds = await getAllUserIds(senderId);
  const playerIds = await getPlayerIds(userIds, 'push_new_updates');

  return sendPush(
    playerIds,
    title ? `Update: ${title}` : 'New Update',
    body?.substring(0, 100) || 'Tap to read more',
    { notification_id: notificationId, type: 'new_update' }
  );
};

/**
 * Send notification for a new event
 */
export const notifyNewEvent = async ({
  senderId,
  notificationId,
  title,
  body,
}) => {
  console.log('[Push] notifyNewEvent called');

  const userIds = await getAllUserIds(senderId);
  const playerIds = await getPlayerIds(userIds, 'push_new_events');

  return sendPush(
    playerIds,
    title ? `Event: ${title}` : 'New Event',
    body?.substring(0, 100) || 'Tap for details',
    { notification_id: notificationId, type: 'new_event' }
  );
};

// ========== Admin Notification Helpers ==========

/**
 * Send notification when a new user joins
 */
export const notifyNewUserJoined = async ({
  newUserId,
  newUserName,
  newUserEmail,
}) => {
  console.log('[Push] notifyNewUserJoined called');

  // Get admin users
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .eq('is_admin', true);

  const adminIds = admins?.map(a => a.id) || [];
  const playerIds = await getPlayerIds(adminIds);

  return sendPush(
    playerIds,
    'New User Joined',
    `${newUserName || 'A new user'} joined the organization`,
    { user_id: newUserId, type: 'new_user_joined' }
  );
};

/**
 * Send notification when a conversation is reported
 */
export const notifyConversationReported = async ({
  senderId,
  senderName,
  chatId,
  reportReason,
}) => {
  console.log('[Push] notifyConversationReported called');

  // Get admin users
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .eq('is_admin', true);

  const adminIds = admins?.map(a => a.id) || [];
  const playerIds = await getPlayerIds(adminIds);

  return sendPush(
    playerIds,
    'Conversation Reported',
    'A conversation has been reported',
    { chat_id: chatId, type: 'conversation_reported' }
  );
};

/**
 * Send notification to admins when a user RSVPs to an event
 */
export const notifyEventRsvp = async ({
  userId,
  userName,
  eventTitle,
  response,
  notificationId,
}) => {
  console.log('[Push] notifyEventRsvp called');

  // Get admin/owner users
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .or('is_admin.eq.true,is_owner.eq.true');

  const adminIds = admins?.map(a => a.id).filter(id => id !== userId) || [];
  const playerIds = await getPlayerIds(adminIds);

  const responseText = response === 'yes' ? 'Yes' : 'No';

  return sendPush(
    playerIds,
    `RSVP: ${eventTitle || 'Event'}`,
    `${userName || 'Someone'} responded ${responseText}`,
    { notification_id: notificationId, type: 'event_rsvp' }
  );
};
