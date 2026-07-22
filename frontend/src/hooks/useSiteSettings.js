// src/hooks/useSiteSettings.js
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPublicSettings } from '../api/products';

const FALLBACK_NAME = 'E-Waste Mart';

/**
 * Shared access to the platform's public settings (platform name, tagline,
 * support details, feature toggles). React Query dedupes the request across
 * every component that calls this, so it's cheap to use anywhere the site
 * name or contact details are shown.
 */
export function useSiteSettings() {
  return useQuery({
    queryKey: ['public-settings'],
    queryFn: () => getPublicSettings().then(res => res.data),
    staleTime: 60_000,
  });
}

/**
 * Convenience wrapper: returns the current platform name, falling back to the
 * default while the request is in flight or if it fails.
 */
export function usePlatformName() {
  const { data } = useSiteSettings();
  return data?.platform_name || FALLBACK_NAME;
}

/**
 * Mounted once (in App) to keep the browser tab title in sync with the
 * configured platform name whenever the Super Admin changes it in Settings.
 */
export function useSyncDocumentTitle() {
  const platformName = usePlatformName();

  useEffect(() => {
    if (platformName) {
      document.title = platformName;
    }
  }, [platformName]);
}

export { FALLBACK_NAME };
