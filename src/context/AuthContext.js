import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import { get, set, del } from 'idb-keyval';
import { logoutOneSignal } from '../services/onesignal';
// Note: OneSignal initialization is now handled by dedicated components in App.js

const AuthContext = createContext({});

// Keys for cached auth data
const CACHED_USER_KEY = 'cached_auth_user';
const CACHED_PROFILE_KEY = 'cached_auth_profile';
const CACHED_VIEW_MODE_KEY = 'cached_view_mode';
const CACHED_ORGANIZATIONS_KEY = 'cached_organizations';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [viewMode, setViewMode] = useState(null); // Current org being viewed (for admin/full_line)
  const profileFetchRef = useRef(null);

  // Fetch organizations on mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      const isOffline = !navigator.onLine;

      if (isOffline) {
        try {
          const cachedOrgs = await get(CACHED_ORGANIZATIONS_KEY);
          if (cachedOrgs) {
            setOrganizations(cachedOrgs);
          }
        } catch (e) {
          console.log('Error loading cached organizations:', e);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.log('Organizations fetch error:', error);
          // Try cached on error
          const cachedOrgs = await get(CACHED_ORGANIZATIONS_KEY);
          if (cachedOrgs) {
            setOrganizations(cachedOrgs);
          }
          return;
        }

        if (data) {
          await set(CACHED_ORGANIZATIONS_KEY, data);
          setOrganizations(data);
        }
      } catch (err) {
        console.log('Organizations fetch error:', err);
      }
    };

    fetchOrganizations();
  }, []);

  // Load cached viewMode on mount
  useEffect(() => {
    const loadViewMode = async () => {
      try {
        const cachedViewMode = await get(CACHED_VIEW_MODE_KEY);
        if (cachedViewMode) {
          setViewMode(cachedViewMode);
        }
      } catch (e) {
        console.log('Error loading cached viewMode:', e);
      }
    };
    loadViewMode();
  }, []);

  // Set default viewMode when userProfile loads
  useEffect(() => {
    console.log('[AuthContext] viewMode effect:', {
      userOrgId: userProfile?.organization_id,
      currentViewMode: viewMode
    });
    if (userProfile?.organization_id && !viewMode) {
      console.log('[AuthContext] Setting viewMode to user org:', userProfile.organization_id);
      setViewMode(userProfile.organization_id);
    }
  }, [userProfile?.organization_id, viewMode]);

  // Fetch profile when user changes
  useEffect(() => {
    if (!authChecked) return; // Wait for auth to be checked first

    if (!user?.id) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    // Keep loading true while fetching profile
    setLoading(true);

    if (profileFetchRef.current) {
      profileFetchRef.current.cancelled = true;
    }

    const fetchProfile = async () => {
      const fetchState = { cancelled: false };
      profileFetchRef.current = fetchState;

      // Check if offline
      const isOffline = !navigator.onLine;

      if (isOffline) {
        // Load cached profile when offline
        try {
          const cachedProfile = await get(CACHED_PROFILE_KEY);
          if (cachedProfile && cachedProfile.id === user.id) {
            setUserProfile(cachedProfile);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.log('Error loading cached profile:', e);
        }
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (fetchState.cancelled) return;

        if (error) {
          console.log('Profile fetch error:', error);
          // Try cached profile on error
          const cachedProfile = await get(CACHED_PROFILE_KEY);
          if (cachedProfile && cachedProfile.id === user.id) {
            setUserProfile(cachedProfile);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
          return;
        }

        // Cache the profile for offline use
        await set(CACHED_PROFILE_KEY, profile);
        setUserProfile(profile);
        setLoading(false);
      } catch (err) {
        console.log('Profile fetch error:', err);
        // Try cached profile on error
        try {
          const cachedProfile = await get(CACHED_PROFILE_KEY);
          if (cachedProfile && cachedProfile.id === user.id) {
            setUserProfile(cachedProfile);
          } else {
            setUserProfile(null);
          }
        } catch (e) {
          setUserProfile(null);
        }
        setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      if (profileFetchRef.current) {
        profileFetchRef.current.cancelled = true;
      }
    };
  }, [user?.id, authChecked]);

  // Main auth effect
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const isOffline = !navigator.onLine;

      if (isOffline) {
        // Offline: try to load cached user
        try {
          const cachedUser = await get(CACHED_USER_KEY);
          if (cachedUser) {
            setUser(cachedUser);
          } else {
            setUser(null);
          }
        } catch (e) {
          console.log('Error loading cached user:', e);
          setUser(null);
        }
        setAuthChecked(true);
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.log('getSession error:', error);
          // Try cached user on error
          const cachedUser = await get(CACHED_USER_KEY);
          if (cachedUser) {
            setUser(cachedUser);
          } else {
            setUser(null);
          }
          setAuthChecked(true);
          return;
        }

        if (session) {
          // Cache user for offline use
          await set(CACHED_USER_KEY, session.user);
          setUser(session.user);
          // OneSignal initialization handled by dedicated components in App.js
        } else {
          setUser(null);
        }

        setAuthChecked(true);
      } catch (err) {
        console.log('Auth init error:', err);
        // Try cached user on error
        try {
          const cachedUser = await get(CACHED_USER_KEY);
          if (cachedUser) {
            setUser(cachedUser);
          }
        } catch (e) {
          // Ignore cache error
        }
        setAuthChecked(true);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        logoutOneSignal();
      } else if (session) {
        setUser(session.user);
        // OneSignal device registration handled by DeviceRegistration component in App.js
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (!user?.id) return;

    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.log('Refresh profile error:', error);
        return;
      }

      setUserProfile(profile);
    } catch (err) {
      console.log('Refresh error:', err);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Logout from OneSignal
    await logoutOneSignal();
    // Clear cached auth data
    try {
      await del(CACHED_USER_KEY);
      await del(CACHED_PROFILE_KEY);
      await del(CACHED_VIEW_MODE_KEY);
    } catch (e) {
      console.log('Error clearing cached auth:', e);
    }
    setUser(null);
    setUserProfile(null);
    setViewMode(null);
  };

  const resetIntake = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ profile_complete: false })
        .eq('id', user.id);

      if (error) {
        console.log('Reset intake error:', error);
        return;
      }

      // Update local state
      setUserProfile(prev => prev ? { ...prev, profile_complete: false } : null);
    } catch (err) {
      console.log('Reset intake error:', err);
    }
  };

  // Switch organization view (for admin/full_line users)
  const switchOrganizationView = async (orgId) => {
    if (!canSwitchOrgs) return;

    setViewMode(orgId);
    try {
      await set(CACHED_VIEW_MODE_KEY, orgId);
    } catch (e) {
      console.log('Error caching viewMode:', e);
    }
  };

  // Get organization by ID
  const getOrganization = (orgId) => {
    return organizations.find(org => org.id === orgId);
  };

  // Get organization by code (e.g., 'AM' or 'OR')
  const getOrganizationByCode = (code) => {
    return organizations.find(org => org.code === code);
  };

  const isAuthenticated = !!user;
  const isProfileComplete = userProfile?.profile_complete === true;
  const isAdmin = userProfile?.is_admin === true;
  const isFullLine = userProfile?.is_full_line === true;
  const canSwitchOrgs = isAdmin || isFullLine;
  const canCreateContent = isAdmin || userProfile?.is_owner === true;
  const userOrganization = userProfile?.organization_id;

  // User needs onboarding if: authenticated, has profile, but no org assigned (and not admin)
  const needsOnboarding = isAuthenticated && userProfile && !userOrganization && !isAdmin;

  // Current view org (what the user is looking at)
  // For admin/full_line: their selected viewMode
  // For regular users: their assigned org
  const currentViewOrgId = canSwitchOrgs ? viewMode : userOrganization;
  const currentViewOrg = getOrganization(currentViewOrgId);

  // Debug logging
  console.log('[AuthContext] Auth state:', {
    isAuthenticated,
    isAdmin,
    isFullLine,
    canSwitchOrgs,
    userOrganization,
    viewMode,
    currentViewOrgId,
    needsOnboarding,
    loading
  });

  const value = {
    user,
    userProfile,
    loading,
    refreshProfile,
    refreshUserProfile: refreshProfile, // Alias for onboarding
    signOut,
    logout: signOut, // Alias for onboarding
    resetIntake,
    isAuthenticated,
    isProfileComplete,
    needsOnboarding,
    // Organization-related
    organizations,
    userOrganization,
    viewMode,
    currentViewOrgId,
    currentViewOrg,
    switchOrganizationView,
    getOrganization,
    getOrganizationByCode,
    // Role-related
    isAdmin,
    isFullLine,
    canSwitchOrgs,
    canCreateContent
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
