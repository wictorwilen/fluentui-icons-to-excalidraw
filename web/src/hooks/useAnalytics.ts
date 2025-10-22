import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../services/analytics';

/**
 * Hook to automatically track page views when the route changes
 */
export const usePageTracking = (): void => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
};

/**
 * Hook to provide analytics tracking functions
 */
export const useAnalytics = () => {
  return {
    trackPageView,
    trackIconDownload: (iconName: string, format: string) => {
      const { trackIconDownload } = require('../services/analytics');
      trackIconDownload(iconName, format);
    },
    trackEmojiDownload: (emojiName: string, format: string) => {
      const { trackEmojiDownload } = require('../services/analytics');
      trackEmojiDownload(emojiName, format);
    },
    trackSearch: (searchTerm: string, resultsCount: number) => {
      const { trackSearch } = require('../services/analytics');
      trackSearch(searchTerm, resultsCount);
    },
    trackFilter: (filterType: string, filterValue: string) => {
      const { trackFilter } = require('../services/analytics');
      trackFilter(filterType, filterValue);
    },
    trackCategorySelect: (category: string) => {
      const { trackCategorySelect } = require('../services/analytics');
      trackCategorySelect(category);
    },
    trackLibraryAction: (action: 'view' | 'download', libraryType: string) => {
      const { trackLibraryAction } = require('../services/analytics');
      trackLibraryAction(action, libraryType);
    },
    trackExternalLink: (url: string, linkText: string) => {
      const { trackExternalLink } = require('../services/analytics');
      trackExternalLink(url, linkText);
    },
    trackError: (errorType: string, errorMessage: string) => {
      const { trackError } = require('../services/analytics');
      trackError(errorType, errorMessage);
    },
  };
};