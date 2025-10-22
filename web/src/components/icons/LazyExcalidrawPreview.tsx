import React, { Suspense, lazy } from 'react';
import { Icon, Emoji } from '../../types';

// Lazy load the Excalidraw component
const ExcalidrawPreview = lazy(() => import('./ExcalidrawPreview'));

interface LazyExcalidrawPreviewProps {
  item: Icon | Emoji;
  className?: string;
}

const LoadingPreview: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center justify-center bg-gray-50 dark:bg-gray-800 ${className}`}>
    <div className='inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary-600 border-r-transparent'></div>
  </div>
);

const LazyExcalidrawPreview: React.FC<LazyExcalidrawPreviewProps> = ({ item, className }) => {
  return (
    <Suspense fallback={<LoadingPreview className={className} />}>
      <ExcalidrawPreview item={item} className={className} />
    </Suspense>
  );
};

export default LazyExcalidrawPreview;
