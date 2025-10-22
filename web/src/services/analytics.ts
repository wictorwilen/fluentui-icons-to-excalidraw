/**
 * Google Analytics tracking utilities
 */

// Extend the Window interface to include gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

/**
 * Check if Google Analytics is loaded and available
 */
export const isGALoaded = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.gtag === 'function' && 
         !!process.env.REACT_APP_GA_TRACKING_ID;
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