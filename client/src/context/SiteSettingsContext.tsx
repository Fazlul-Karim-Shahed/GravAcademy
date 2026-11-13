'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  logoUrl: string;
  [key: string]: any;
}

export const FEATURE_FLAG_LABELS: Record<string, string> = {
  admissions: 'Admission', courses: 'Course Management', batches: 'Batch Management',
  freeClasses: 'Free Classes', jobs: 'Job Circulars', userManagement: 'User Management',
  finance: 'Finance Management', exams: 'Exam Management', assignments: 'Assignment Management',
  liveClasses: 'Live Classes', reports: 'Reports', auditLogs: 'Audit Logs',
};
export const DEFAULT_FEATURE_FLAGS: Record<string, boolean> = Object.fromEntries(
  Object.keys(FEATURE_FLAG_LABELS).map((key) => [key, true])
);

interface SiteSettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<boolean>;
  featureFlags: Record<string, boolean>;
  isFeatureEnabled: (key: string, isSuperadmin?: boolean) => boolean;
}

const defaultSettings: SiteSettings = {
  siteName: 'Grav Academy',
  siteTagline: 'ক্লাস ৬ – ১২ একাডেমিক কেয়ার',
  logoUrl: '',
};

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: defaultSettings,
  loading: true,
  refreshSettings: async () => {},
  updateSettings: async () => false,
  featureFlags: DEFAULT_FEATURE_FLAGS,
  isFeatureEnabled: () => true,
});

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [featureFlags, setFeatureFlags] = useState(DEFAULT_FEATURE_FLAGS);
  const isFeatureEnabled = useCallback((key: string, isSuperadmin = false) => {
    return isSuperadmin || featureFlags[key] !== false;
  }, [featureFlags]);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data?.success && res.data?.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data.data,
        }));
        setFeatureFlags({ ...DEFAULT_FEATURE_FLAGS, ...(res.data.data.featureFlags || {}) });
      }
    } catch (err) {
      console.error('Failed to load site settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<SiteSettings>): Promise<boolean> => {
    try {
      const res = await api.put('/admin/settings', newSettings);
      if (res.data?.success) {
        setSettings((prev) => ({
          ...prev,
          ...newSettings,
          ...res.data.data,
        }));
        if (newSettings.featureFlags) setFeatureFlags({ ...DEFAULT_FEATURE_FLAGS, ...newSettings.featureFlags });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update settings:', err);
      return false;
    }
  };

  return (
    <SiteSettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings: fetchSettings,
        updateSettings,
        featureFlags,
        isFeatureEnabled,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);
