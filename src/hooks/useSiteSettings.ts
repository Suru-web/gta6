'use client';

import { useEffect, useState } from 'react';

/** Refresh while the page is open and whenever a visitor returns to the tab. */
export function useSiteSettings() {
  const [sideQuestVisible, setSideQuestVisible] = useState<boolean | null>(null);
  const [settingsError, setSettingsError] = useState(false);
  useEffect(() => {
    let active = true;
    let requestId = 0;
    const refresh = async () => {
      const id = ++requestId;
      try {
        const response = await fetch('/api/site-settings', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success || typeof data.settings?.sideQuestVisible !== 'boolean') throw new Error('Invalid site settings response');
        if (active && id === requestId) {
          setSideQuestVisible(data.settings.sideQuestVisible);
          setSettingsError(false);
        }
      } catch {
        if (active && id === requestId) setSettingsError(true);
      }
    };
    const onVisibility = () => { if (document.visibilityState === 'visible') void refresh(); };
    void refresh();
    const interval = window.setInterval(onVisibility, 10000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  return { sideQuestVisible, settingsError };
}
