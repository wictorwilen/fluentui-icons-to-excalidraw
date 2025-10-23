/**
 * Google Analytics tracking utilities with consent support
 * GA script is loaded in index.html, this service manages consent and tracking
 */

import { COOKIE_CONSENT_KEY } from '../constants/consent';

// Extend the Window interface to include gtag and GA_TRACKING_ID
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
    GA_TRACKING_ID?: string;
  }
}

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
 * Initialize Google Analytics tracking
 * GA script is already loaded in index.html, this just enables tracking if consented
 */
export const initializeGA = (): void => {
  if (!isGAAvailable()) {
    return;
  }

  // Enable page view tracking if user has consented
  const consentData = getConsentState();
  if (consentData?.analytics) {
    enableGATracking();
  }
};

/**
 * Enable GA tracking by sending initial page view
 */
const enableGATracking = (): void => {
  if (!isGAAvailable()) return;

  window.gtag('config', window.GA_TRACKING_ID!, {
    page_title: document.title,
    page_location: window.location.href,
    send_page_view: true
  });
};

/**
 * Update Google Analytics based on user consent
 */
export const updateGAConsent = (consentData: {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}): void => {
  if (!isGAAvailable()) return;

  if (consentData.analytics) {
    // User granted consent - enable tracking
    enableGATracking();
  }
  // Note: We can't disable GA once loaded, but we check consent before each tracking call
};

/**
 * Check if Google Analytics is available (script loaded from index.html)
 */
const isGAAvailable = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    typeof window.gtag === 'function' &&
    !!window.GA_TRACKING_ID
  );
};

/**
 * Check if Google Analytics is available and user has consented
 */
export const isGALoaded = (): boolean => {
  return isGAAvailable() && hasAnalyticsConsent();
};

/**
 * Track a page view
 */
export const trackPageView = (path: string, title?: string): void => {
  if (!isGALoaded()) return;

  window.gtag('config', window.GA_TRACKING_ID!, {
    page_path: path,
    page_title: title || document.title
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

/**
 * Track favorite toggle events
 */
export const trackFavoriteToggle = (
  itemType: 'icon' | 'emoji',
  itemName: string,
  action: 'add' | 'remove'
): void => {
  trackEvent(`favorite_${action}`, itemType, itemName);
};

/**
 * Track style selection changes
 */
export const trackStyleSelection = (
  selectedStyles: string[],
  totalAvailableStyles: number
): void => {
  const selectedCount = selectedStyles.length;
  const stylesList = selectedStyles.sort().join(', ') || 'none';
  
  trackEvent('style_filter', 'filter', stylesList, selectedCount);
  
  // Track specific analytics about style selection behavior
  if (selectedCount === 0) {
    trackEvent('style_filter_cleared', 'filter', 'all_styles_deselected');
  } else if (selectedCount === totalAvailableStyles) {
    trackEvent('style_filter_all', 'filter', 'all_styles_selected');
  } else {
    // Track individual popular styles
    selectedStyles.forEach(style => {
      trackEvent('style_selected', 'filter', style);
    });
  }
};
