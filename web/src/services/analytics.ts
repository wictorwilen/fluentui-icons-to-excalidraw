/**
 * Google Analytics tracking utilities with basic consent support
 */

import { COOKIE_CONSENT_KEY } from '../constants/consent';

// Extend the Window interface to include gtag
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

let gaInitialized = false;

/**
 * Get current consent state from cookies
 */
const getConsentState = () => {
  if (typeof document === 'undefined') return null;

  try {
    const cookies = document.cookie.split(';').reduce(
      (acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = decodeURIComponent(value);
        return acc;
      },
      {} as Record<string, string>
    );

    const consentCookie = cookies[COOKIE_CONSENT_KEY];
    if (!consentCookie) return null;

    const parsedCookie = JSON.parse(consentCookie);
    // Return the state object, not the full cookie structure
    return parsedCookie.state || null;
  } catch {
    return null;
  }
};/**
 * Check if analytics cookies are consented to
 */
const hasAnalyticsConsent = (): boolean => {
  const consentData = getConsentState();
  return consentData?.analytics === true;
};

/**
 * Initialize Google Analytics with basic consent checking
 * Only loads GA if user has consented to analytics
 */
export const initializeGA = (): void => {
  const trackingId = process.env.REACT_APP_GA_TRACKING_ID;

  if (!trackingId || typeof window === 'undefined') {
    return;
  }

  // Check if user has consented to analytics
  const consentData = getConsentState();
  if (!consentData?.analytics) {
    return; // Don't load GA if no analytics consent
  }

  // Only initialize if not already done
  if (gaInitialized) {
    return;
  }

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  // Load the Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
  const firstScript = document.getElementsByTagName('script')[0];
  if (firstScript && firstScript.parentNode) { 
    firstScript.parentNode.insertBefore(script, firstScript); 
  }

  // Initialize gtag with timestamp
  window.gtag('js', new Date());

  // Configure GA tracking
  window.gtag('config', trackingId, {
    page_title: document.title,
    page_location: window.location.href,
    debug_mode: process.env.NODE_ENV === 'development'
  });

  gaInitialized = true;
};

/**
 * Update Google Analytics based on user consent
 * Reinitializes GA if analytics consent is granted, or removes it if denied
 */
export const updateGAConsent = (consentData: {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}): void => {
  if (consentData.analytics && !gaInitialized) {
    // User granted consent and GA is not loaded - initialize it
    initializeGA();
  } else if (!consentData.analytics && gaInitialized) {
    // User denied consent and GA is loaded - disable tracking
    // Note: We can't completely unload GA, but we can stop sending events
    gaInitialized = false;
  }
};

/**
 * Check if Google Analytics is loaded and user has consented
 */
export const isGALoaded = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    typeof window.gtag === 'function' &&
    !!process.env.REACT_APP_GA_TRACKING_ID &&
    gaInitialized &&
    hasAnalyticsConsent()
  );
};

/**
 * Track a page view
 */
export const trackPageView = (path: string, title?: string): void => {
  if (!isGALoaded()) return;

  window.gtag('config', process.env.REACT_APP_GA_TRACKING_ID!, {
    page_path: path,
    page_title: title || document.title,
    debug_mode: process.env.NODE_ENV === 'development'
  });
};

/**
 * Track a custom event
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
): void => {
  if (!isGALoaded()) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

/**
 * Track icon download events
 */
export const trackIconDownload = (iconName: string, format: string): void => {
  trackEvent('download', 'icon', `${iconName} - ${format}`);
};

/**
 * Track emoji download events
 */
export const trackEmojiDownload = (emojiName: string, format: string): void => {
  trackEvent('download', 'emoji', `${emojiName} - ${format}`);
};

/**
 * Track search events
 */
export const trackSearch = (searchTerm: string, resultsCount: number): void => {
  trackEvent('search', 'content', searchTerm, resultsCount);
};

/**
 * Track filter usage
 */
export const trackFilter = (filterType: string, filterValue: string): void => {
  trackEvent('filter', 'content', `${filterType}: ${filterValue}`);
};

/**
 * Track category selection
 */
export const trackCategorySelect = (category: string): void => {
  trackEvent('select_category', 'navigation', category);
};

/**
 * Track library actions
 */
export const trackLibraryAction = (action: 'view' | 'download', libraryType: string): void => {
  trackEvent(action, 'library', libraryType);
};

/**
 * Track external link clicks
 */
export const trackExternalLink = (url: string, linkText: string): void => {
  trackEvent('click', 'external_link', `${linkText} - ${url}`);
};

/**
 * Track error events
 */
export const trackError = (errorType: string, errorMessage: string): void => {
  trackEvent('error', 'application', `${errorType}: ${errorMessage}`);
};
