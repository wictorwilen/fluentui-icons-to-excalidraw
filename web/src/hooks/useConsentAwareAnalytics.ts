import { useEffect } from 'react';
import { useCookieConsent } from './useCookieConsent';
import { initializeGA, enableAnalytics, disableAnalytics } from '../services/analytics';

/**
 * Hook that manages Google Analytics initialization based on cookie consent
 */
export function useConsentAwareAnalytics() {
  const { consentState, hasConsent } = useCookieConsent();

  useEffect(() => {
    if (!hasConsent) {
      // No consent decision made yet, don't initialize analytics
      return;
    }

    if (consentState?.analytics) {
      // Analytics consent granted, initialize or enable GA
      enableAnalytics();
    } else {
      // Analytics consent not granted or revoked, disable GA
      disableAnalytics();
    }
  }, [consentState, hasConsent]);

  // Initial GA setup (will only initialize if consent is already granted)
  useEffect(() => {
    initializeGA();
  }, []);
}
