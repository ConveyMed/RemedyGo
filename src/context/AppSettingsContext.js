import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../config/supabase';

const AppSettingsContext = createContext({});

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};

export const AppSettingsProvider = ({ children }) => {
  const { user, userProfile } = useAuth();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // Check if current user is admin or owner
  const isAdmin = userProfile?.is_admin === true;
  const isOwner = userProfile?.is_owner === true || userProfile?.role === 'owner';
  const canUpdateSettings = isAdmin || isOwner;

  // Load settings on mount and subscribe to real-time changes
  useEffect(() => {
    loadSettings();

    // Real-time subscription for settings changes
    const channel = supabase
      .channel('app_settings_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings' },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setSettings(prev => ({
              ...prev,
              [payload.new.key]: payload.new.value
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value');

      if (error) {
        console.error('Error loading app settings:', error);
        return;
      }

      // Convert array to object
      const settingsObj = {};
      (data || []).forEach(item => {
        settingsObj[item.key] = item.value;
      });

      setSettings(settingsObj);
    } catch (err) {
      console.error('Error loading app settings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update a setting (admin or owner)
  const updateSetting = useCallback(async (key, value) => {
    if (!canUpdateSettings) return false;

    // Optimistic update
    setSettings(prev => ({ ...prev, [key]: value }));

    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        }, {
          onConflict: 'key'
        });

      if (error) {
        console.error('Error updating setting:', error);
        // Reload to revert
        loadSettings();
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error updating setting:', err);
      loadSettings();
      return false;
    }
  }, [canUpdateSettings, user?.id]);

  const value = {
    settings,
    loading,
    loadSettings,
    updateSetting,
    isAdmin,
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};
