import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import { MICRO, MUTED } from '@/components/admin/ui/primitives';

/**
 * Inbox-accurate preview of a marketing campaign email.
 *
 * This deliberately mirrors the shell in `supabase/functions/_shared/templates.ts`
 * — same ink header, same accent rule, same measure and footer — so what an
 * operator approves here is what the learner receives. It renders in fixed
 * light-mode brand colours rather than the admin theme, because that is what
 * the mail client will show.
 */
const EmailPreviewDialog = ({ campaign, open, onOpenChange }) => {
  if (!campaign) return null;
  const subject = campaign.subject || campaign.title;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[96vw] max-w-2xl overflow-y-auto border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-[#131315]">
        <DialogHeader>
          <DialogTitle>Email preview</DialogTitle>
          <DialogDescription>
            Live emails address the recipient by their username; this preview uses a sample. The
            subject line is inbox metadata and is not repeated in the body.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-stone-200 bg-stone-100 p-3 dark:border-white/10 dark:bg-[#0d0d10] sm:p-5">
          {/* Inbox row */}
          <div className="mx-auto mb-3 max-w-[600px] rounded-lg border border-stone-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#18171d]">
            <p className={cn(MICRO, MUTED)}>Inbox subject</p>
            <p className="mt-1 truncate text-sm font-extrabold text-stone-900 dark:text-stone-50">
              {subject}
            </p>
          </div>

          {/* The email itself — brand colours, not admin theme. */}
          <div className="mx-auto max-w-[600px] overflow-hidden rounded-2xl border border-[#e6e3dd] bg-white shadow-sm">
            <div className="bg-[#111113] px-10 py-5 text-center">
              <span className="inline-flex min-h-[42px] items-center justify-center">
                <img
                  src="/footer.png"
                  width="176"
                  height="42"
                  alt="IELTS AI Pro"
                  className="mx-auto h-auto w-44"
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                    event.currentTarget.nextElementSibling.hidden = false;
                  }}
                />
                <span hidden className="text-sm font-extrabold tracking-tight text-[#f7f8ff]">
                  IELTS AI Pro
                </span>
              </span>
            </div>
            <div className="flex h-[3px]">
              <span className="flex-1 bg-[#6c4cff]" />
              <span className="flex-1 bg-[#8a6bff]" />
              <span className="flex-1 bg-[#a977ff]" />
            </div>

            <div className="px-6 py-9 sm:px-10">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#6c4cff]">
                {String(campaign.objective || 'update').replaceAll('_', ' ')}
              </p>
              <h3 className="mt-2.5 text-[26px] font-extrabold leading-[1.2] tracking-tight text-[#18181b]">
                {campaign.title}
              </h3>
              <p className="mt-5 text-[17px] leading-relaxed text-[#3f3f46]">Hi alex,</p>
              <p className="mt-3 text-[15px] leading-[1.65] text-[#52525b]">{campaign.message}</p>
              <p className="mt-4 text-[15px] leading-[1.65] text-[#52525b]">
                Pick up where you left off, review your recent feedback, and choose the one thing
                that moves you closest to your target band.
              </p>

              {campaign.promo?.code && (
                <div className="mt-7 rounded-xl border border-[#ddd6fe] bg-[#f7f6ff] p-5 text-center">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#6246d9]">
                    Your offer code
                  </p>
                  <p className="mt-2 font-mono text-xl font-extrabold tracking-[0.08em] text-[#4c43a8]">
                    {campaign.promo.code}
                  </p>
                  <p className="mt-2 text-xs font-medium text-[#625d82]">
                    Apply it at checkout when you choose your plan.
                  </p>
                </div>
              )}

              <div className="mt-8 text-center">
                <span className="inline-flex rounded-[10px] bg-[#6c4cff] px-7 py-3.5 text-[15px] font-extrabold text-white">
                  {campaign.cta_label || 'Learn more'}
                </span>
              </div>

              <div className="mt-8 border-t border-[#ebe9e5] pt-6">
                <p className="text-[13px] leading-relaxed text-[#71717a]">
                  Your progress and practice history stay saved in your account, so you can return
                  whenever you are ready.
                </p>
              </div>
            </div>

            <div className="border-t border-[#ebe9e5] bg-[#faf9f7] px-6 py-7 text-center sm:px-10">
              <p className="text-[12px] text-[#52525b]">
                <span className="font-semibold">Manage</span>
                <span className="mx-2 text-[#a1a1aa]">·</span>
                <span className="font-semibold">Privacy</span>
                <span className="mx-2 text-[#a1a1aa]">·</span>
                <span className="font-semibold">Terms</span>
                <span className="mx-2 text-[#a1a1aa]">·</span>
                <span className="font-semibold underline">Unsubscribe</span>
              </p>
              <p className="mt-3 text-[11px] leading-5 text-[#71717a]">
                You are receiving this because you enabled marketing communications on your IELTS AI
                Pro account.
              </p>
              <p className="mt-2 text-[11px] text-[#a1a1aa]">
                © {new Date().getFullYear()} IELTS AI Pro · support@ieltsai.pro
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailPreviewDialog;
