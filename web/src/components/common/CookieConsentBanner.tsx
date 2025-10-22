import React, { useState } from 'react';
import clsx from 'clsx';
import { XMarkIcon, CogIcon, ShieldCheckIcon } from '../icons/MinimalIcons';
import { useCookieConsent } from '../../hooks/useCookieConsent';
import { CookieConsentState } from '../../constants/consent';

interface CookieConsentBannerProps {
  className?: string;
}

export default function CookieConsentBanner({ className }: CookieConsentBannerProps) {
  const { showBanner, acceptAll, acceptSelected, rejectAll } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [customSettings, setCustomSettings] = useState<CookieConsentState>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  if (!showBanner) {
    return null;
  }

  const handleCustomSettingChange = (key: keyof CookieConsentState, value: boolean) => {
    if (key === 'necessary') return; // Can't disable necessary cookies
    setCustomSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleAcceptSelected = () => {
    acceptSelected(customSettings);
  };

  return (
    <div
      className={clsx(
        'fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900',
        className
      )}
    >
      <div className='mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8'>
        {!showDetails ? (
          // Simple banner view
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex-1'>
              <div className='flex items-start gap-3'>
                <ShieldCheckIcon className='mt-1 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400' />
                <div>
                  <h3 className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                    We use cookies
                  </h3>
                  <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                    We use cookies to enhance your browsing experience, provide personalized
                    content, and analyze our traffic. By clicking "Accept All", you consent to our
                    use of cookies.{' '}
                    <button
                      onClick={() => setShowDetails(true)}
                      className='underline hover:no-underline text-blue-600 dark:text-blue-400'
                    >
                      Learn more about our privacy practices
                    </button>
                    .
                  </p>
                </div>
              </div>
            </div>

            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              <button
                onClick={() => setShowDetails(true)}
                className='inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              >
                <CogIcon className='h-4 w-4' />
                Customize
              </button>

              <button
                onClick={rejectAll}
                className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              >
                Reject All
              </button>

              <button
                onClick={acceptAll}
                className='rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          // Detailed settings view
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100'>
                Cookie Preferences
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className='rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300'
              >
                <XMarkIcon className='h-5 w-5' />
              </button>
            </div>

            <div className='space-y-4'>
              <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4'>
                <h4 className='text-sm font-medium text-blue-900 dark:text-blue-100 mb-2'>
                  Privacy Information
                </h4>
                <p className='text-sm text-blue-700 dark:text-blue-300'>
                  We respect your privacy and are committed to protecting your personal data. We
                  only collect anonymous usage statistics to improve our service. No personally
                  identifiable information is stored or shared with third parties beyond what's
                  necessary for website functionality.
                </p>
              </div>

              {/* Necessary Cookies */}
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <h4 className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                    Necessary Cookies
                  </h4>
                  <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                    Essential for the website to function properly. These cannot be disabled.
                  </p>
                </div>
                <div className='ml-4 flex items-center'>
                  <input
                    type='checkbox'
                    checked={true}
                    disabled={true}
                    className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50'
                  />
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <h4 className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                    Analytics Cookies
                  </h4>
                  <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                    Help us understand how visitors interact with our website by collecting
                    anonymous information.
                  </p>
                </div>
                <div className='ml-4 flex items-center'>
                  <input
                    type='checkbox'
                    checked={customSettings.analytics}
                    onChange={e => handleCustomSettingChange('analytics', e.target.checked)}
                    className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                  />
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <h4 className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                    Marketing Cookies
                  </h4>
                  <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                    Used to track visitors across websites to display relevant advertisements.
                  </p>
                </div>
                <div className='ml-4 flex items-center'>
                  <input
                    type='checkbox'
                    checked={customSettings.marketing}
                    onChange={e => handleCustomSettingChange('marketing', e.target.checked)}
                    className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                  />
                </div>
              </div>

              {/* Preferences Cookies */}
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <h4 className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                    Preference Cookies
                  </h4>
                  <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                    Remember your preferences and settings to provide a personalized experience.
                  </p>
                </div>
                <div className='ml-4 flex items-center'>
                  <input
                    type='checkbox'
                    checked={customSettings.preferences}
                    onChange={e => handleCustomSettingChange('preferences', e.target.checked)}
                    className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                  />
                </div>
              </div>
            </div>

            <div className='flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end'>
              <button
                onClick={rejectAll}
                className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              >
                Reject All
              </button>

              <button
                onClick={handleAcceptSelected}
                className='rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
              >
                Save Preferences
              </button>

              <button
                onClick={acceptAll}
                className='rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
              >
                Accept All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
