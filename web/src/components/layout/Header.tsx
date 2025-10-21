import React, { useState } from 'react';
import { MagnifyingGlassIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function Header({
  searchQuery,
  onSearchChange,
  isDarkMode,
  onToggleDarkMode,
  onToggleSidebar,
  sidebarOpen,
}: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className='sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-950/80'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          {/* Logo and mobile menu button */}
          <div className='flex items-center'>
            <button
              type='button'
              className='btn-ghost p-2 md:hidden'
              onClick={onToggleSidebar}
              aria-label='Toggle sidebar'
            >
              {sidebarOpen ? <XMarkIcon className='h-6 w-6' /> : <Bars3Icon className='h-6 w-6' />}
            </button>

            <div className='ml-4 flex items-center md:ml-0'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500'>
                <svg className='h-5 w-5 text-white' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
                </svg>
              </div>
              <div className='ml-3'>
                <h1 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                  Fluent Jot
                </h1>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Hand-drawn icons & emojis
                </p>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className='mx-4 flex-1 max-w-2xl'>
            <div className='relative'>
              <div
                className={clsx(
                  'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3',
                  searchFocused
                    ? 'text-primary-500 dark:text-primary-400'
                    : 'text-gray-400 dark:text-gray-500'
                )}
              >
                <MagnifyingGlassIcon className='h-5 w-5' />
              </div>
              <input
                type='text'
                placeholder='Search icons and emojis...'
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={clsx(
                  'search-input pl-10 transition-all duration-200',
                  searchFocused && 'ring-2 ring-primary-500 ring-opacity-20'
                )}
              />
              {searchQuery && (
                <button
                  type='button'
                  onClick={() => onSearchChange('')}
                  className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                >
                  <XMarkIcon className='h-5 w-5' />
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center space-x-2'>
            {/* Theme toggle */}
            <button
              type='button'
              onClick={onToggleDarkMode}
              className='btn-ghost p-2'
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <SunIcon className='h-5 w-5 text-yellow-500' />
              ) : (
                <MoonIcon className='h-5 w-5 text-gray-600' />
              )}
            </button>

            {/* GitHub link */}
            <a
              href='https://github.com/wictorwilen/fluentui-icons-to-excalidraw'
              target='_blank'
              rel='noopener noreferrer'
              className='btn-ghost p-2'
              aria-label='View on GitHub'
            >
              <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
