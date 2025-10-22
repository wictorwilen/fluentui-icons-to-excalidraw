/**
 * Google Analytics tracking utilities with Google Consent Mode v2 support
 */

// Extend the Window interface to include gtag
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

let gaInitialized = false;
let consentInitialized = false;

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

    const consentCookie = cookies['cookie-consent'];
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
 * Initialize Google Analytics with Consent Mode v2
 * Sets up consent defaults and loads GA script
 */
export const initializeGA = (): void => {
  const trackingId = process.env.REACT_APP_GA_TRACKING_ID;

  if (!trackingId || typeof window === 'undefined') {
    return;
  }

  // Initialize dataLayer and gtag function first
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  // Set default consent state (denied) before loading GA - this is required for Consent Mode v2
  if (!consentInitialized) {
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'granted', // Essential for site functionality
      personalization_storage: 'denied',
      security_storage: 'granted', // Essential for security
    });
    consentInitialized = true;
  }

  // Load the Google Analytics script (this happens regardless of consent)
  if (!gaInitialized) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script);

    // Initialize gtag with timestamp
    window.gtag('js', new Date());

    gaInitialized = true;
  }

  // Configure GA tracking
  window.gtag('config', trackingId, {
    page_title: document.title,
    page_location: window.location.href,
  });

  // Update consent based on current user preferences
  const consentData = getConsentState();
  if (consentData) {
    updateGAConsent(consentData);
  }
};

/**
 * Update Google Analytics consent based on user preferences
 */
export const updateGAConsent = (consentData: {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}): void => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  // Update consent state using Google Consent Mode v2
  window.gtag('consent', 'update', {
    ad_storage: consentData.marketing ? 'granted' : 'denied',
    ad_user_data: consentData.marketing ? 'granted' : 'denied',
    ad_personalization: consentData.marketing ? 'granted' : 'denied',
    analytics_storage: consentData.analytics ? 'granted' : 'denied',
    functionality_storage: 'granted', // Always granted for essential functionality
    personalization_storage: consentData.preferences ? 'granted' : 'denied',
    security_storage: 'granted', // Always granted for security
  });
};

/**
 * Check if Google Analytics is loaded and available
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
