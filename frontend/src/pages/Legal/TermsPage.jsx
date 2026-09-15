import React from 'react';
import LegalPage from './LegalPage';

const SECTIONS = [
  {
    heading: 'Acceptance of Terms',
    body: 'By accessing or using the Annapurna website and placing an order, you agree to these Terms & Conditions. If you do not agree, please do not use the site.',
  },
  {
    heading: 'Products & Pricing',
    body: 'We aim to describe our premixes and display prices as accurately as possible. Prices and availability may change without notice, and we reserve the right to correct any errors.',
  },
  {
    heading: 'Orders',
    body: 'Once an order is placed you will receive a confirmation. We reserve the right to accept or decline any order. Order updates are shared through your account and email.',
  },
  {
    heading: 'Shipping & Delivery',
    body: 'We work to dispatch and deliver orders within the estimated timeframes shown at checkout. Delivery times may vary due to factors outside our control.',
  },
  {
    heading: 'Returns & Refunds',
    body: 'As we sell food products, returns are handled on a case-by-case basis. If an item arrives damaged or incorrect, please contact us promptly and we will make it right.',
  },
  {
    heading: 'Contact Us',
    body: 'For any questions about these Terms & Conditions, please reach out to us through the Contact page.',
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms & Conditions"
      updated="Last updated: January 2025"
      sections={SECTIONS}
      docTitle="Terms & Conditions — ANNAPURNA"
    />
  );
}
