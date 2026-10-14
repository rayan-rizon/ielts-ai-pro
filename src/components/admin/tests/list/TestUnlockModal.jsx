import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle,
  Check,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  UnlockKeyhole,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { AdminButton, NUM, Pill } from '@/components/admin/ui/primitives';

export default function TestUnlockModal({ isOpen, onClose, onConfirm, isLoading = false }) {
  const [confirmInput, setConfirmInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const busy = isLoading || pending;

  useEffect(() => {
    setConfirmInput('');
    setError('');
  }, [isOpen]);

  const isConfirmed = confirmInput === 'UNLOCK';

  const handleConfirm = async () => {
    if (!isConfirmed || busy || inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError('');
    try {
      const result = await onConfirm();
      if (result !== false) {
        setConfirmInput('');
        onClose();
      }
    } catch {
      setError('Could not unlock test changes. Please try again.');
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  const handleClose = () => {
    if (!busy && !inFlight.current) {
      setConfirmInput('');
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-[#131315] border border-stone-200/90 dark:border-white/10 sm:max-w-md rounded-xl p-5 shadow-lg space-y-4">
        <DialogHeader className="space-y-0 text-left">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200/80 bg-indigo-50/70 text-[#5a63df] dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
                  Unlock test changes
                </DialogTitle>
                <Pill tone="accent">Protected</Pill>
              </div>
              <DialogDescription className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                Enables editing and deletion for this session.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-lg border border-stone-200/80 bg-stone-50/70 px-3 py-2 text-[11px] text-stone-600 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-stone-300">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[#5a63df]" />
          <span>Auto-locks on save, module change, or editor exit.</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-300">
            <span>
              To confirm, type{' '}
              <span
                className={cn(
                  NUM,
                  'font-bold text-stone-900 dark:text-stone-50 select-all rounded px-1.5 py-0.5 bg-stone-200/70 dark:bg-white/10'
                )}
              >
                UNLOCK
              </span>{' '}
              below:
            </span>
            <button
              type="button"
              onClick={() => setConfirmInput('UNLOCK')}
              className="text-[10px] font-bold text-[#5a63df] hover:underline cursor-pointer transition-colors"
            >
              Auto-fill
            </button>
          </div>
          <div className="relative">
            <Input
              aria-label="Confirmation text"
              disabled={busy}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isConfirmed && !busy) {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
              placeholder="UNLOCK"
              autoComplete="off"
              autoFocus
              className={cn(
                NUM,
                'h-10 rounded-lg text-xs font-bold uppercase tracking-wider pr-9 transition-all',
                isConfirmed
                  ? 'border-[rgb(var(--signal-ok)/0.5)] bg-[rgb(var(--signal-ok)/0.03)] text-[rgb(var(--signal-ok))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--signal-ok)/0.3)]'
                  : 'border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-stone-900 dark:text-stone-50 focus-visible:ring-2 focus-visible:ring-[#5a63df]/30 focus-visible:border-[#5a63df]'
              )}
            />
            {isConfirmed && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Check className="h-4 w-4 text-[rgb(var(--signal-ok))]" />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 text-xs text-[rgb(var(--signal-fault))] bg-[rgb(var(--signal-fault)/0.06)] p-2.5 rounded-lg border border-[rgb(var(--signal-fault)/0.2)]"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-1">
          <AdminButton
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={busy}
            className="w-full sm:w-auto"
          >
            Cancel
          </AdminButton>
          <button
            type="button"
            disabled={!isConfirmed || busy}
            onClick={handleConfirm}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-lg h-8 px-4 text-xs font-bold transition-all duration-150 ease-smooth-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#131315] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 w-full sm:w-auto min-w-[130px]',
              isConfirmed
                ? 'bg-[#5a63df] hover:bg-[#4d56d1] text-white shadow-xs'
                : 'bg-stone-200 dark:bg-white/10 text-stone-400 dark:text-stone-500'
            )}
          >
            {busy ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Unlocking…
              </>
            ) : (
              <>
                <UnlockKeyhole className="h-3.5 w-3.5" />
                Unlock changes
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
