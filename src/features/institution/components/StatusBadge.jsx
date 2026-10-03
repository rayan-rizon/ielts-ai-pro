import React from 'react';
import { STATUS_LABELS } from '../services/history';
import { Pill } from '@/features/dashboard/components/primitives';

export function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status;
  let tone = 'neutral';
  if (status === 'active' || status === 'paid') tone = 'ok';
  else if (status === 'waiting' || status === 'pending') tone = 'warn';
  else if (status === 'invited') tone = 'accent';
  else if (status === 'revoked' || status === 'failed') tone = 'fault';
  else if (status === 'archived' || status === 'suspended') tone = 'neutral';

  return (
    <Pill
      tone={tone}
      className="capitalize text-[10px] font-bold tracking-wide whitespace-nowrap shrink-0 px-2 py-0.5"
    >
      {label}
    </Pill>
  );
}

export default StatusBadge;
