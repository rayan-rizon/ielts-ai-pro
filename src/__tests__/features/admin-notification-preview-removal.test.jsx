import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('temporary learner notification preview removal', () => {
  it('does not expose the temporary route or static showcase', () => {
    const appSource = readFileSync('src/App.jsx', 'utf8');
    const autopilotSource = readFileSync(
      'src/components/admin/marketing/AutopilotPanel.jsx',
      'utf8'
    );

    expect(appSource).not.toContain('/dashboard/notification-preview');
    expect(appSource).not.toContain('AdminNotificationShowcase');
    expect(autopilotSource).not.toContain('Learner preview');
  });
});
