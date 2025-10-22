import React from 'react';
import { Icon, Emoji } from '../../types';
import { ClipboardIcon, DownloadIcon } from './MinimalIcons';
import FavoriteButton from './FavoriteButton';
import { getExcalidrawUrl, getExcalidrawFetchHeaders } from '../../config/storage';
import { useAnalytics } from '../../hooks/useAnalytics';

interface IconActionsProps {
  item: Icon | Emoji;
  itemType: 'icon' | 'emoji';
  className?: string;
}

const IconActions: React.FC<IconActionsProps> = ({ item, itemType, className = '' }) => {
  const analytics = useAnalytics();

  const handleCopyToClipboard = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Use the excalidrawPath from the item data, converted to blob storage URL if enabled
      const fileUrl = getExcalidrawUrl(item.excalidrawPath);

      const response = await fetch(fileUrl, {
        headers: getExcalidrawFetchHeaders()
      });
      if (!response.ok) {
        throw new Error('Failed to load icon data');
      }
      const excalidrawData = await response.json();

      // Copy to clipboard as JSON
      await navigator.clipboard.writeText(JSON.stringify(excalidrawData, null, 2));

      // Track the copy action
      if (itemType === 'icon') {
        analytics.trackIconDownload(item.name, 'clipboard');
      } else {
        analytics.trackEmojiDownload(item.name, 'clipboard');
      }

      // TODO: Show success toast
      // eslint-disable-next-line no-console
      console.log('✅ Copied to clipboard:', item.displayName);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Failed to copy to clipboard:', error);
      // TODO: Show error toast
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Use the excalidrawPath from the item data, converted to blob storage URL if enabled
      const fileUrl = getExcalidrawUrl(item.excalidrawPath);

      const response = await fetch(fileUrl, {
        headers: getExcalidrawFetchHeaders()
      });
      if (!response.ok) {
        throw new Error('Failed to load icon data');
      }
      const excalidrawData = await response.json();

      // Create and trigger download
      const blob = new Blob([JSON.stringify(excalidrawData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.name}.excalidraw`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Track the download action
      if (itemType === 'icon') {
        analytics.trackIconDownload(item.name, 'excalidraw');
      } else {
        analytics.trackEmojiDownload(item.name, 'excalidraw');
      }

      // eslint-disable-next-line no-console
      console.log('📥 Downloaded:', item.displayName);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Failed to download:', error);
      // TODO: Show error toast
    }
  };

  return (
    <div className={`flex items-center justify-between pt-2 ${className}`}>
      <div className='flex items-center space-x-2'>
        <button
          onClick={handleCopyToClipboard}
          className='inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          title='Copy to clipboard'
          aria-label='Copy to clipboard'
        >
          <ClipboardIcon className='w-4 h-4' aria-hidden={true} />
        </button>
        
        <button
          onClick={handleDownload}
          className='inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          title='Download'
          aria-label='Download'
        >
          <DownloadIcon className='w-4 h-4' aria-hidden={true} />
        </button>
      </div>
      
              <FavoriteButton item={item} itemType={itemType} className='mr-2' />
    </div>
  );
};

export default IconActions;