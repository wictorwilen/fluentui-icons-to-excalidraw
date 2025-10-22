import { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';

export interface CookieConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export interface CookieConsentHook {
  hasConsent: boolean;
  consentState: CookieConsentState | null;
  showBanner: boolean;
  acceptAll: () => void;
  acceptSelected: (state: CookieConsentState) => void;
  rejectAll: () => void;
  resetConsent: () => void;
}

const COOKIE_CONSENT_KEY = 'cookie_consent';
const COOKIE_CONSENT_VERSION = '1.0';

const defaultConsentState: CookieConsentState = {
  necessary: true, // Always true, can't be disabled
  analytics: false,
  marketing: false,
  preferences: false,
};

export function useCookieConsent(): CookieConsentHook {
  const [cookies, setCookie, removeCookie] = useCookies([COOKIE_CONSENT_KEY]);
  const [showBanner, setShowBanner] = useState(false);
  const [consentState, setConsentState] = useState<CookieConsentState | null>(null);

  useEffect(() => {
    const storedConsent = cookies[COOKIE_CONSENT_KEY];

    if (storedConsent && storedConsent.version === COOKIE_CONSENT_VERSION) {
      setConsentState(storedConsent.state);
      setShowBanner(false);
    } else {
      // No consent found or version mismatch, show banner
      setShowBanner(true);
      setConsentState(null);
    }
  }, [cookies]);

  const saveConsent = (state: CookieConsentState) => {
    const consentData = {
      state,
      version: COOKIE_CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };

    // Set cookie to expire in 1 year
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    setCookie(COOKIE_CONSENT_KEY, consentData, {
      expires: expiryDate,
      path: '/',
      sameSite: 'lax',
      secure: window.location.protocol === 'https:',
    });

    setConsentState(state);
    setShowBanner(false);
  };

  const acceptAll = () => {
    const allAcceptedState: CookieConsentState = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    saveConsent(allAcceptedState);
  };

  const acceptSelected = (state: CookieConsentState) => {
    // Ensure necessary cookies are always enabled
    const finalState = { ...state, necessary: true };
    saveConsent(finalState);
  };

  const rejectAll = () => {
    // Only accept necessary cookies
    saveConsent(defaultConsentState);
  };

  const resetConsent = () => {
    removeCookie(COOKIE_CONSENT_KEY, { path: '/' });
    setConsentState(null);
    setShowBanner(true);
  };

  return {
    hasConsent: consentState !== null,
    consentState,
    showBanner,
    acceptAll,
    acceptSelected,
    rejectAll,
    resetConsent,
  };
}
