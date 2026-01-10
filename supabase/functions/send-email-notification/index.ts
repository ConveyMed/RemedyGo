import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  // Target users
  user_ids?: string[];          // Specific user IDs to email
  exclude_user_id?: string;     // User to exclude (e.g., the sender)

  // Email content
  subject: string;

  // Either provide template + data, or raw HTML
  template?:
    | 'new_post'
    | 'new_comment'
    | 'new_update'
    | 'new_event'
    | 'event_reminder'
    | 'new_user'
    | 'report_alert'
    | 'rsvp_digest';
  template_data?: Record<string, string>;
  html?: string;

  // Notification type for preference checking
  notification_type:
    | 'new_post'
    | 'post_comment'
    | 'new_update'
    | 'new_event'
    | 'event_reminder';
}

// Map notification types to preference column names
const preferenceMap: Record<string, string> = {
  'new_post': 'email_new_posts',
  'post_comment': 'email_post_comments',
  'new_update': 'email_new_updates',
  'new_event': 'email_new_events',
  'event_reminder': 'email_event_reminders',
};

// Email templates
const templates: Record<string, (data: Record<string, string>) => string> = {
  new_post: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
        .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">New Post</h1>
        </div>
        <div class="content">
          <p>Hi ${data.recipient_name || 'there'},</p>
          <p><strong>${data.author_name}</strong> just published a new post:</p>
          <p style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #1e40af;">
            ${data.post_preview || 'Check out the latest update!'}
          </p>
          <p style="margin-top: 24px;">
            <a href="${data.post_url || '#'}" class="button">View Post</a>
          </p>
        </div>
        <div class="footer">
          <p>ConveyMed - Medical Communication Platform</p>
          <p>You can manage your notification preferences in the app settings.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  new_comment: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
        .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">New Comment</h1>
        </div>
        <div class="content">
          <p>Hi ${data.recipient_name || 'there'},</p>
          <p><strong>${data.commenter_name}</strong> commented on your post:</p>
          <p style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #1e40af;">
            "${data.comment_text}"
          </p>
          <p style="margin-top: 24px;">
            <a href="${data.post_url || '#'}" class="button">View Comment</a>
          </p>
        </div>
        <div class="footer">
          <p>ConveyMed - Medical Communication Platform</p>
          <p>You can manage your notification preferences in the app settings.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  new_update: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
        .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">${data.title || 'Organization Update'}</h1>
        </div>
        <div class="content">
          <p>Hi ${data.recipient_name || 'there'},</p>
          <p>A new update has been published:</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #1e40af;">
            ${data.body || ''}
          </div>
          <p style="margin-top: 24px;">
            <a href="${data.update_url || '#'}" class="button">View Update</a>
          </p>
        </div>
        <div class="footer">
          <p>ConveyMed - Medical Communication Platform</p>
          <p>You can manage your notification preferences in the app settings.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  new_event: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
        .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 8px; }
        .button-secondary { display: inline-block; background: #64748b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">New Event</h1>
        </div>
        <div class="content">
          <p>Hi ${data.recipient_name || 'there'},</p>
          <p>You're invited to a new event:</p>
          <h2 style="color: #1e40af;">${data.title || 'Upcoming Event'}</h2>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
            ${data.body || ''}
          </div>
          <p style="margin-top: 24px;">
            <a href="${data.event_url || '#'}" class="button">View Event</a>
          </p>
        </div>
        <div class="footer">
          <p>ConveyMed - Medical Communication Platform</p>
          <p>You can manage your notification preferences in the app settings.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  event_reminder: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
        .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Event Reminder</h1>
        </div>
        <div class="content">
          <p>Hi ${data.recipient_name || 'there'},</p>
          <p>This is a reminder about an upcoming event:</p>
          <h2 style="color: #1e40af;">${data.title || 'Upcoming Event'}</h2>
          <p><strong>Starting:</strong> ${data.event_time || 'Soon'}</p>
          <p style="margin-top: 24px;">
            <a href="${data.event_url || '#'}" class="button">View Event</a>
          </p>
        </div>
        <div class="footer">
          <p>ConveyMed - Medical Communication Platform</p>
        </div>
      </div>
    </body>
    </html>
  `,

  new_user: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
        .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">New User Joined</h1>
        </div>
        <div class="content">
          <p>Hi Admin,</p>
          <p>A new user has joined your organization:</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
            <p><strong>Name:</strong> ${data.user_name || 'New User'}</p>
            <p><strong>Email:</strong> ${data.user_email || ''}</p>
          </div>
          <p style="margin-top: 24px;">
            <a href="${data.manage_url || '#'}" class="button">Manage Users</a>
          </p>
        </div>
        <div class="footer">
          <p>ConveyMed - Medical Communication Platform</p>
        </div>
      </div>
    </body>
    </html>
  `,

  report_alert: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
        .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Conversation Reported</h1>
        </div>
        <div class="content">
          <p>Hi Admin,</p>
          <p>A conversation has been reported by a user:</p>
          <div style="background: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #dc2626;">
            <p><strong>Reported by:</strong> ${data.reporter_name || 'A user'}</p>
            <p><strong>Reason:</strong> ${data.reason || 'No reason provided'}</p>
          </div>
          <p style="margin-top: 24px;">
            <a href="${data.review_url || '#'}" class="button">Review Report</a>
          </p>
        </div>
        <div class="footer">
          <p>ConveyMed - Medical Communication Platform</p>
        </div>
      </div>
    </body>
    </html>
  `,

  rsvp_digest: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
        .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
        .stat { display: inline-block; padding: 8px 16px; border-radius: 8px; margin-right: 8px; }
        .stat-yes { background: #dcfce7; color: #166534; }
        .stat-no { background: #fee2e2; color: #991b1b; }
        .stat-pending { background: #fef3c7; color: #92400e; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">RSVP Summary</h1>
        </div>
        <div class="content">
          <p>Hi ${data.recipient_name || 'there'},</p>
          <p>Here's the RSVP summary for your event:</p>
          <h2 style="color: #1e40af;">${data.event_title || 'Your Event'}</h2>
          <div style="margin: 20px 0;">
            <span class="stat stat-yes">Yes: ${data.yes_count || 0}</span>
            <span class="stat stat-no">No: ${data.no_count || 0}</span>
            <span class="stat stat-pending">Pending: ${data.pending_count || 0}</span>
          </div>
          <p style="margin-top: 24px;">
            <a href="${data.event_url || '#'}" class="button">View All Responses</a>
          </p>
        </div>
        <div class="footer">
          <p>ConveyMed - Medical Communication Platform</p>
        </div>
      </div>
    </body>
    </html>
  `,
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: EmailNotificationRequest = await req.json();
    console.log("Email notification request:", payload.notification_type, "Subject:", payload.subject);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "ConveyMed <noreply@conveymed.com>";

    if (!RESEND_API_KEY) {
      throw new Error("Resend API key not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get target users with their email addresses
    if (!payload.user_ids || payload.user_ids.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No target users specified" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user emails and check preferences
    const preferenceColumn = preferenceMap[payload.notification_type];

    // First get user emails from users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .in('id', payload.user_ids);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw new Error("Failed to fetch users");
    }

    // Get preferences for these users
    let prefsQuery = supabase
      .from('user_notification_preferences')
      .select('user_id')
      .in('user_id', payload.user_ids);

    if (preferenceColumn) {
      prefsQuery = prefsQuery.eq(preferenceColumn, true);
    }

    const { data: prefs, error: prefsError } = await prefsQuery;

    if (prefsError) {
      console.error("Error fetching preferences:", prefsError);
    }

    // Filter users who have email enabled
    const enabledUserIds = new Set(prefs?.map(p => p.user_id) || payload.user_ids);
    let filteredUsers = (users || []).filter(u => enabledUserIds.has(u.id));

    // Exclude sender if specified
    if (payload.exclude_user_id) {
      filteredUsers = filteredUsers.filter(u => u.id !== payload.exclude_user_id);
    }

    if (filteredUsers.length === 0) {
      console.log("No target users with email enabled");
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No target users with email enabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending email to ${filteredUsers.length} users`);

    // Get HTML content
    let htmlContent = payload.html;
    if (!htmlContent && payload.template && templates[payload.template]) {
      htmlContent = templates[payload.template](payload.template_data || {});
    }

    if (!htmlContent) {
      throw new Error("No email content provided");
    }

    // Send emails (batch or individual)
    const emails = filteredUsers.map(u => u.email).filter(Boolean);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: emails,
        subject: payload.subject,
        html: htmlContent,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Resend API error: ${resendResponse.status}`);
    }

    const resendData = await resendResponse.json();
    console.log("Resend response:", resendData);

    return new Response(
      JSON.stringify({
        success: true,
        sent: emails.length,
        resend_id: resendData.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
