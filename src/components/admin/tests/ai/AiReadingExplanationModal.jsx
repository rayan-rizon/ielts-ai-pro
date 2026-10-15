import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import ReadingEditorSelect from '../ReadingEditorSelect';
import { Button } from '@/components/ui/button';
import { PANEL, MUTED, Pill } from '@/features/dashboard/components/primitives.jsx';
import { ExplanationBody } from '@/features/testing/reading/components/DeepDivePopover';
import {
  generateReadingExplanations,
  generateListeningExplanations,
} from '@/lib/aiReadingDraftClient';
import { cn } from '@/lib/cn';
import { Sparkles, Loader2, X } from 'lucide-react';
export default function AiReadingExplanationModal({
  sections,
  selectedSection,
  onApply,
  onClose,
  testType = 'reading',
}) {
  const listening = testType === 'listening';
  const [scope, setScope] = useState(String(selectedSection));
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const version = useRef(0);
  const original = useRef(JSON.stringify(sections));
  useEffect(
    () => () => {
      version.current++;
    },
    []
  );
  const generate = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    setResult(null);
    const current = ++version.current;
    const source = JSON.stringify(sections);
    try {
      const next = await (listening ? generateListeningExplanations : generateReadingExplanations)(
        sections,
        scope === 'all' ? null : Number(scope)
      );
      if (version.current === current) {
        setResult(next);
        original.current = source;
      }
    } catch (err) {
      if (version.current === current) setError(err.message);
    } finally {
      if (version.current === current) setBusy(false);
    }
  };
  const apply = () => {
    if (JSON.stringify(sections) !== original.current) {
      setError('The test changed. Generate explanations again.');
      return;
    }
    onApply(result.explanations);
    onClose();
  };
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/65" />
        <Dialog.Content
          className={cn(
            PANEL,
            'fixed inset-x-3 sm:inset-x-6 top-1/2 -translate-y-1/2 max-h-[calc(100dvh-1.5rem)] z-50 mx-auto max-w-2xl flex flex-col overflow-hidden text-foreground outline-none'
          )}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <header className="p-4 pr-14 border-b border-[#e4e2f0] dark:border-white/[0.07]">
            <Dialog.Title className="font-extrabold text-lg">
              Generate {listening ? 'Listening' : 'Reading'} explanations
            </Dialog.Title>
            <Dialog.Description className={cn(MUTED, 'text-xs mt-2')}>
              AI uses your current source and answer key. Check its evidence before applying.
            </Dialog.Description>
            <button
              aria-label="Close AI explanations"
              onClick={onClose}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-md border border-[#e4e2f0] dark:border-white/10 hover:bg-[#5a63df]/[0.07] focus-visible:ring-2 focus-visible:ring-[#5a63df] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3">
            <div className="space-y-2">
              <p className="text-xs font-medium">Generate for</p>
              <ReadingEditorSelect
                label="Generate for"
                value={scope}
                disabled={busy}
                onValueChange={(value) => {
                  setScope(value);
                  setResult(null);
                }}
                options={[
                  ...(listening ? [0, 1, 2, 3] : [0, 1, 2]).map((i) => ({
                    value: String(i),
                    label: `${listening ? 'Part' : 'Passage'} ${i + 1}`,
                    disabled:
                      !(listening
                        ? sections[i]?.transcript || sections[i]?.srt_content
                        : sections[i]?.content) ||
                      !sections[i]?.groups?.some((g) => g.questions?.length),
                  })),
                  { value: 'all', label: listening ? 'All parts' : 'All passages' },
                ]}
              />
            </div>
            {!result && !busy && (
              <div className="rounded-lg border border-dashed border-[#e4e2f0] dark:border-white/10 p-5 text-center">
                <Sparkles className="h-5 w-5 text-[#5a63df] mx-auto mb-2" />
                <p className="text-sm font-semibold">Explanations, grounded in your passage</p>
                <p className={cn(MUTED, 'text-xs mt-1')}>
                  Includes answer reasoning, quoted evidence and keyword connections.
                </p>
              </div>
            )}
            {result && (
              <>
                <Pill tone="accent">
                  {result.model?.includes('luna') ? 'GPT-6 Luna' : 'GLM-5.3 Flash'}
                </Pill>
                <ExplanationBody
                  entries={Object.entries(result.explanations).map(([key, data]) => ({
                    key,
                    data,
                  }))}
                />
              </>
            )}
            {busy && (
              <p role="status" className="text-sm">
                Generating explanations and checking passage evidence…
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-[rgb(var(--signal-fault))]">
                {error}
              </p>
            )}
          </div>
          <footer className="p-4 border-t border-[#e4e2f0] dark:border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
            <Button
              onClick={generate}
              disabled={busy}
              variant={result ? 'outline' : 'default'}
              className={
                !result ? 'bg-[#5a63df] hover:bg-[#4d56cb] text-white shadow-none' : 'shadow-none'
              }
            >
              {busy ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {result ? 'Regenerate explanations' : 'Generate explanations'}
            </Button>
            {result && (
              <>
                <Button
                  disabled={busy}
                  onClick={apply}
                  className="bg-[#5a63df] hover:bg-[#4d56cb] text-white shadow-none"
                >
                  Apply explanations
                </Button>
              </>
            )}
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
