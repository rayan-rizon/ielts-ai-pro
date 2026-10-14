import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MICRO, MUTED, WELL } from '@/features/dashboard/components/primitives.jsx';
import { ImagePlus, X, ScanLine } from 'lucide-react';
import ReadingEditorSelect from '../ReadingEditorSelect';
import { cn } from '@/lib/cn';

const SOURCES = [
  {
    field: 'passageText',
    role: 'passage',
    label: 'Passages',
    title: 'All passages',
    hint: 'Keep passage titles and paragraph letters. AI separates Passage 1–3.',
    placeholder: 'Paste all three passages here…',
  },
  {
    field: 'questionText',
    role: 'questions',
    label: 'Questions',
    title: 'All questions',
    hint: 'Include instructions, options and word limits.',
    placeholder: 'Paste all question groups here, numbered 1–40…',
  },
  {
    field: 'answerText',
    role: 'answers',
    label: 'Answer key',
    title: 'Answer key',
    hint: 'One complete key, with one numbered answer per line.',
    placeholder: '1. TRUE\n2. NOT GIVEN\n3. B\n4. migration',
  },
];

function SourceField({ source, input, onChange, onImages, onRemoveImage, disabled, preparing }) {
  const { field, role, label, title, hint, placeholder } = source;
  const images = input.images.filter((image) => image.role === role);
  return (
    <section
      className={cn(
        'min-w-0 flex flex-col rounded-lg border border-[#e4e2f0] dark:border-white/[0.09] overflow-hidden',
        role === 'passage' && 'md:row-span-2'
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-[#e4e2f0] dark:border-white/[0.07]">
        <label htmlFor={`ai-${field}`} className="text-xs font-semibold">
          {title}
        </label>
        <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#5a63df] dark:text-[#afb5ff] cursor-pointer rounded px-1.5 py-1 hover:bg-[#5a63df]/[0.07] focus-within:ring-2 focus-within:ring-[#5a63df] transition-colors">
          <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
          {images.length ? `${images.length} attached · Add` : 'Add image'}
          <input
            aria-label={`${label} screenshots`}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="sr-only"
            disabled={disabled || preparing}
            onChange={(e) => {
              onImages(Array.from(e.target.files || []), role);
              e.target.value = '';
            }}
          />
        </label>
      </div>
      <Textarea
        id={`ai-${field}`}
        aria-label={label}
        value={input[field]}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        rows={role === 'passage' ? 10 : role === 'questions' ? 4 : 3}
        className={cn(
          'rounded-none border-0 bg-transparent shadow-none text-sm leading-relaxed resize-y focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5a63df] px-3 py-3',
          role === 'passage'
            ? 'min-h-64 md:flex-1'
            : role === 'questions'
              ? 'min-h-24'
              : 'min-h-20 font-mono text-xs'
        )}
        disabled={disabled}
      />
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pb-2">
          {images.map((image) => (
            <div
              key={image.id}
              className={cn(WELL, 'flex items-center gap-2 rounded-md p-1.5 min-w-0 max-w-full')}
            >
              <img
                src={image.dataUrl}
                alt={`${label}: ${image.name}`}
                className="h-9 w-9 object-cover rounded shrink-0"
              />
              <span className="text-[11px] truncate max-w-32" title={image.name}>
                {image.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                disabled={disabled}
                aria-label={`Remove ${image.name}`}
                onClick={() => onRemoveImage(image.id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <p className={cn(MUTED, 'px-3 pb-2.5 text-[11px]')}>{hint}</p>
    </section>
  );
}

export default function AiReadingDraftInput({
  input,
  onChange,
  onImages,
  onRemoveImage,
  busy,
  preparing,
  testType = 'reading',
}) {
  const listening = testType === 'listening';
  const sources = listening
    ? SOURCES.map((source) =>
        source.role === 'passage'
          ? {
              ...source,
              label: 'Transcripts',
              title: 'All audioscripts',
              hint: 'Keep speaker labels and Part 1–4 headings. Explanations require transcript evidence.',
              placeholder: 'Paste all four parts’ transcripts here…',
            }
          : source.role === 'answers'
            ? { ...source, placeholder: '1. library\n2. 1999\n3. B\n4. glass jars' }
            : source
      )
    : SOURCES;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold">
            {listening ? 'All four parts, in one go' : 'All three passages, in one go'}
          </p>
          <p className={cn(MUTED, 'text-[11px] mt-1')}>
            Paste everything once, or attach your screenshots.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] font-medium">
          Expected questions
          <Input
            type="number"
            min="1"
            max="40"
            value={input.expectedQuestions}
            onChange={(e) => onChange('expectedQuestions', e.target.value)}
            disabled={busy}
            className="h-8 w-16 rounded-md shadow-none text-xs font-mono"
          />
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-3">
        {sources.map((source) => (
          <SourceField
            key={source.role}
            source={source}
            input={input}
            onChange={onChange}
            onImages={onImages}
            onRemoveImage={onRemoveImage}
            disabled={busy}
            preparing={preparing}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p className={cn(MUTED, 'flex items-center gap-2 text-[11px]')}>
          <ScanLine className="h-3.5 w-3.5 shrink-0" />
          Highlight answers in source images to capture their evidence.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {!listening && (
            <div className="flex items-center gap-2">
              <span className={cn(MICRO, MUTED)}>Test format</span>
              <ReadingEditorSelect
                label="Test format"
                value={input.testFormat}
                onValueChange={(value) => onChange('testFormat', value)}
                disabled={busy}
                options={[
                  { value: 'Academic', label: 'Academic' },
                  { value: 'General', label: 'General Training' },
                ]}
                className="w-36"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className={cn(MICRO, MUTED)}>Access</span>
            <ReadingEditorSelect
              label="Access"
              value={input.accessTier}
              onValueChange={(value) => onChange('accessTier', value)}
              disabled={busy}
              options={[
                { value: 'free', label: 'Free' },
                { value: 'pro', label: 'Pro' },
              ]}
              className="w-20"
            />
          </div>
        </div>
      </div>
      {listening && (
        <details className="text-xs">
          <summary className="cursor-pointer font-medium">
            Audio links · optional for drafts
          </summary>
          <p className={cn(MUTED, 'text-[11px] my-2')}>
            Attach one link per part. You can also upload audio in the editor after saving.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((index) => (
              <label key={index} className="space-y-1 block">
                Part {index + 1} audio
                <Input
                  aria-label={`Part ${index + 1} audio`}
                  type="url"
                  value={input.audioUrls[index]}
                  disabled={busy}
                  placeholder="https://…"
                  className="shadow-none text-xs"
                  onChange={(e) =>
                    onChange(
                      'audioUrls',
                      input.audioUrls.map((url, i) => (i === index ? e.target.value : url))
                    )
                  }
                />
              </label>
            ))}
          </div>
        </details>
      )}
      <p className={cn(MUTED, 'text-[11px]')}>
        Up to 8 images across all passages. Material is sent to AI when you generate.
      </p>
      {preparing && (
        <p role="status" className="text-xs">
          Preparing screenshots…
        </p>
      )}
    </div>
  );
}
