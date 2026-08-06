import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Brain,
  Plus,
  Trash2,
  Save,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ListIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import {
  NUM,
  MICRO,
  PANEL,
  AdminButton,
  STAGGER_CONTAINER,
  FADE_UP,
} from '@/components/admin/ui/primitives';

const FIELD_LABEL = cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-1.5 block');
const FIELD_INPUT =
  'h-10 rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';

const TIER_ACCENT = {
  free: 'border-stone-300 dark:border-white/20 bg-stone-100 dark:bg-white/6 text-stone-700 dark:text-stone-200',
  pro: 'border-[rgb(var(--signal-ok)/0.4)] bg-[rgb(var(--signal-ok)/0.08)] text-[rgb(var(--signal-ok))]',
  premium: 'border-indigo-400/50 bg-indigo-500/8 text-indigo-600 dark:text-indigo-400',
};

const VocabularyEditor = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    thumbnail_url: initialData?.thumbnail_url || '',
    is_published: initialData?.is_published || false,
    access_tier: initialData?.access_tier || 'free',
    content_type: 'vocabulary',
    url: initialData?.url || '#',
    slug: initialData?.slug || '',
  });

  const [words, setWords] = useState([]);
  const [bulkText, setBulkText] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData?.content) {
      try {
        const parsedContent = JSON.parse(initialData.content);
        if (Array.isArray(parsedContent)) setWords(parsedContent);
      } catch (e) {
        console.error('Failed to parse vocabulary content:', e);
        setWords([]);
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (!initialData && formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.title, initialData, formData.slug]);

  const handleAddWord = () => setWords([...words, { word: '', definition: '', example: '' }]);
  const handleRemoveWord = (index) => setWords(words.filter((_, i) => i !== index));
  const handleWordChange = (index, field, value) => {
    const newWords = [...words];
    newWords[index][field] = value;
    setWords(newWords);
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    const newWords = bulkText
      .split('\n')
      .map((line) => {
        const parts = line.split('|');
        return {
          word: parts[0]?.trim() || '',
          definition: parts[1]?.trim() || '',
          example: parts[2]?.trim() || '',
        };
      })
      .filter((w) => w.word);

    setWords([...words, ...newWords]);
    setBulkText('');
    setActiveTab('list');
    toast.success(`Imported ${newWords.length} words`);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return toast.error('Title is required');
    if (words.length === 0) return toast.error('Add at least one word to the list');

    try {
      setSubmitting(true);
      await onSave({ ...formData, content: JSON.stringify(words) });
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <m.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-12"
    >
      {/* Header */}
      <m.div
        variants={FADE_UP}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-stone-200/80 dark:border-white/[0.07]"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="h-9 w-9 grid place-items-center rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5 transition-all active:scale-90 shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-indigo-500/8 text-indigo-600 dark:text-indigo-400">
                <Brain className="w-4 h-4" />
              </div>
              {initialData ? 'Edit vocabulary list' : 'Create vocabulary list'}
            </h2>
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-0.5 ml-8')}>
              Curated word list with definitions and examples
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <AdminButton variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">
            Cancel
          </AdminButton>
          <AdminButton onClick={handleSave} loading={submitting} className="flex-1 sm:flex-none">
            <Save className="w-3.5 h-3.5" />
            {initialData ? 'Update list' : 'Save list'}
          </AdminButton>
        </div>
      </m.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Settings panel */}
        <m.div variants={FADE_UP} className="lg:col-span-1">
          <div className={cn(PANEL, 'p-4 space-y-4')}>
            <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>List settings</h3>

            <div>
              <Label className={FIELD_LABEL}>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., IELTS Academic Essentials"
                className={cn(FIELD_INPUT, 'font-bold w-full')}
              />
            </div>

            <div>
              <Label className={FIELD_LABEL}>URL slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="url-slug"
                className={cn(NUM, FIELD_INPUT, 'text-stone-500 dark:text-stone-400 w-full')}
              />
            </div>

            <div>
              <Label className={FIELD_LABEL}>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary of this vocabulary list…"
                rows={4}
                className="rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium resize-none p-2.5"
              />
            </div>

            <div>
              <Label className={FIELD_LABEL}>Access tier</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {['free', 'pro', 'premium'].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setFormData({ ...formData, access_tier: tier })}
                    className={cn(
                      MICRO,
                      'py-2 rounded-md border transition-all active:scale-95',
                      formData.access_tier === tier
                        ? TIER_ACCENT[tier]
                        : 'border-stone-200 dark:border-white/10 text-stone-500 dark:text-stone-400 hover:border-stone-300 dark:hover:border-white/20'
                    )}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-stone-50 dark:bg-white/3 border border-stone-200/70 dark:border-white/6">
              <div>
                <Label className="text-xs font-bold text-stone-900 dark:text-stone-50">
                  Published
                </Label>
                <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-0.5')}>
                  Visible to students
                </p>
              </div>
              <Switch
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
            </div>
          </div>
        </m.div>

        {/* Words panel */}
        <m.div variants={FADE_UP} className="lg:col-span-2">
          <div className={cn(PANEL, 'overflow-hidden')}>
            <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-white/4 border-b border-stone-200/80 dark:border-white/[0.07]">
              {[
                { id: 'list', label: `Word list (${words.length})`, icon: ListIcon },
                { id: 'bulk', label: 'Bulk import', icon: PlusCircle },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'relative flex-1 h-8 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98]',
                      isActive
                        ? 'text-stone-900 dark:text-stone-50'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                    )}
                  >
                    {isActive && (
                      <m.span
                        layoutId="vocabTabPill"
                        className="absolute inset-0 bg-white dark:bg-[#131315] rounded-md shadow-2xs"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <Icon className="relative w-3.5 h-3.5" />
                    <span className="relative">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-4">
              {activeTab === 'list' ? (
                <div className="space-y-2.5">
                  <AnimatePresence initial={false}>
                    {words.map((word, index) => (
                      <m.div
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        key={index}
                        className="p-3 rounded-md bg-stone-50 dark:bg-white/3 border border-stone-200/70 dark:border-white/6 group relative"
                      >
                        <button
                          onClick={() => handleRemoveWord(index)}
                          className="absolute top-2 right-2 h-6 w-6 grid place-items-center rounded-md text-stone-400 hover:text-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.08)] opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pr-8">
                          <div>
                            <Label className={cn(FIELD_LABEL, 'mb-1')}>Word / term</Label>
                            <Input
                              value={word.word}
                              onChange={(e) => handleWordChange(index, 'word', e.target.value)}
                              placeholder="Word"
                              className={cn(FIELD_INPUT, 'font-bold w-full')}
                            />
                          </div>
                          <div>
                            <Label className={cn(FIELD_LABEL, 'mb-1')}>Definition</Label>
                            <Input
                              value={word.definition}
                              onChange={(e) =>
                                handleWordChange(index, 'definition', e.target.value)
                              }
                              placeholder="Meaning…"
                              className={cn(FIELD_INPUT, 'w-full')}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className={cn(FIELD_LABEL, 'mb-1')}>Example sentence</Label>
                            <Input
                              value={word.example}
                              onChange={(e) => handleWordChange(index, 'example', e.target.value)}
                              placeholder="Sentence using the word…"
                              className={cn(FIELD_INPUT, 'w-full')}
                            />
                          </div>
                        </div>
                      </m.div>
                    ))}
                  </AnimatePresence>

                  <button
                    onClick={handleAddWord}
                    className={cn(
                      MICRO,
                      'w-full h-11 rounded-md border-2 border-dashed border-stone-200 dark:border-white/10 text-stone-500 dark:text-stone-400 hover:border-indigo-400/50 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/4 transition-all active:scale-[0.99] flex items-center justify-center gap-1.5'
                    )}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add individual word
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 p-3 rounded-md border border-[rgb(var(--signal-warn)/0.3)] bg-[rgb(var(--signal-warn)/0.06)]">
                    <AlertTriangle className="w-4 h-4 text-[rgb(var(--signal-warn))] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-extrabold text-stone-900 dark:text-stone-50">
                        Bulk import format
                      </p>
                      <p className="text-[11px] text-stone-600 dark:text-stone-300 font-medium mt-0.5 leading-relaxed">
                        One line per word:{' '}
                        <span className={cn(NUM, 'font-bold')}>Word | Definition | Example</span>.
                        30–100+ words can be pasted at once.
                      </p>
                    </div>
                  </div>

                  <Textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={`vantage | a place or position affording a good view of something. | from my vantage point I could see the city\nresilient | able to withstand or recover quickly from difficult conditions. | many cities are resilient to natural disasters`}
                    rows={12}
                    className={cn(
                      NUM,
                      'rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs leading-relaxed p-3'
                    )}
                  />

                  <AdminButton
                    onClick={handleBulkImport}
                    disabled={!bulkText.trim()}
                    className="w-full justify-center"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Import these words
                  </AdminButton>
                </div>
              )}
            </div>
          </div>
        </m.div>
      </div>
    </m.div>
  );
};

export default VocabularyEditor;
