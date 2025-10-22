import { useEffect } from 'react';
import { useCookieConsent } from './useCookieConsent';
import { initializeGA, updateGAConsent } from '../services/analytics';

/**
 * Hook that manages Google Analytics initialization with Consent Mode v2
 */
export function useConsentAwareAnalytics() {
  const { consentState, hasConsent } = useCookieConsent();

  // Initialize GA immediately to set up consent defaults
  // This is required for Google Consent Mode v2 - we need to load GA with denied consent first
  useEffect(() => {
    initializeGA();
  }, []);

  // Update consent when user makes a decision
  useEffect(() => {
    if (hasConsent && consentState) {
      // User has made a consent decision, update GA consent
      updateGAConsent(consentState);
    }
  }, [consentState, hasConsent]);
}
