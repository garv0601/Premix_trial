import React from 'react';
import LegalPage from './LegalPage';

const SECTIONS = [
  {
    heading: 'Information We Collect',
    body: 'We collect the details you provide when you create an account, place an order or contact us — such as your name, email address, phone number and delivery address. We also collect basic usage information to help us improve the store experience.',
  },
  {
    heading: 'How We Use Your Information',
    body: 'Your information is used to process and deliver your orders, provide customer support, send order updates, and — only with your consent — share occasional news about our premixes. We never sell your personal data.',
  },
  {
    heading: 'Payments',
    body: 'Payments are handled by trusted third-party payment providers. We do not store your full card details on our servers.',
  },
  {
    heading: 'Data Security',
    body: 'We use appropriate technical and organisational measures to protect your information. While no online service can guarantee absolute security, we work hard to keep your data safe.',
  },
  {
    heading: 'Your Rights',
    body: 'You may request access to, correction of, or deletion of your personal information at any time by contacting us through the Contact page.',
  },
  {
    heading: 'Contact Us',
    body: 'If you have any questions about this Privacy Policy, please reach out to us via the Contact page and we will be glad to help.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="Last updated: January 2025"
      sections={SECTIONS}
      docTitle="Privacy Policy — ANNAPURNA"
    />
  );
}
