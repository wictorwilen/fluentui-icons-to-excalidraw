import React from 'react';

export default function Footer() {
  return (
    <footer className='fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-950/80'>
      <div className='mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8'>
        <div className='flex flex-col items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400 sm:flex-row sm:gap-0'>
          <div className='flex flex-col items-center gap-1 sm:flex-row sm:gap-4'>
            <p>
              Original icons from{' '}
              <a
                href='https://github.com/microsoft/fluentui-system-icons'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300'
              >
                Microsoft Fluent UI
              </a>
            </p>
            <span className='hidden text-gray-300 dark:text-gray-600 sm:inline'>•</span>
            <p className='text-[10px] text-gray-400 dark:text-gray-500 sm:text-xs'>
              Icons used under{' '}
              <a
                href='https://github.com/microsoft/fluentui-system-icons/blob/main/LICENSE'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300'
              >
                MIT License
              </a>
            </p>
          </div>

          <div className='flex items-center gap-4 text-[10px] sm:text-xs'>
            <a
              href='https://github.com/wictorwilen/fluentui-icons-to-excalidraw'
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300'
            >
              GitHub
            </a>
            <span className='text-gray-300 dark:text-gray-600'>•</span>
            <span>
              Made with ❤️ by{' '}
              <a
                href='https://github.com/wictorwilen'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300'
              >
                Wictor Wilén
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
