import { describe, it, expect } from 'vitest';
import {
  getInstitutionInvitationTemplate,
  getEmailTemplate,
} from '../../../supabase/functions/_shared/templates';

const input = {
  email: 'owner@example.test',
  institutionName: 'Academy <script>alert(1)</script>',
  invitationUrl: 'https://www.ieltsai.pro/institution/accept?token=one&next=two',
  expiresAt: '2026-10-16T10:00:00Z',
};

describe('institution invitation emails', () => {
  it('uses the shared brand shell with escaped details, real expiry, and matching text', () => {
    const email = getInstitutionInvitationTemplate({ ...input, kind: 'owner' });
    expect(email.html).toContain('footer.png');
    expect(email.html).toContain('v:roundrect');
    expect(email.html).toContain('Academy &lt;script&gt;');
    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('token=one&amp;next=two');
    expect(email.text).toContain(input.invitationUrl);
    expect(email.html).toContain('16 Oct 2026');
    expect(email.text).toContain('16 Oct 2026');
    expect(email.html).toContain('Institution sign-in');
    expect(email.html).not.toContain('Unsubscribe');
    expect(email.html).not.toContain('/settings?tab=subscription');
    expect(email.text).toContain('set up your password');
  });

  it('distinguishes student access from owner management', () => {
    const email = getInstitutionInvitationTemplate({ ...input, kind: 'student' });
    expect(email.subject).toContain('student invitation');
    expect(email.html).toContain('Student invitation');
    expect(email.text).toContain('view your institution access');
    expect(email.text).not.toContain('manage students');
  });

  it('uses each recipient and stored expiry without a fixed invitation duration', () => {
    const email = getInstitutionInvitationTemplate({
      ...input,
      email: 'student+invited@example.test',
      kind: 'student',
      expiresAt: '2026-11-02T23:15:00+06:00',
    });
    expect(email.html).toContain('student+invited@example.test');
    expect(email.text).toContain('student+invited@example.test');
    expect(email.html).toContain('2 Nov 2026, 17:15 UTC');
    expect(email.text).toContain('2 Nov 2026, 17:15 UTC');
    expect(email.html).toContain(
      `href="https://www.ieltsai.pro/institution/accept?token=one&amp;next=two"`
    );
    expect(email.text).not.toContain('16 Oct 2026');
  });

  it('rejects an invalid expiry instead of displaying inaccurate information', () => {
    expect(() =>
      getInstitutionInvitationTemplate({ ...input, kind: 'owner', expiresAt: 'invalid' })
    ).toThrow('Invalid invitation expiry');
  });

  it('retains existing subscription footer navigation', () => {
    const email = getEmailTemplate('welcome', { full_name: 'Learner' });
    expect(email.html).toContain('/settings?tab=subscription');
    expect(email.html).toContain('Unsubscribe');
  });
});
