import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { PANEL, TITLE, MUTED } from '@/features/dashboard/components/primitives.jsx';
import { cn } from '@/lib/cn';

export default function InstitutionBrand({
  institution,
  className,
  variant = 'panel',
  compact = false,
}) {
  const [failedUrl, setFailedUrl] = useState(null);
  if (!institution?.name) return null;
  const url = institution.logo_url;
  const showLogo = url && /^(https:\/\/|blob:)/.test(url) && failedUrl !== url;
  const sidebar = variant === 'sidebar';

  return (
    <section
      aria-label="Your institution"
      className={cn(
        sidebar
          ? 'flex min-w-0 w-full items-center gap-2.5'
          : `${PANEL} flex min-w-0 items-center gap-3 p-3`,
        compact && 'justify-center',
        className
      )}
    >
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-lg border border-[#e4e2f0] bg-white p-1.5 dark:border-white/[0.07]',
          sidebar ? 'h-9 w-9' : 'h-12 w-16'
        )}
      >
        {showLogo ? (
          <img
            src={url}
            alt={`${institution.name} logo`}
            className="max-h-full max-w-full object-contain"
            referrerPolicy="no-referrer"
            onError={() => setFailedUrl(url)}
          />
        ) : (
          <Building2 aria-hidden="true" className="h-6 w-6 text-[#5a63df]" />
        )}
      </div>
      <div className={cn('min-w-0', compact && 'sr-only')}>
        <p
          className={cn(
            TITLE,
            'wrap-anywhere',
            sidebar && 'text-[11px] leading-tight line-clamp-2'
          )}
        >
          {institution.name}
        </p>
        <p className={cn(MUTED, 'mt-0.5', sidebar ? 'text-[9px]' : 'text-[11px]')}>
          Powered by IELTS AI Pro
        </p>
      </div>
    </section>
  );
}
