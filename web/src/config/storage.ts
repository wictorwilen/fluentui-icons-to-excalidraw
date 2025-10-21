// Environment configuration for the web app
export const config = {
  // Azure Blob Storage configuration for Excalidraw files
  blobStorage: {
    // Base URL for the blob storage container
    // In production, this should use Azure CDN for better performance
    baseUrl: process.env.REACT_APP_BLOB_STORAGE_URL || 'https://fluentjotdesign.blob.core.windows.net/excalidraw-assets',
    
    // Enable/disable blob storage (fallback to local files during development)
    enabled: process.env.REACT_APP_USE_BLOB_STORAGE !== 'false'
  },
  
  // Fallback to local files when blob storage is disabled
  localExcalidrawPath: '/excalidraw'
};

/**
 * Convert a local excalidraw path to a blob storage URL
 * @param localPath - Path like "/excalidraw/icons/Access Time/SVG/ic_fluent_access_time_filled.excalidraw"
 * @returns Full blob storage URL or original path if blob storage is disabled
 */
export function getExcalidrawUrl(localPath: string): string {
  if (!config.blobStorage.enabled) {
    return localPath;
  }
  
  // Remove the "/excalidraw/" prefix and construct blob URL
  // "/excalidraw/icons/..." -> "icons/..."
  // "/excalidraw/emojis/..." -> "emojis/..."
  const blobPath = localPath.replace(/^\/excalidraw\//, '');
  
  return `${config.blobStorage.baseUrl}/${blobPath}`;
}

/**
 * Get the appropriate headers for fetching Excalidraw files
 */
export function getExcalidrawFetchHeaders(): HeadersInit {
  if (!config.blobStorage.enabled) {
    return {};
  }
  
  // Add CORS and cache headers for blob storage requests
  return {
    'Cache-Control': 'public, max-age=3600'
  };
}