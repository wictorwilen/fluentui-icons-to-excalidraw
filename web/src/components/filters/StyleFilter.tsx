import React from 'react';
import clsx from 'clsx';
import { trackStyleSelection } from '../../services/analytics';

interface StyleFilterProps {
  selectedStyles: ('regular' | 'filled' | 'light' | 'flat' | 'color')[];
  onStylesChange: (styles: ('regular' | 'filled' | 'light' | 'flat' | 'color')[]) => void;
  availableStyles?: ('regular' | 'filled' | 'light' | 'flat' | 'color')[];
  className?: string;
}

const STYLE_LABELS = {
  regular: 'Regular',
  filled: 'Filled',
  light: 'Light',
  flat: 'Flat',
  color: 'Color',
} as const;

const STYLE_DESCRIPTIONS = {
  regular: 'Outline style icons',
  filled: 'Solid filled icons',
  light: 'Thin outline icons',
  flat: 'Flat style emojis',
  color: 'Colorful emojis',
} as const;

export default function StyleFilter({
  selectedStyles,
  onStylesChange,
  availableStyles = ['filled', 'color', 'flat', 'regular', 'light'],
  className,
}: StyleFilterProps) {
  const handleStyleToggle = (style: 'regular' | 'filled' | 'light' | 'flat' | 'color') => {
    let newStyles: ('regular' | 'filled' | 'light' | 'flat' | 'color')[];
    
    if (selectedStyles.includes(style)) {
      // Remove the style
      newStyles = selectedStyles.filter(s => s !== style);
    } else {
      // Add the style
      newStyles = [...selectedStyles, style];
    }
    
    // Track the style selection change
    trackStyleSelection(newStyles, availableStyles.length);
    
    onStylesChange(newStyles);
  };

  const handleSelectAll = () => {
    // Track selecting all styles
    trackStyleSelection(availableStyles, availableStyles.length);
    
    onStylesChange(availableStyles);
  };

  const handleClearAll = () => {
    // Track clearing all styles
    trackStyleSelection([], availableStyles.length);
    
    onStylesChange([]);
  };

  return (
    <div className={clsx('flex flex-col space-y-3', className)}>
      {/* Header with select all/clear buttons */}
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>Style</span>
        <div className='flex space-x-2'>
          <button
            onClick={handleSelectAll}
            className='text-xs text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300'
            disabled={selectedStyles.length === availableStyles.length}
          >
            All
          </button>
          <span className='text-xs text-gray-400'>•</span>
          <button
            onClick={handleClearAll}
            className='text-xs text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300'
            disabled={selectedStyles.length === 0}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Style buttons */}
      <div className='flex flex-wrap gap-2'>
        {availableStyles.map(style => {
          const isSelected = selectedStyles.includes(style);
          return (
            <button
              key={style}
              onClick={() => handleStyleToggle(style)}
              className={clsx(
                'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                'border focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
                isSelected
                  ? 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/50 dark:text-primary-300 dark:hover:bg-primary-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
              title={STYLE_DESCRIPTIONS[style]}
            >
              {/* Icon indicator */}
              <span
                className={clsx(
                  'mr-1.5 h-2 w-2 rounded-full',
                  style === 'regular' && 'border border-current bg-transparent',
                  style === 'filled' && 'bg-current',
                  style === 'light' && 'border border-current bg-transparent opacity-60',
                  style === 'flat' && 'bg-gradient-to-br from-purple-400 via-pink-400 to-red-400',
                  style === 'color' && 'bg-gradient-to-br from-yellow-400 to-orange-400'
                )}
              />
              {STYLE_LABELS[style]}
              {isSelected && (
                <svg className='ml-1.5 h-3 w-3' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected count indicator */}
      {selectedStyles.length > 0 && (
        <div className='text-xs text-gray-500 dark:text-gray-400'>
          {selectedStyles.length} of {availableStyles.length} styles selected
        </div>
      )}
    </div>
  );
}
