import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className='max-w-4xl mx-auto px-4 py-8 prose dark:prose-invert'>
      <h1>Privacy Policy</h1>
      <p className='text-gray-600 dark:text-gray-400'>
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <h2>Introduction</h2>
      <p>
        Fluent Jot ("we", "our", or "us") is committed to protecting your privacy. This Privacy
        Policy explains how we collect, use, and safeguard your information when you visit our
        website.
      </p>

      <h2>Information We Collect</h2>

      <h3>Automatically Collected Information</h3>
      <p>
        When you visit our website, we may automatically collect certain information about your
        device, including:
      </p>
      <ul>
        <li>Browser type and version</li>
        <li>Operating system</li>
        <li>Pages visited and time spent</li>
        <li>Referring website</li>
        <li>IP address (anonymized)</li>
      </ul>

      <h3>Cookies and Tracking Technologies</h3>
      <p>
        We use cookies and similar tracking technologies to enhance your browsing experience and
        analyze website usage. You can control cookie preferences through our cookie consent banner.
      </p>

      <h2>Types of Cookies We Use</h2>

      <h3>Necessary Cookies</h3>
      <p>
        These cookies are essential for the website to function properly. They enable basic features
        like page navigation and access to secure areas of the website. The website cannot function
        properly without these cookies.
      </p>

      <h3>Analytics Cookies</h3>
      <p>
        We use Google Analytics to understand how visitors interact with our website. These cookies
        help us:
      </p>
      <ul>
        <li>Count visits and traffic sources</li>
        <li>Measure and improve website performance</li>
        <li>Understand which pages are most popular</li>
        <li>See how visitors move around the site</li>
      </ul>
      <p>
        Analytics data is collected anonymously and we do not store personally identifiable
        information.
      </p>

      <h3>Preference Cookies</h3>
      <p>
        These cookies remember your preferences and settings to provide a personalized experience,
        such as:
      </p>
      <ul>
        <li>Dark/light theme preference</li>
        <li>Favorite icons and emojis</li>
        <li>Search and filter preferences</li>
      </ul>

      <h2>How We Use Your Information</h2>
      <p>We use the collected information to:</p>
      <ul>
        <li>Provide and maintain our website</li>
        <li>Improve user experience</li>
        <li>Analyze website usage patterns</li>
        <li>Detect and prevent abuse</li>
      </ul>

      <h2>Data Sharing</h2>
      <p>
        We do not sell, trade, or otherwise transfer your personal information to third parties,
        except:
      </p>
      <ul>
        <li>Google Analytics for website analytics (with anonymized data)</li>
        <li>When required by law or to protect our rights</li>
      </ul>

      <h2>Your Rights and Choices</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Accept or decline cookies through our cookie consent banner</li>
        <li>Change your cookie preferences at any time</li>
        <li>Clear cookies and local storage from your browser</li>
        <li>Use browser settings to block cookies</li>
      </ul>

      <h2>Data Retention</h2>
      <p>
        Cookie consent preferences are stored for 1 year. Analytics data is retained according to
        Google Analytics data retention policies. You can reset your preferences at any time.
      </p>

      <h2>Children's Privacy</h2>
      <p>
        Our website does not knowingly collect personal information from children under 13. If you
        are a parent or guardian and believe your child has provided us with personal information,
        please contact us.
      </p>

      <h2>Security</h2>
      <p>
        We implement appropriate security measures to protect your information. However, no method
        of transmission over the internet is 100% secure.
      </p>

      <h2>Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of any changes by
        posting the new Privacy Policy on this page and updating the "Last updated" date.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us through our{' '}
        <a
          href='https://github.com/wictorwilen/fluentui-icons-to-excalidraw/issues'
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary-600 hover:text-primary-700 dark:text-primary-400'
        >
          GitHub repository
        </a>
        .
      </p>

      <h2>Third-Party Services</h2>

      <h3>Google Analytics</h3>
      <p>
        When analytics cookies are enabled, we use Google Analytics to analyze website usage. Google
        Analytics may collect information such as:
      </p>
      <ul>
        <li>How often users visit the site</li>
        <li>What pages they visit when they do so</li>
        <li>What other sites they used prior to coming to this site</li>
      </ul>
      <p>
        We use the information we get from Google Analytics only to improve this site. Google
        Analytics collects only the IP address assigned to you on the date you visit this site,
        rather than your name or other identifying information.
      </p>
      <p>
        For more information about Google's privacy practices, visit:{' '}
        <a
          href='https://policies.google.com/privacy'
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary-600 hover:text-primary-700 dark:text-primary-400'
        >
          https://policies.google.com/privacy
        </a>
      </p>
    </div>
  );
}
