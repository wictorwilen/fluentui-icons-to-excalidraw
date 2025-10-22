import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { XMarkIcon } from '../icons/MinimalIcons';
import { useCookieConsent } from '../../hooks/useCookieConsent';
import { CookieConsentState } from '../../constants/consent';

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CookiePreferencesModal({ isOpen, onClose }: CookiePreferencesModalProps) {
  const { consentState, acceptAll, acceptSelected, rejectAll } = useCookieConsent();
  const [customSettings, setCustomSettings] = useState<CookieConsentState>(() => {
    // If user has existing consent, use that; otherwise default to all enabled
    return (
      consentState || {
        necessary: true,
        analytics: true,
        marketing: true,
        preferences: true,
      }
    );
  });

  // Update local state when modal opens or consent state changes
  useEffect(() => {
    if (isOpen && consentState) {
      setCustomSettings(consentState);
    } else if (isOpen && !consentState) {
      // If no existing consent, default to all enabled for better UX
      setCustomSettings({
        necessary: true,
        analytics: true,
        marketing: true,
        preferences: true,
      });
    }
  }, [isOpen, consentState]);

  if (!isOpen) return null;

  const handleCustomSettingChange = (key: keyof CookieConsentState, value: boolean) => {
    if (key === 'necessary') return; // Can't disable necessary cookies
    setCustomSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleAcceptSelected = () => {
    acceptSelected(customSettings);
    onClose();
  };

  const handleAcceptAll = () => {
    const allAcceptedState: CookieConsentState = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    setCustomSettings(allAcceptedState);
    acceptAll();
    onClose();
  };

  const handleRejectAll = () => {
    const allRejectedState: CookieConsentState = {
      necessary: true, // Always true, can't be disabled
      analytics: false,
      marketing: false,
      preferences: false,
    };
    setCustomSettings(allRejectedState);
    rejectAll();
    onClose();
  };

  return createPortal(
    <div className='fixed inset-0 z-[60] overflow-y-auto'>
      <div className='flex min-h-full items-center justify-center px-4 py-6 text-center'>
        <div
          className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'
          onClick={onClose}
        />

        <div
          className={clsx(
            'relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all',
            'w-full max-w-lg',
            'dark:bg-gray-900'
          )}
        >
          <div className='absolute right-0 top-0 pr-4 pt-4'>
            <button
              type='button'
              className='rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-900 dark:text-gray-600 dark:hover:text-gray-400'
              onClick={onClose}
            >
              <XMarkIcon className='h-6 w-6' />
            </button>
          </div>

          <div className='sm:flex sm:items-start'>
            <div className='mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full'>
              <h3 className='text-lg font-medium leading-6 text-gray-900 dark:text-gray-100'>
                Cookie Preferences
              </h3>

              <div className='mt-4 space-y-4'>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Manage your cookie preferences. You can update these settings at any time.
                </p>

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
            </div>
          </div>

          <div className='mt-5 sm:mt-4 sm:flex sm:flex-row-reverse sm:gap-2'>
            <button
              type='button'
              className='inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:w-auto'
              onClick={handleAcceptAll}
            >
              Accept All
            </button>

            <button
              type='button'
              className='mt-3 inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:mt-0 sm:w-auto'
              onClick={handleAcceptSelected}
            >
              Save Preferences
            </button>

            <button
              type='button'
              className='mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-700'
              onClick={handleRejectAll}
            >
              Reject All
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
