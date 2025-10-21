import React, { useState, useEffect } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { Icon, Emoji } from '../../types';

interface ExcalidrawPreviewProps {
  item: Icon | Emoji;
  className?: string;
}

const ExcalidrawPreview: React.FC<ExcalidrawPreviewProps> = ({ item, className = '' }) => {
  const [excalidrawData, setExcalidrawData] = useState<{
    elements: ExcalidrawElement[];
    appState: Record<string, unknown>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExcalidrawData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Use the excalidrawPath from the item data
        const filePath = item.excalidrawPath;

        // eslint-disable-next-line no-console
        console.log('Loading Excalidraw data from:', filePath);

        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to load Excalidraw data: ${response.status}`);
        }

        const data = await response.json();
        setExcalidrawData(data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error loading Excalidraw data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load preview');
      } finally {
        setIsLoading(false);
      }
    };

    loadExcalidrawData();
  }, [item]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 dark:bg-gray-800 ${className}`}>
        <div className='inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary-600 border-r-transparent'></div>
      </div>
    );
  }

  if (error || !excalidrawData) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 dark:bg-gray-800 ${className}`}>
        <div className='text-center text-gray-400 dark:text-gray-600'>
          <svg
            className='h-6 w-6 mx-auto mb-1'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M12 9v3.75m9 .75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z'
            />
          </svg>
          <span className='text-xs'>Preview unavailable</span>
        </div>
      </div>
    );
  }

  const handlePreventInteraction = (e: React.MouseEvent | React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className={`bg-white dark:bg-gray-900 ${className} relative`}
      style={{ height: '100%', width: '100%', minHeight: '100px' }}
      onWheel={handlePreventInteraction}
      onMouseDown={handlePreventInteraction}
      onMouseMove={handlePreventInteraction}
      onMouseUp={handlePreventInteraction}
      onDrag={handlePreventInteraction}
      onDragStart={handlePreventInteraction}
    >
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <style>
          {`
            .excalidraw .App-toolbar, 
            .excalidraw .App-toolbar-content,
            .excalidraw .App-bottom-bar,
            .excalidraw .layer-ui__wrapper,
            .excalidraw .ToolIcon,
            .excalidraw .panelColumn {
              display: none !important;
            }
            .excalidraw canvas {
              pointer-events: none !important;
            }
          `}
        </style>
        <Excalidraw
          initialData={excalidrawData}
          viewModeEnabled={true}
          zenModeEnabled={true}
          gridModeEnabled={false}
          theme='light'
          name={item.displayName}
          detectScroll={false}
          handleKeyboardGlobally={false}
          UIOptions={{
            canvasActions: {
              loadScene: false,
              export: false,
              saveAsImage: false,
              clearCanvas: false,
              changeViewBackgroundColor: false,
              toggleTheme: false,
            },
            tools: {
              image: false,
            },
          }}
          renderTopRightUI={() => null}
        />
      </div>
    </div>
  );
};

export default ExcalidrawPreview;
