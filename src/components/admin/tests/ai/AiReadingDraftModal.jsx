import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { PANEL, MICRO, MUTED, NUM } from '@/features/dashboard/components/primitives.jsx';
import { Sparkles, Loader2, X, ArrowLeft, Save, ChevronRight, Check, Eye } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  validateAiReadingDraft,
  aiReadingDraftSections,
} from '../../../../../supabase/functions/_shared/aiReadingDraft';
import {
  validateAiReadingInput,
  parseAiReadingAnswers,
} from '../../../../../supabase/functions/_shared/aiReadingInput';
import {
  generateReadingDraft,
  prepareReadingScreenshot,
  saveReadingAiDraft,
  generateListeningDraft,
  saveListeningAiDraft,
} from '@/lib/aiReadingDraftClient';
import {
  validateAiListeningInput,
  validateAiListeningDraft,
  aiListeningDraftSections,
} from '../../../../../supabase/functions/_shared/aiListeningDraft';
import AiReadingDraftInput from './AiReadingDraftInput';
import AiReadingDraftPreview from './AiReadingDraftPreview';

const EMPTY_INPUT = {
  passageText: '',
  questionText: '',
  answerText: '',
  expectedQuestions: 40,
  images: [],
  testFormat: 'Academic',
  accessTier: 'free',
  audioUrls: ['', '', '', ''],
};
const ListeningStudentPreview = lazy(() => import('../preview/ListeningStudentPreview'));
const ReadingStudentPreview = lazy(() => import('../preview/ReadingStudentPreview'));

