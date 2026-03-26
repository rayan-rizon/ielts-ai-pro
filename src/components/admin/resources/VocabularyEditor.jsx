import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Brain,
  Plus,
  Trash2,
  Save,
  X,
  PlusCircle,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ListIcon,
} from 'lucide-react';
import { toast } from 'sonner';

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
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'bulk'
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData?.content) {
      try {
        const parsedContent = JSON.parse(initialData.content);
        if (Array.isArray(parsedContent)) {
          setWords(parsedContent);
        }
      } catch (e) {
        console.error('Failed to parse vocabulary content:', e);
        setWords([]);
      }
    }
  }, [initialData]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!initialData && formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.title, initialData, formData.slug]);

  const handleAddWord = () => {
    setWords([...words, { word: '', definition: '', example: '' }]);
  };

  const handleRemoveWord = (index) => {
    setWords(words.filter((_, i) => i !== index));
  };

  const handleWordChange = (index, field, value) => {
    const newWords = [...words];
    newWords[index][field] = value;
    setWords(newWords);
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n');
    const newWords = lines
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
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (words.length === 0) {
      toast.error('Add at least one word to the list');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        ...formData,
        content: JSON.stringify(words),
      });
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 pb-12"
      data-oid="yw4r66."
    >
      {/* Header */}
      <div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/50 pb-6"
        data-oid="zx:7ao8"
      >
        <div className="flex items-center gap-4" data-oid="lrk12ag">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="rounded-xl h-12 w-12"
            data-oid="lrw_z6l"
          >
            <ChevronLeft className="w-6 h-6" data-oid="oeutisj" />
          </Button>
          <div className="space-y-1" data-oid="hii7i7z">
            <h2
              className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3"
              data-oid="awexs6y"
            >
              <div
                className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500 shadow-sm border border-indigo-500/20"
                data-oid="hs526mt"
              >
                <Brain className="w-6 h-6" data-oid="s1bwyuv" />
              </div>
              {initialData ? 'Edit Vocabulary List' : 'Create Vocabulary List'}
            </h2>
            <p className="text-muted-foreground font-medium ml-1" data-oid=":9:xbfp">
              Design a curated vocabulary list with definitions and examples
            </p>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto" data-oid="g81nqqp">
          <Button
            variant="outline"
            onClick={onCancel}
            className="h-12 px-6 rounded-xl border-border/50 font-bold flex-1 md:flex-none"
            data-oid="2wvccbw"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={submitting}
            className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 rounded-xl font-bold gap-2 flex-1 md:flex-none"
            data-oid="pi5r_dk"
          >
            {submitting ? (
              <span className="flex items-center gap-2" data-oid="i_ul9sv">
                <span
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  data-oid="8xvyx2q"
                />
                Saving...
              </span>
            ) : (
              <>
                <Save className="w-5 h-5" data-oid="dpasqj8" />
                Save List
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" data-oid="_acc3ii">
        {/* Settings Panel */}
        <div className="space-y-6 lg:col-span-1" data-oid="21_ect5">
          <div
            className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-3xl p-6 space-y-5"
            data-oid="-:-g8n-"
          >
            <h3 className="text-lg font-bold flex items-center gap-2 mb-2" data-oid="g8hp26y">
              <FileText className="w-5 h-5 text-primary" data-oid="5e2aj8i" />
              List Settings
            </h3>

            <div className="space-y-2" data-oid="9xg:mjw">
              <Label
                className="text-sm font-bold ml-1 uppercase tracking-wider opacity-70"
                data-oid="ikrnihp"
              >
                List Title
              </Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., IELTS Academic Essentials"
                className="h-11 bg-muted/30 border-border/50 rounded-xl focus-visible:ring-primary/20 font-bold"
                data-oid="6drr16w"
              />
            </div>

            <div className="space-y-2" data-oid="e2nt1w.">
              <Label
                className="text-[10px] font-black uppercase text-muted-foreground ml-1"
                data-oid="lcgkrd4"
              >
                URL Slug
              </Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="url-slug"
                className="h-10 bg-muted/20 border-border/50 rounded-xl font-mono text-xs text-muted-foreground"
                data-oid="bqriqs0"
              />
            </div>

            <div className="space-y-2" data-oid="wbe2z_1">
              <Label
                className="text-sm font-bold ml-1 uppercase tracking-wider opacity-70"
                data-oid="psh1hy-"
              >
                Description
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary of this vocabulary list..."
                className="min-h-[100px] bg-muted/30 border-border/50 rounded-xl resize-none focus-visible:ring-primary/20"
                data-oid="dlennz_"
              />
            </div>

            <div className="space-y-2" data-oid="1b6fd:_">
              <Label
                className="text-sm font-bold ml-1 uppercase tracking-wider opacity-70"
                data-oid="e202jy1"
              >
                Access Tier
              </Label>
              <div className="grid grid-cols-3 gap-2" data-oid="zvi542p">
                {['free', 'pro', 'premium'].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setFormData({ ...formData, access_tier: tier })}
                    className={`py-2 px-3 rounded-xl border-2 transition-all duration-200 text-[10px] font-black uppercase tracking-widest ${
                      formData.access_tier === tier
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500'
                        : 'border-border/50 hover:border-border text-muted-foreground'
                    }`}
                    data-oid="vb.-2az"
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50"
              data-oid="6qvgo3c"
            >
              <div className="space-y-0.5" data-oid="px8ml-h">
                <Label className="text-sm font-bold" data-oid="26u9jje">
                  Published
                </Label>
                <p className="text-[10px] text-muted-foreground" data-oid="z72bput">
                  Visible to students
                </p>
              </div>
              <Switch
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                data-oid="gd4:spb"
              />
            </div>
          </div>
        </div>

        {/* Words Panel */}
        <div className="lg:col-span-2 space-y-6" data-oid="w1bj_-e">
          <div
            className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-3xl overflow-hidden"
            data-oid="_c7-adf"
          >
            <div className="flex items-center border-b border-border/50" data-oid="hrlewl.">
              <button
                onClick={() => setActiveTab('list')}
                className={`flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'list' ? 'bg-indigo-500/5 text-indigo-500 border-b-2 border-indigo-500' : 'text-muted-foreground hover:bg-muted/30'}`}
                data-oid="2gu41bv"
              >
                <ListIcon className="w-4 h-4" data-oid="h9xex5f" />
                Word List ({words.length})
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'bulk' ? 'bg-indigo-500/5 text-indigo-500 border-b-2 border-indigo-500' : 'text-muted-foreground hover:bg-muted/30'}`}
                data-oid="g_9w.na"
              >
                <PlusCircle className="w-4 h-4" data-oid="_eq:-ut" />
                Bulk Import
              </button>
            </div>

            <div className="p-6" data-oid="pwy9315">
              {activeTab === 'list' ? (
                <div className="space-y-4" data-oid="3351h21">
                  {words.map((word, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={index}
                      className="p-4 rounded-2xl bg-muted/20 border border-border/50 group relative"
                      data-oid="pce_zt6"
                    >
                      <button
                        onClick={() => handleRemoveWord(index)}
                        className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110 active:scale-95 z-10"
                        data-oid="_gmr8f:"
                      >
                        <Trash2 className="w-4 h-4" data-oid="f.l_g0y" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-oid="wx74.lv">
                        <div className="space-y-1.5" data-oid="eezmefo">
                          <Label
                            className="text-[10px] font-black uppercase text-muted-foreground ml-1"
                            data-oid="smjogm7"
                          >
                            Word / Term
                          </Label>
                          <Input
                            value={word.word}
                            onChange={(e) => handleWordChange(index, 'word', e.target.value)}
                            placeholder="Word"
                            className="bg-background/50 border-border/50 rounded-xl font-bold"
                            data-oid=".jvy39s"
                          />
                        </div>
                        <div className="space-y-1.5 md:col-span-1" data-oid="mk::t_t">
                          <Label
                            className="text-[10px] font-black uppercase text-muted-foreground ml-1"
                            data-oid=".lt5ucm"
                          >
                            Definition
                          </Label>
                          <Input
                            value={word.definition}
                            onChange={(e) => handleWordChange(index, 'definition', e.target.value)}
                            placeholder="Meaning..."
                            className="bg-background/50 border-border/50 rounded-xl"
                            data-oid="ekt501g"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1.5" data-oid="k58s:-a">
                          <Label
                            className="text-[10px] font-black uppercase text-muted-foreground ml-1"
                            data-oid="z9hdaah"
                          >
                            Example Sentence
                          </Label>
                          <Input
                            value={word.example}
                            onChange={(e) => handleWordChange(index, 'example', e.target.value)}
                            placeholder="Sentence using the word..."
                            className="bg-background/50 border-border/50 rounded-xl"
                            data-oid="i0a8jw:"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <Button
                    variant="outline"
                    onClick={handleAddWord}
                    className="w-full h-14 rounded-2xl border-dashed border-2 hover:border-indigo-500/50 hover:bg-indigo-500/5 font-bold gap-2 transition-all mt-4"
                    data-oid="7.:qd6p"
                  >
                    <Plus className="w-5 h-5" data-oid=".7un0xe" />
                    Add Individual Word
                  </Button>
                </div>
              ) : (
                <div className="space-y-6" data-oid="0p47cw3">
                  <div
                    className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3"
                    data-oid="r-78rgm"
                  >
                    <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" data-oid="c5conmc" />
                    <div className="space-y-1" data-oid="t3x:frk">
                      <p
                        className="text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-tight"
                        data-oid="0des8z2"
                      >
                        Bulk Import Instructions
                      </p>
                      <p
                        className="text-xs text-amber-600/80 dark:text-amber-500/80 font-medium leading-relaxed"
                        data-oid="y5_0w1a"
                      >
                        Paste words below. Format:{' '}
                        <b data-oid="zf_t3a9">Word | Definition | Example</b>. Use one line per
                        word. Total 30-100+ words can be pasted at once.
                      </p>
                    </div>
                  </div>

                  <Textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={`vantage | a place or position affording a good view of something. | from my vantage point I could see the city\nresilient | able to withstand or recover quickly from difficult conditions. | many cities are resilient to natural disasters`}
                    className="min-h-[300px] bg-muted/30 border-border/50 rounded-2xl font-mono text-xs leading-relaxed focus-visible:ring-indigo-500/20 p-6 scrollbar-thin shadow-inner"
                    data-oid="o9o9frw"
                  />

                  <Button
                    onClick={handleBulkImport}
                    disabled={!bulkText.trim()}
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 rounded-xl font-bold gap-2"
                    data-oid="qd9p8nt"
                  >
                    <CheckCircle2 className="w-5 h-5" data-oid="6yq54bx" />
                    Import These Words
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VocabularyEditor;
