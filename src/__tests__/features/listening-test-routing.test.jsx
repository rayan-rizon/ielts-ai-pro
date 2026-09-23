import { describe, expect, it } from 'vitest';
import { hasListeningTestEntry } from '@/features/testing/listening/pages/ListeningTest';

describe('Listening test route entry', () => {
  it('requires a direct test or paired-test entry before rendering the test shell', () => {
    expect(hasListeningTestEntry({ search: '', hash: '' })).toBe(false);
    expect(hasListeningTestEntry({ search: '?test-id=passage-1', hash: '' })).toBe(true);
    expect(hasListeningTestEntry({ search: '', hash: '#invite=room-token' })).toBe(true);
    expect(hasListeningTestEntry({ search: '?room=room-1', hash: '' })).toBe(true);
    expect(hasListeningTestEntry({ search: '?together=true', hash: '' })).toBe(true);
    expect(hasListeningTestEntry({ search: '', hash: '' }, 'session-1')).toBe(true);
  });
});
