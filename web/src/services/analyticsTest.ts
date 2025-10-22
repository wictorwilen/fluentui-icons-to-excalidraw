/**
 * Test file to verify Google Analytics integration
 * This file can be removed - it's just for testing the implementation
 */

import { 
  isGALoaded, 
  trackPageView, 
  trackEvent, 
  trackIconDownload, 
  trackEmojiDownload,
  trackSearch,
  trackCategorySelect 
} from '../services/analytics';

// Test function to verify analytics are working
export const testAnalytics = () => {
  console.log('Testing Google Analytics integration...');
  
  // Check if GA is loaded
  console.log('GA Loaded:', isGALoaded());
  
  // Test various tracking functions (only if GA is loaded)
  if (isGALoaded()) {
    console.log('Running analytics tests...');
    
    // Track a test page view
    trackPageView('/test', 'Test Page');
    
    // Track a test event
    trackEvent('test_action', 'test_category', 'test_label', 1);
    
    // Track icon download
    trackIconDownload('AccessTime', 'excalidraw');
    
    // Track emoji download
    trackEmojiDownload('grinning_face', 'excalidraw');
    
    // Track search
    trackSearch('test search', 10);
    
    // Track category selection
    trackCategorySelect('Communication');
    
    console.log('Analytics tests completed');
  } else {
    console.log('Google Analytics not loaded - tests skipped');
  }
};

export default testAnalytics;