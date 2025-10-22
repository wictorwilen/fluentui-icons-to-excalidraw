import React from 'react';
import { ChevronRightIcon, StarIconFilled } from '../icons/MinimalIcons';
import { useFavorites } from '../../hooks/useFavorites';
import { useAnalytics } from '../../hooks/useAnalytics';
import clsx from 'clsx';

interface Category {
  id: string;
  name: string;
  iconCount: number;
  emojiCount: number;
  totalCount: number;
}

interface SidebarProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  categories,
  selectedCategory,
  onCategorySelect,
  showFavoritesOnly,
  onToggleFavorites,
  isOpen,
  onClose,
}: SidebarProps) {
  const { favoritesCount } = useFavorites();
  const analytics = useAnalytics();
  const sortedCategories = [...categories].sort((a, b) => b.totalCount - a.totalCount);

  const handleCategorySelect = (categoryId: string | null) => {
    if (categoryId) {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        analytics.trackCategorySelect(category.name);
      }
    }
    onCategorySelect(categoryId);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className='fixed inset-0 z-30 bg-black bg-opacity-25 md:hidden' onClick={onClose} />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-900 md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className='flex h-full flex-col'>
          {/* Sidebar header */}
          <div className='border-b border-gray-200 p-4 dark:border-gray-700'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
              Browse Categories
            </h2>
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              Filter icons by category
            </p>
          </div>

          {/* Categories */}
          <nav className='flex-1 space-y-1 p-4'>
            {/* All Icons */}
            <button
              onClick={() => {
                handleCategorySelect(null);
                if (showFavoritesOnly) onToggleFavorites();
              }}
              className={clsx(
                'group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
                selectedCategory === null && !showFavoritesOnly
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
              )}
            >
              <span>All Icons</span>
              <span className='text-xs text-gray-500 dark:text-gray-400'>
                {categories.reduce((sum, cat) => sum + cat.totalCount, 0)}
              </span>
            </button>

            {/* Favorites */}
            <button
              onClick={() => {
                onToggleFavorites();
                // Clear category selection when favorites is toggled on
                if (!showFavoritesOnly && selectedCategory !== null) {
                  handleCategorySelect(null);
                }
              }}
              className={clsx(
                'group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
                showFavoritesOnly
                  ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
              )}
            >
              <div className='flex items-center'>
                <StarIconFilled className='mr-2 h-4 w-4 text-yellow-500' aria-hidden={true} />
                <span>Favorites</span>
                {showFavoritesOnly && <ChevronRightIcon className='ml-2 h-4 w-4 text-yellow-500' />}
              </div>
              <span className='text-xs text-gray-500 dark:text-gray-400'>
                {favoritesCount.total}
              </span>
            </button>

            {/* Category list */}
            <div className='space-y-1'>
              {sortedCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={clsx(
                    'group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
                    selectedCategory === category.id
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                  )}
                >
                  <div className='flex items-center'>
                    <span>{category.name}</span>
                    {selectedCategory === category.id && (
                      <ChevronRightIcon className='ml-2 h-4 w-4 text-primary-500' />
                    )}
                  </div>
                  <div className='flex flex-col items-end text-xs text-gray-500 dark:text-gray-400'>
                    <span>{category.totalCount}</span>
                  </div>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
