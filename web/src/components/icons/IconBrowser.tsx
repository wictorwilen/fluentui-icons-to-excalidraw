import React, { useMemo, useState, useEffect } from 'react';
import { Icon, Emoji, SearchFilters, Category } from '../../types';
import LazyExcalidrawPreview from './LazyExcalidrawPreview';
import StyleFilter from '../filters/StyleFilter';
import IconActions from './IconActions';
import { useFavorites } from '../../hooks/useFavorites';

// Constants
const ITEMS_PER_PAGE = 25;

interface IconBrowserProps {
  icons: Icon[];
  emojis?: Emoji[];
  categories: Category[];
  searchFilters: SearchFilters;
  onStylesChange: (styles: ('regular' | 'filled' | 'light' | 'flat' | 'color')[]) => void;
  isLoading?: boolean;
  error?: string | null;
}

const IconBrowser: React.FC<IconBrowserProps> = ({
  icons = [],
  emojis = [],
  categories = [],
  searchFilters,
  onStylesChange,
  isLoading = false,
  error = null,
}) => {
  // Favorites hook
  const { getFavoriteIcons, getFavoriteEmojis } = useFavorites();

  // Convert category ID to category name for filtering
  const categoryName = searchFilters.category
    ? categories.find((cat: Category) => cat.id === searchFilters.category)?.name || null
    : null;

  // Filter and combine icons and emojis based on search filters
  const filteredItems = useMemo(() => {
    let filteredIcons = icons || [];
    let filteredEmojis = emojis || [];

    // Apply favorites filter if enabled
    if (searchFilters.showFavoritesOnly) {
      filteredIcons = getFavoriteIcons(filteredIcons);
      filteredEmojis = getFavoriteEmojis(filteredEmojis);
    }

    // Apply search query if present
    if (searchFilters.query && searchFilters.query.trim()) {
      const query = searchFilters.query.toLowerCase();

      // Simple text search on icon properties
      filteredIcons = filteredIcons.filter(
        icon =>
          icon.displayName.toLowerCase().includes(query) ||
          icon.name.toLowerCase().includes(query) ||
          (icon.keywords && icon.keywords.some(keyword => keyword.toLowerCase().includes(query))) ||
          icon.category.toLowerCase().includes(query)
      );

      // Simple text search on emoji properties
      filteredEmojis = filteredEmojis.filter(
        emoji =>
          emoji.displayName.toLowerCase().includes(query) ||
          emoji.name.toLowerCase().includes(query) ||
          (emoji.keywords &&
            emoji.keywords.some(keyword => keyword.toLowerCase().includes(query))) ||
          emoji.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryName) {
      filteredIcons = filteredIcons.filter(icon => icon.category === categoryName);
      filteredEmojis = filteredEmojis.filter(emoji => emoji.category === categoryName);
    }

    // Apply style filter for icons and emojis
    if (searchFilters.styles.length > 0) {
      filteredIcons = filteredIcons.filter(icon => searchFilters.styles.includes(icon.style));
      filteredEmojis = filteredEmojis.filter(emoji => searchFilters.styles.includes(emoji.style));
    }

    // Apply type filter (icons, emojis, or all)
    if (searchFilters.type === 'icons') {
      return filteredIcons;
    } else if (searchFilters.type === 'emojis') {
      return filteredEmojis;
    }

    // Return combined results
    const result = [...filteredIcons, ...filteredEmojis];
    return result;
  }, [icons, emojis, searchFilters, categoryName, getFavoriteIcons, getFavoriteEmojis]);

  // Paging state
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate paged items
  const pagedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilters]);

  const allItems = filteredItems;

  // Helper function to determine if an item is an icon or emoji
  const getItemType = (item: Icon | Emoji): 'icon' | 'emoji' => {
    // Check if the item exists in the original icons array
    const isIcon = icons.some(icon => icon.id === item.id);
    const itemType = isIcon ? 'icon' : 'emoji';

    return itemType;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent'></div>
          <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>Loading icons...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className='text-center py-12'>
        <div className='mx-auto h-12 w-12 text-red-400'>
          <svg fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
            />
          </svg>
        </div>
        <h3 className='mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100'>
          Error loading data
        </h3>
        <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>{error}</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Results header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
            {searchFilters.query
              ? `Search results for "${searchFilters.query}"`
              : searchFilters.showFavoritesOnly
                ? 'Favorites'
                : categoryName
                  ? `${categoryName} items`
                  : 'All items'}
          </h2>
          <span className='rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400'>
            {allItems.length}
          </span>
        </div>

        {(searchFilters.query || searchFilters.category || searchFilters.showFavoritesOnly) && (
          <button className='text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300'>
            Clear filters
          </button>
        )}
      </div>

      {/* Filters */}
      <div className='flex flex-col space-y-4'>
        <StyleFilter
          selectedStyles={searchFilters.styles}
          onStylesChange={onStylesChange}
          className='sm:max-w-md'
        />
      </div>

      {/* Item grid */}
      {allItems.length > 0 ? (
        <>
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
            {pagedItems.map(item => (
              <div key={item.id} className='card group'>
                <div className='aspect-square bg-gray-50 dark:bg-gray-800 rounded-lg mb-3 overflow-hidden'>
                  <LazyExcalidrawPreview item={item} className='w-full h-full rounded-lg' />
                </div>
                <div className='flex-1 min-w-0'>
                  <h3
                    className='text-sm font-medium text-gray-900 dark:text-gray-100 truncate'
                    title={`Display: ${item.displayName} | Name: ${item.name}`}
                  >
                    {item.displayName}
                  </h3>
                  <p className='text-xs text-gray-500 dark:text-gray-400 mt-1 truncate'>
                    {item.category}
                  </p>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    {'style' in item ? item.style : 'emoji'}
                  </p>
                  <IconActions item={item} itemType={getItemType(item)} />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6'>
              <div className='flex flex-1 justify-between sm:hidden'>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className='relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className='relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Next
                </button>
              </div>

              <div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
                <div>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    Showing{' '}
                    <span className='font-medium'>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                    <span className='font-medium'>
                      {Math.min(currentPage * ITEMS_PER_PAGE, allItems.length)}
                    </span>{' '}
                    of <span className='font-medium'>{allItems.length}</span> results
                  </p>
                </div>
                <div>
                  <nav
                    className='isolate inline-flex -space-x-px rounded-md shadow-sm'
                    aria-label='Pagination'
                  >
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className='relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <span className='sr-only'>Previous</span>
                      <svg
                        className='h-5 w-5'
                        viewBox='0 0 20 20'
                        fill='currentColor'
                        aria-hidden='true'
                      >
                        <path
                          fillRule='evenodd'
                          d='M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            currentPage === pageNum
                              ? 'z-10 bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                              : 'text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className='relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <span className='sr-only'>Next</span>
                      <svg
                        className='h-5 w-5'
                        viewBox='0 0 20 20'
                        fill='currentColor'
                        aria-hidden='true'
                      >
                        <path
                          fillRule='evenodd'
                          d='M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className='text-center py-12'>
          <div className='mx-auto h-12 w-12 text-gray-400 dark:text-gray-600'>
            <svg fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z'
              />
            </svg>
          </div>
          <h3 className='mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100'>
            {searchFilters.showFavoritesOnly ? 'No favorites yet' : 'No items found'}
          </h3>
          <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
            {searchFilters.showFavoritesOnly
              ? 'Start adding icons and emojis to your favorites by clicking the star button on any item.'
              : 'Try adjusting your search terms or selected category.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default IconBrowser;
