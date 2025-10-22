import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import IconBrowser from './components/icons/IconBrowser';
import { useLocalStorage } from './hooks/useLocalStorage';
import { usePageTracking } from './hooks/useAnalytics';
import { dataService } from './services/dataService';
import { initializeGA } from './services/analytics';
import { Category, Icon, Emoji, SearchFilters } from './types';
import './styles/globals.css';

// Component that handles analytics tracking inside Router context
function AppContent() {
  // Initialize page tracking
  usePageTracking();

  // Theme management
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', false);

  // Initialize Google Analytics
  useEffect(() => {
    initializeGA();
  }, []);

  // Search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [icons, setIcons] = useState<Icon[]>([]);
  const [emojis, setEmojis] = useState<Emoji[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search filters
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    category: null,
    styles: [],
    type: 'all',
    showFavoritesOnly: false,
  });
  
  // Favorites state
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load icons, emojis, categories, and search indices
        const [iconsData, emojisData] = await Promise.all([
          dataService.loadIconsData(),
          dataService.loadEmojisData(),
          dataService.loadCategories(),
          dataService.loadSearchIndex(),
        ]);

        // Convert icons data to match expected format
        const iconsConverted: Icon[] = iconsData.map(icon => ({
          id: icon.id,
          name: icon.name,
          displayName: icon.displayName,
          category: icon.category,
          style: icon.style as 'regular' | 'filled' | 'light',
          keywords: icon.keywords,
          excalidrawPath: icon.excalidrawPath,
        }));

        // Convert emojis data to match expected format
        const emojisConverted: Emoji[] = emojisData.map(emoji => ({
          id: emoji.id,
          name: emoji.name,
          displayName: emoji.displayName,
          category: emoji.category,
          style: emoji.style as 'flat' | 'color',
          keywords: emoji.keywords,
          excalidrawPath: emoji.excalidrawPath,
        }));



        // Calculate category counts
        const categoryNames = dataService.getCategories();
        const categoriesData: Category[] = categoryNames.map((name, index) => {
          const iconCount = iconsConverted.filter(icon => icon.category === name).length;
          const emojiCount = emojisConverted.filter(emoji => emoji.category === name).length;
          return {
            id: index.toString(),
            name: name,
            displayName: name,
            iconCount,
            emojiCount,
            totalCount: iconCount + emojiCount,
          };
        });

        setCategories(categoriesData);
        setIcons(iconsConverted);
        setEmojis(emojisConverted);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Update search filters when search query, category, or favorites change
  useEffect(() => {
    setSearchFilters(prev => ({
      ...prev,
      query: searchQuery,
      category: selectedCategory,
      showFavoritesOnly,
    }));
  }, [searchQuery, selectedCategory, showFavoritesOnly]);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    // Clear favorites filter when selecting a category
    if (showFavoritesOnly) {
      setShowFavoritesOnly(false);
    }
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleStylesChange = (styles: ('regular' | 'filled' | 'light' | 'flat' | 'color')[]) => {
    setSearchFilters(prev => ({
      ...prev,
      styles,
    }));
  };

  const handleToggleFavorites = () => {
    setShowFavoritesOnly(!showFavoritesOnly);
  };

  return (
      <div className='flex h-screen bg-gray-50 dark:bg-gray-900'>
        {/* Sidebar */}
        <Sidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavorites={handleToggleFavorites}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content */}
        <div className='flex flex-1 flex-col overflow-hidden'>
          {/* Header */}
          <Header
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
            onToggleSidebar={handleToggleSidebar}
            sidebarOpen={sidebarOpen}
          />

          {/* Main content area */}
          <main className='flex-1 overflow-y-auto'>
            <div className='mx-auto max-w-7xl px-4 py-6 pb-20 sm:px-6 lg:px-8'>
              {/* Hero section */}
              {!searchQuery && !selectedCategory && !showFavoritesOnly && (
                <div className='mb-8 text-center'>
                  <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
                    <span className='text-gradient'>Fluent Jot</span>
                  </h1>
                  <p className='mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300'>
                    Browse and download Microsoft's Fluent UI icons and emojis in beautiful
                    hand-drawn Excalidraw format. Perfect for wireframes, mockups, and design
                    sketches.
                  </p>
                  <div className='mt-6 flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400'>
                    <span className='flex items-center'>
                      <span className='mr-2 h-2 w-2 rounded-full bg-primary-500'></span>
                      5,980+ Icons
                    </span>
                    <span className='flex items-center'>
                      <span className='mr-2 h-2 w-2 rounded-full bg-accent-500'></span>
                      1,595+ Emojis
                    </span>
                    <span className='flex items-center'>
                      <span className='mr-2 h-2 w-2 rounded-full bg-green-500'></span>
                      Free to Use
                    </span>
                  </div>
                </div>
              )}

              {/* Icon Browser */}
              <IconBrowser
                icons={icons}
                emojis={emojis}
                categories={categories}
                searchFilters={searchFilters}
                onStylesChange={handleStylesChange}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </main>
        </div>

        {/* Fixed Footer */}
        <Footer />
      </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
