import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LazyMotion, domAnimation } from 'framer-motion';
import MaintenancePanel from '@/components/admin/communications/MaintenancePanel';

vi.mock('@/components/shared/MaintenanceScreen', () => ({ default: () => <div>Preview</div> }));
afterEach(cleanup);

function mount(value, onSave) {
  return render(
    <LazyMotion features={domAnimation}>
      <MaintenancePanel value={value} saving={false} onSave={onSave} />
    </LazyMotion>
  );
}

describe('maintenance save feedback', () => {
  it('keeps the saved state and switch action consistent after a rejected save', async () => {
    const onSave = vi.fn().mockResolvedValue(false);
    mount({ enabled: false }, onSave);
    fireEvent.click(screen.getByRole('button', { name: 'Take site offline' }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        'maintenance_mode',
        expect.objectContaining({ enabled: true })
      )
    );
    expect(screen.getByRole('button', { name: 'Take site offline' })).toBeInTheDocument();
    expect(screen.getByText('Site online')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bring site back online' })).toBeNull();
  });

  it('explains that an admin session can still browse during maintenance', () => {
    mount({ enabled: true, allow_admins: true }, vi.fn());
    expect(screen.getByText(/Your admin account can still access the site/)).toBeInTheDocument();
  });

  it('does not claim all admins are exempt when their bypass is disabled', () => {
    mount({ enabled: true, allow_admins: false }, vi.fn());
    expect(screen.queryByText(/Your admin account can still access the site/)).toBeNull();
    expect(screen.getByText(/The admin panel stays reachable/)).toBeInTheDocument();
  });
});
