import React from 'react';
import DataExport from '@/features/settings/components/DataExport';
import CookieSettings from './CookieSettings';

export default function PrivacySection() {
  return (
    <div className="space-y-3">
      <DataExport />
      <CookieSettings />
    </div>
  );
}