export default function AiReadingDraftModal({ onClose, onSaved, testType = 'reading' }) {
  const listening = testType === 'listening';
  const moduleName = listening ? 'Listening' : 'Reading';
  const validateInput = listening ? validateAiListeningInput : validateAiReadingInput;
  const validateDraft = listening ? validateAiListeningDraft : validateAiReadingDraft;
  const generateDraft = listening ? generateListeningDraft : generateReadingDraft;
  const saveDraft = listening ? saveListeningAiDraft : saveReadingAiDraft;
  const StudentPreview = listening ? ListeningStudentPreview : ReadingStudentPreview;
  const [input, setInput] = useState(EMPTY_INPUT);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [preparing, setPreparing] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [showStudentPreview, setShowStudentPreview] = useState(false);
  const readySources = [
    ['passageText', 'passage'],
    ['questionText', 'questions'],
    ['answerText', 'answers'],
  ].filter(
    ([field, role]) => input[field].trim() || input.images.some((image) => image.role === role)
  ).length;
  const request = useRef(0);
  const saveRequest = useRef(null);
  const locked = useRef(false);
  useEffect(
    () => () => {
      request.current++;
    },
    []
  );
  const changeInput = (field, value) => {
    setInput((prev) => {
      const next = { [field]: value };
      if (field === 'answerText') {
        try {
          const count = Object.keys(parseAiReadingAnswers(value)).length;
          if (count) next.expectedQuestions = count;
        } catch {
          /* Incomplete typing keeps the current question count. */
        }
      }
      return { ...prev, ...next };
    });
    setError('');
  };
  const dismiss = () => {
    if (busy === 'saving') return;
    request.current++;
    onClose();
  };
  const validationError = useMemo(() => {
    if (!result) return '';
    try {
      validateDraft(result.draft, validateInput(input));
      return '';
    } catch (err) {
      return err.message;
    }
  }, [result, input, validateDraft, validateInput]);

  const addImages = async (files, role) => {
    if (preparing || busy) return;
    if (files.length + input.images.length > 8) {
      setError('Upload up to eight screenshots in total.');
      return;
    }
    const current = request.current;
    setPreparing(true);
    setError('');
    try {
      const images = [];
      for (const file of files)
        images.push({
          ...(await prepareReadingScreenshot(file, role)),
          id: crypto.randomUUID(),
        });
      if (request.current === current)
        setInput((prev) => ({ ...prev, images: [...prev.images, ...images] }));
    } catch (err) {
      if (request.current === current) setError(err.message);
    } finally {
      if (request.current === current) setPreparing(false);
    }
  };

  const generate = async () => {
    if (locked.current || preparing) return;
    try {
      validateInput(input);
    } catch (err) {
      setError(err.message);
      return;
    }
    locked.current = true;
    const current = ++request.current;
    setBusy('generating');
    setError('');
    setReviewed(false);
    try {
      const next = await generateDraft(input);
      if (request.current === current) {
        setResult(next);
        saveRequest.current = null;
      }
    } catch (err) {
      if (request.current === current) setError(err.message);
    } finally {
      if (request.current === current) {
        setBusy('');
        locked.current = false;
      }
    }
  };

  const save = async () => {
    if (locked.current || !reviewed || validationError || !result) return;
    locked.current = true;
    setBusy('saving');
    setError('');
    // A lost response can be retried using this exact request and payload.
    const payload = {
      draft: result.draft,
      expectedQuestions: input.expectedQuestions,
      testFormat: input.testFormat,
      accessTier: input.accessTier,
      ...(listening ? { audioUrls: input.audioUrls } : {}),
    };
    const fingerprint = JSON.stringify(payload);
    if (saveRequest.current?.fingerprint !== fingerprint)
      saveRequest.current = { fingerprint, id: crypto.randomUUID() };
    try {
      const id = await saveDraft({ ...payload, requestId: saveRequest.current.id });
      onSaved(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
      locked.current = false;
    }
  };

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) dismiss();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/65" />
        <Dialog.Content
          onEscapeKeyDown={(event) => {
            if (busy === 'saving') event.preventDefault();
          }}
          onInteractOutside={(event) => event.preventDefault()}
          className={cn(
            PANEL,
            'fixed inset-x-3 top-1/2 -translate-y-1/2 z-50 flex flex-col w-auto sm:inset-x-6 max-w-[1080px] mx-auto max-h-[calc(100dvh-1.5rem)] outline-none overflow-hidden text-slate-800 dark:text-slate-100'
          )}
        >
          <header className="border-b border-[#e4e2f0] dark:border-white/[0.07] px-4 sm:px-5 py-4 pr-14">
            <p className={cn(MICRO, 'text-[#5a63df] dark:text-[#afb5ff]')}>
              {moduleName} · AI assisted
            </p>
            <Dialog.Title className="text-lg font-extrabold tracking-tight mt-1">
              {result ? `Review your ${moduleName} draft` : `Create a ${moduleName} test`}
            </Dialog.Title>
            <Dialog.Description className={cn(MUTED, 'text-xs mt-1')}>
              Add your material. AI builds the questions and explanations for you to review.
            </Dialog.Description>
            <button
              aria-label="Close AI creator"
              onClick={dismiss}
              disabled={busy === 'saving'}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-md border border-[#e4e2f0] dark:border-white/10 hover:bg-[#5a63df]/[0.07] transition-colors focus-visible:ring-2 focus-visible:ring-[#5a63df]"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <ol
            aria-label="Creation steps"
            className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-[#e4e2f0] dark:border-white/[0.07]"
          >
            {['Add material', 'Review test', 'Save draft'].map((step, index) => (
              <li
                key={step}
                aria-current={(result ? 1 : 0) === index ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 text-[11px]',
                  (result ? 1 : 0) === index
                    ? 'font-semibold text-[#5a63df] dark:text-[#afb5ff]'
                    : MUTED
                )}
              >
                {index > 0 && (
                  <ChevronRight className="w-3 h-3 mr-1 opacity-50" aria-hidden="true" />
                )}
                <span
                  className={cn(
                    NUM,
                    'grid h-5 w-5 place-items-center rounded-full border',
                    (result ? 1 : 0) === index && 'border-[#5a63df]/30 bg-[#5a63df]/[0.07]'
                  )}
                >
                  {result && index === 0 ? <Check className="w-3 h-3" /> : index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5" aria-busy={!!busy}>
            {result ? (
              <AiReadingDraftPreview
                draft={result.draft}
                testType={testType}
                model={result.model}
                cost={result.usage?.estimatedProviderCostUsd}
                onChange={(draft) => {
                  if (!busy) {
                    setResult((prev) => ({ ...prev, draft }));
                    setReviewed(false);
                    setError('');
                  }
                }}
              />
            ) : (
              <AiReadingDraftInput
                input={input}
                testType={testType}
                onChange={changeInput}
                onImages={addImages}
                busy={!!busy}
                preparing={preparing}
                onRemoveImage={(id) =>
                  changeInput(
                    'images',
                    input.images.filter((image) => image.id !== id)
                  )
                }
              />
            )}
            {(error || validationError) && (
              <p role="alert" className="mt-4 text-sm text-[rgb(var(--signal-fault))]">
                {error || validationError}
              </p>
            )}
            {busy === 'generating' && (
              <p role="status" className="mt-4 text-sm">
                Reading your material and checking answers and explanations. This may take a minute
                or two.
              </p>
            )}
          </div>
          <footer className="border-t border-[#e4e2f0] dark:border-white/[0.07] px-4 sm:px-5 py-3 space-y-3">
            {result ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-start gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={reviewed}
                      disabled={!!busy || !!validationError}
                      onChange={(e) => setReviewed(e.target.checked)}
                      className="mt-0.5 accent-[#5a63df]"
                    />
                    I checked the passages, question layout, answers and explanations.
                  </label>
                  <span className={cn(MUTED, 'text-[11px]')}>
                    Saved drafts need publishing in Test Management.
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!!busy}
                    onClick={() => {
                      setResult(null);
                      setError('');
                      setReviewed(false);
                    }}
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                    Back to source
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!!busy || !!validationError}
                      onClick={() => setShowStudentPreview(true)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      Student preview
                    </Button>
                    <Button
                      size="sm"
                      disabled={!!busy || !reviewed || !!validationError}
                      onClick={save}
                      className="bg-[#5a63df] hover:bg-[#4d56cb] text-white shadow-none"
                    >
                      {busy === 'saving' ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Save inactive draft
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium">
                    {readySources === 3
                      ? 'All material ready to review'
                      : 'Add a passage, questions and answer key'}
                  </p>
                  <p className={cn(MUTED, 'text-[10px] mt-0.5')}>
                    AI explanations included · review before saving
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={!!busy || preparing}
                    onClick={generate}
                    className="bg-[#5a63df] hover:bg-[#4d56cb] text-white shadow-none"
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    <span aria-label="Generate test and explanations">
                      {busy ? 'Generating…' : 'Generate test and explanations'}
                    </span>
                  </Button>
                </div>
              </div>
            )}
          </footer>
        </Dialog.Content>
        {showStudentPreview && result && (
          <Suspense fallback={<p role="status">Opening student preview…</p>}>
            <StudentPreview
              sections={
                listening
                  ? aiListeningDraftSections(result.draft, input.audioUrls)
                  : aiReadingDraftSections(result.draft)
              }
              showSourceHighlights={result.draft.sections.some(
                (section) => section.highlights?.length
              )}
              title={result.draft.title}
              onClose={() => setShowStudentPreview(false)}
            />
          </Suspense>
        )}
      </Dialog.Portal>
    </Dialog.Root>
  );
}
