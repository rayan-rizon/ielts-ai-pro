import React from 'react';
import { motion } from 'framer-motion';
import DataExport from '@/features/settings/components/DataExport';
import CookieSettings from './CookieSettings';

export default function PrivacySection() {
  return (
    <motion.div
      key="privacy"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <DataExport />
      <CookieSettings />
    </motion.div>
  );
}
