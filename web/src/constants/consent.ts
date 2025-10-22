/**
 * Shared constants for cookie consent and analytics
 */

export const COOKIE_CONSENT_KEY = 'cookie_consent';
export const COOKIE_CONSENT_VERSION = '1.0';

/**
 * Cookie consent state interface
 */
export interface CookieConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

/**
 * Default cookie consent state
 */
export const DEFAULT_COOKIE_CONSENT_STATE: CookieConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
};