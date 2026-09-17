import React from 'react';
import { m } from 'framer-motion';
import DataExport from '@/features/settings/components/DataExport';
import CookieSettings from './CookieSettings';

export default function PrivacySection() {
  return (
    <m.div
      key="privacy"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-3"
    >
      <DataExport />
      <CookieSettings />
    </m.div>
  );
}
