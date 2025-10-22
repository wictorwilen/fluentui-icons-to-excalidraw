/**
 * Google Analytics tracking utilities with cookie consent support
 */

// Extend the Window interface to include gtag
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

let gaInitialized = false;

/**
 * Check if analytics cookies are consented to
 */
const hasAnalyticsConsent = (): boolean => {
  if (typeof document === 'undefined') return false;

  try {
    const cookies = document.cookie.split(';').reduce(
      (acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      },
      {} as Record<string, string>
    );

    const consentCookie = cookies['cookie_consent'];
    if (!consentCookie) return false;

    const consentData = JSON.parse(decodeURIComponent(consentCookie));
    return consentData?.state?.analytics === true;
  } catch (error) {
    return false;
  }
};

/**
 * Initialize Google Analytics by dynamically loading the script
 * Only initializes if analytics consent is given
 */
export const initializeGA = (): void => {
  const trackingId = process.env.REACT_APP_GA_TRACKING_ID;

  if (!trackingId || gaInitialized || typeof window === 'undefined') {
    return;
  }

  // Check for analytics consent before initializing
  if (!hasAnalyticsConsent()) {
    return;
  }

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];

  // Define gtag function
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  // Load the Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.gtag('js', new Date());
  window.gtag('config', trackingId, {
    page_title: document.title,
    page_location: window.location.href,
  });

  gaInitialized = true;
};

/**
 * Reinitialize GA when consent is granted
 */
export const enableAnalytics = (): void => {
  if (!gaInitialized) {
    initializeGA();
  }
};

/**
 * Disable analytics and clean up
 */
export const disableAnalytics = (): void => {
  if (gaInitialized && typeof window !== 'undefined') {
    // Clear GA cookies
    const domain = window.location.hostname;
    const cookies = [
      '_ga',
      '_ga_' + (process.env.REACT_APP_GA_TRACKING_ID || '').replace('G-', ''),
      '_gid',
      '_gat',
    ];

    cookies.forEach(cookie => {
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain}`;
    });
  }
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
