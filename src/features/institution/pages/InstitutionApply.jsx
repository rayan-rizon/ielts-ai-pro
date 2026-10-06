import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Building2,
  User,
  Mail,
  Globe,
  Users,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import DocumentHead from '@/components/shared/DocumentHead';
import InstitutionPublicLayout from '../components/InstitutionPublicLayout';
import { PANEL, MICRO, MUTED } from '@/features/dashboard/components/primitives';
import { submitInstitutionApplication } from '../services/institutions';
import { countries } from '@/lib/countries';
import InstitutionApprovalSteps from '../components/InstitutionApprovalSteps';
import { NativeSelect } from '../components/NativeSelect';
import { cn } from '@/lib/cn';
import { trackAppEvent } from '@/lib/tracking';

const INPUT =
  'w-full min-w-0 rounded-lg border border-[#e4e2f0] bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all duration-150 focus:border-[#5a63df] focus:ring-2 focus:ring-[#5a63df]/15 hover:border-stone-300 disabled:opacity-60 dark:border-white/10 dark:bg-[#141319] dark:hover:border-white/20 dark:focus:border-[#5a63df]';

function Field({ label, children, htmlFor, optional }) {
  return (
    <div className="block min-w-0 space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className={`${MICRO} text-stone-500 dark:text-stone-400 cursor-pointer select-none`}
        >
          {label}
        </label>
        {optional && (
          <span className="text-[10px] font-medium text-stone-400 dark:text-stone-500">
            Optional
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export default function InstitutionApply() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const requestKey = useRef(crypto.randomUUID());

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError('');
    try {
      await submitInstitutionApplication({ ...data, request_key: requestKey.current });
      trackAppEvent('institution_application_submitted', { email: data.email });
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <InstitutionPublicLayout>
      <DocumentHead
        title="Request institution access"
        description="Request Pro and Premium access for your institution’s IELTS students."
        noIndex
        noFollow
      />
      <div className="mx-auto w-full max-w-2xl space-y-6">
        {sent ? (
          <section
            className={cn(
              PANEL,
              'relative overflow-hidden p-6 sm:p-8 space-y-6 text-left border border-stone-200/90 shadow-xs'
            )}
            role="status"
          >
            {/* Header with status badge */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-2xs dark:bg-emerald-500/15 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Application Submitted</span>
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Request received
              </h1>
              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-xl">
                We’ll review your institution’s details and contact you at the email you provided.
                If approved, you’ll receive an owner invitation to set up your institution panel.
              </p>
            </div>

            {/* Next Steps Timeline */}
            <div className="rounded-xl border border-stone-200/80 bg-stone-50/60 p-4.5 dark:border-white/[0.07] dark:bg-white/[0.02] space-y-3">
              <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400 block')}>
                What happens next
              </span>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5a63df]/10 text-[10px] font-mono font-bold text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#bfc3ff]">
                      1
                    </span>
                    <span>Admin Review</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                    Our team verifies institutional credentials and requested capacity.
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-200/80 text-[10px] font-mono font-bold text-stone-600 dark:bg-white/10 dark:text-stone-300">
                      2
                    </span>
                    <span>Owner Invite</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                    A secure invitation link is delivered to the contact person's email.
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-200/80 text-[10px] font-mono font-bold text-stone-600 dark:bg-white/10 dark:text-stone-300">
                      3
                    </span>
                    <span>Activation</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                    Set your owner password and invite students into your portal.
                  </p>
                </div>
              </div>
            </div>

            {/* Reassurance Notice */}
            <div className="flex items-start gap-3 rounded-xl border border-stone-200/80 bg-stone-50/50 p-3.5 dark:border-white/[0.07] dark:bg-white/[0.02]">
              <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-[#5a63df] dark:text-[#bfc3ff] mt-0.5" />
              <div className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                <p className="font-semibold text-stone-800 dark:text-stone-200">
                  No Payment or Commitment Required
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  Submitting this form does not create an institution account or start a paid
                  subscription. You will have full review over student seat quotas before
                  onboarding.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-200/80 dark:border-white/[0.07]">
              <Link
                to="/institution/login"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#e4e2f0] bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:border-[#5a63df]/40 hover:bg-[#f7f6fd] hover:text-[#5a63df] transition-all duration-150 shadow-2xs active:scale-[0.99] dark:border-white/10 dark:bg-[#141319] dark:text-stone-200 dark:hover:bg-white/5"
              >
                <span>Already have access? Sign in</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to homepage</span>
              </Link>
            </div>
          </section>
        ) : (
          <>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#5a63df]/20 bg-[#5a63df]/[0.06] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5a63df] dark:border-[#8f97ff]/25 dark:bg-[#8f97ff]/[0.12] dark:text-[#bfc3ff]">
                <Building2 className="h-3 w-3" />
                <span>For IELTS institutions</span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Request institution access
              </h1>
              <p className={`${MUTED} mt-2 text-xs sm:text-sm leading-relaxed max-w-xl`}>
                Tell us about your institution. Our team will review your request and contact you.
              </p>
            </div>

            <div>
              <form
                className={cn(
                  PANEL,
                  'space-y-5 p-5 sm:p-7 border border-stone-200/90 shadow-xs relative'
                )}
                onSubmit={submit}
              >
                <fieldset disabled={busy} className="grid min-w-0 gap-4.5 sm:grid-cols-2">
                  <div className="min-w-0 sm:col-span-2">
                    <Field label="Institution name" htmlFor="institution_name">
                      <div className="relative">
                        <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                        <input
                          id="institution_name"
                          className={cn(INPUT, 'pl-9.5')}
                          name="institution_name"
                          required
                          minLength={2}
                          maxLength={160}
                          autoComplete="organization"
                          placeholder="e.g. Oxford English Academy"
                        />
                      </div>
                    </Field>
                  </div>

                  <Field label="Contact person" htmlFor="contact_name">
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                      <input
                        id="contact_name"
                        className={cn(INPUT, 'pl-9.5')}
                        name="contact_name"
                        required
                        minLength={2}
                        maxLength={120}
                        autoComplete="name"
                        placeholder="e.g. Dr. Eleanor Vance"
                      />
                    </div>
                  </Field>

                  <Field label="Work email" htmlFor="email">
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                      <input
                        id="email"
                        className={cn(INPUT, 'pl-9.5')}
                        name="email"
                        type="email"
                        required
                        maxLength={254}
                        autoComplete="email"
                        placeholder="e.g. director@oxfordacademy.org"
                      />
                    </div>
                  </Field>

                  <Field label="Country" htmlFor="country">
                    <NativeSelect
                      id="country"
                      name="country"
                      aria-label="Country"
                      required
                      defaultValue=""
                      autoComplete="country-name"
                      icon={Globe}
                      className="h-10 text-sm"
                      placeholder="Select a country"
                      searchable
                    >
                      <option value="" disabled>
                        Select a country
                      </option>
                      {countries.map(({ code, name }) => (
                        <option key={code} value={name}>
                          {name}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>

                  <Field label="Expected student seats" htmlFor="expected_seats">
                    <div className="relative">
                      <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                      <input
                        id="expected_seats"
                        className={cn(INPUT, 'pl-9.5 font-mono')}
                        name="expected_seats"
                        type="number"
                        min={1}
                        max={100000}
                        step={1}
                        required
                        placeholder="e.g. 50"
                      />
                    </div>
                  </Field>

                  <div className="min-w-0 sm:col-span-2">
                    <Field label="Message (optional)" htmlFor="message" optional>
                      <textarea
                        id="message"
                        className={cn(
                          INPUT,
                          'min-h-[96px] py-2.5 resize-y text-xs sm:text-sm leading-relaxed'
                        )}
                        rows={3}
                        name="message"
                        maxLength={2000}
                        placeholder="Tell us about your student numbers, test targets, or specific onboarding timeline..."
                      />
                    </Field>
                  </div>

                  <div className="hidden" aria-hidden="true">
                    <label>
                      Website
                      <input name="website" tabIndex={-1} autoComplete="off" />
                    </label>
                  </div>
                </fieldset>

                {error && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-xs text-[rgb(var(--signal-fault))]"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className={cn(
                    'group flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#5a63df] px-4 text-sm font-bold text-white shadow-xs transition-all duration-200 cursor-pointer',
                    'hover:bg-[#4d55c7] hover:-translate-y-0.5 active:scale-[0.99] active:translate-y-0',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0'
                  )}
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting request…</span>
                    </>
                  ) : (
                    <>
                      <span>Submit request</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                {/* Account & Verification Notice */}
                <div className="flex items-start gap-2.5 rounded-lg border border-stone-200/80 bg-stone-50/70 p-3 text-left dark:border-white/[0.07] dark:bg-white/[0.03]">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#5a63df] dark:text-[#bfc3ff] mt-0.5" />
                  <div className="space-y-0.5 text-xs text-stone-600 dark:text-stone-300">
                    <p className="font-semibold text-stone-800 dark:text-stone-200">
                      Account & Verification Notice
                    </p>
                    <p className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                      Submitting a request does not create an institution account. We use these
                      details to review your request and contact you about access.
                    </p>
                  </div>
                </div>
              </form>
            </div>

            <section aria-label="Approval process" className={cn(PANEL, 'p-5 sm:p-6')}>
              <InstitutionApprovalSteps />
            </section>

            <p className={`${MUTED} text-center text-xs`}>
              Already approved or invited?{' '}
              <Link
                className="font-bold text-[#5a63df] hover:underline dark:text-[#bfc3ff]"
                to="/institution/login"
              >
                Sign in to your institution
              </Link>
            </p>
          </>
        )}
      </div>
    </InstitutionPublicLayout>
  );
}
