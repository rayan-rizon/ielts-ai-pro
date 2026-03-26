import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  X,
  Save,
  Image as ImageIcon,
  Globe,
  Tag,
  Eye,
  ArrowLeft,
  LayoutTemplate,
  Upload,
  Loader2,
  FileText,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { uploadFile } from '@/lib/supabase';
import DOMPurify from 'dompurify';

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
    ['link', 'image'],
    ['clean'],
  ],
};

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'blockquote',
  'list',
  'bullet',
  'indent',
  'link',
  'image',
];

const BlogEditor = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    thumbnail_url: '',
    is_published: false,
    seo_tags: [],
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('write');
  const [lastSaved, setLastSaved] = useState(null);

  // Load initial data or draft
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        slug: initialData.slug || '',
        description: initialData.description || '',
        content: initialData.content || '',
        thumbnail_url: initialData.thumbnail_url || '',
        is_published: initialData.is_published || false,
        seo_tags: initialData.seo_tags || [],
      });
    } else {
      const savedDraft = localStorage.getItem('blog_draft_new');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (confirm('Found an unsaved draft. Restore it?')) {
            setFormData(draft);
          }
        } catch (e) {
          console.error('Draft parse failed', e);
        }
      }
    }
  }, [initialData]);

  // Auto-save
  useEffect(() => {
    if (!initialData && formData.title) {
      const timer = setTimeout(() => {
        localStorage.setItem('blog_draft_new', JSON.stringify(formData));
        setLastSaved(new Date());
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, initialData]);

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

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.seo_tags.includes(tagInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          seo_tags: [...prev.seo_tags, tagInput.trim()],
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      seo_tags: prev.seo_tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, thumbnail_url: previewUrl }));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.title || !formData.content) {
        toast.error('Title and content are required');
        return;
      }

      setSubmitting(true);
      let finalThumbnailUrl = formData.thumbnail_url;

      if (thumbnailFile) {
        try {
          const { file_url } = await uploadFile(thumbnailFile);
          finalThumbnailUrl = file_url;
        } catch (error) {
          console.error('Upload failed:', error);
          toast.error('Failed to upload thumbnail');
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        ...formData,
        content_type: 'blog',
        url: formData.slug ? `${window.location.origin}/blog/${formData.slug}` : '',
        thumbnail_url: finalThumbnailUrl,
      };

      await onSave(payload);

      if (!initialData) {
        localStorage.removeItem('blog_draft_new');
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save blog post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
      data-oid="1wfz11b"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-md py-4 border-b border-border/40 -mx-6 px-6"
        data-oid="6cllqik"
      >
        <div className="flex items-center gap-4" data-oid="79q_w16">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="rounded-full"
            data-oid="o8hi:b-"
          >
            <ArrowLeft className="w-5 h-5" data-oid="9zd-31p" />
          </Button>
          <div data-oid="suqdym7">
            <h2
              className="text-2xl font-bold tracking-tight flex items-center gap-2"
              data-oid="gq4iscg"
            >
              {initialData ? 'Edit Blog Post' : 'Create Post'}
              {lastSaved && !initialData && (
                <span
                  className="text-xs font-normal text-muted-foreground ml-2 flex items-center animate-pulse"
                  data-oid="q6.5qex"
                >
                  <Save className="w-3 h-3 mr-1" data-oid="0jk_r30" /> Autosaved{' '}
                  {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </h2>
          </div>
        </div>
        <div className="flex gap-3" data-oid="_g.zbj_">
          <Button variant="outline" onClick={onCancel} data-oid="-25q0w:">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="min-w-[140px] font-bold shadow-lg shadow-primary/20"
            data-oid="z817too"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" data-oid="ye8ppm." /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" data-oid="ixvr5i-" />
                {initialData ? 'Update Post' : 'Publish Post'}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-oid="dguysi6">
        {/* Main Editor Column */}
        <div className="lg:col-span-2 space-y-6" data-oid="c-1kw6l">
          <Card className="border-border/50 bg-card/50 backdrop-blur shadow-sm" data-oid="4hu:i3o">
            <CardContent className="p-0" data-oid="g.id_5.">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
                data-oid="pqlva2_"
              >
                <div
                  className="px-6 pt-6 pb-2 border-b border-border/40 flex justify-between items-center bg-muted/20"
                  data-oid="hb8g3_n"
                >
                  <TabsList className="grid w-[200px] grid-cols-2" data-oid="4tamx3g">
                    <TabsTrigger value="write" className="gap-2" data-oid="ttqgiyn">
                      <FileText className="w-4 h-4" data-oid="228u41q" /> Write
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="gap-2" data-oid="5bm79wx">
                      <Eye className="w-4 h-4" data-oid="wqz9nwv" /> Preview
                    </TabsTrigger>
                  </TabsList>
                  <div
                    className="text-xs text-muted-foreground uppercase font-medium tracking-wider"
                    data-oid="b-fc22i"
                  >
                    {formData.content.length} chars
                  </div>
                </div>

                <TabsContent value="write" className="p-6 space-y-6 mt-0" data-oid="uv2se:p">
                  <div className="space-y-2" data-oid="s8pdvvk">
                    <Label
                      className="uppercase text-xs font-bold text-muted-foreground"
                      data-oid="4jtxli_"
                    >
                      Title
                    </Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter an engaging title..."
                      className="text-lg font-bold h-14 bg-background border-border/60"
                      data-oid="vcup1ya"
                    />
                  </div>

                  <div className="space-y-2" data-oid="ey:1baa">
                    <Label
                      className="uppercase text-xs font-bold text-muted-foreground"
                      data-oid="1vq3how"
                    >
                      URL Slug
                    </Label>
                    <div className="relative" data-oid="x:aqikj">
                      <Globe
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10"
                        data-oid="15177f5"
                      />

                      <Input
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="pl-9 font-mono text-sm text-muted-foreground bg-muted/20"
                        placeholder="url-slug-example"
                        data-oid="z_9kwxj"
                      />
                    </div>
                  </div>

                  <div className="space-y-2" data-oid="plv8pnv">
                    <div
                      className="prose-editor-wrapper bg-background rounded-xl border border-border/60 overflow-hidden min-h-[500px] shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all"
                      data-oid="-81r__-"
                    >
                      <ReactQuill
                        theme="snow"
                        value={formData.content}
                        onChange={(content) => setFormData({ ...formData, content })}
                        modules={modules}
                        formats={formats}
                        className="h-[450px]"
                        placeholder="Start writing your amazing story..."
                        data-oid="4v57byo"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent
                  value="preview"
                  className="p-8 mt-0 bg-white dark:bg-slate-950 min-h-[600px] rounded-b-xl"
                  data-oid="cwgld_7"
                >
                  <article
                    className="prose dark:prose-invert max-w-none lg:prose-lg mx-auto"
                    data-oid="u.q4dcd"
                  >
                    <h1
                      className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6"
                      data-oid="-iw07h2"
                    >
                      {formData.title || (
                        <span className="text-muted-foreground opacity-50" data-oid="._hvhp:">
                          Untitled Post
                        </span>
                      )}
                    </h1>
                    {formData.thumbnail_url && (
                      <div
                        className="w-full aspect-video rounded-xl overflow-hidden mb-8 border border-border/20 shadow-sm"
                        data-oid="al.kbld"
                      >
                        <img
                          src={formData.thumbnail_url}
                          alt="Cover"
                          className="w-full h-full object-cover"
                          data-oid="yhq-nas"
                        />
                      </div>
                    )}
                    <div
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(
                          formData.content ||
                            '<p class="text-muted-foreground text-center italic">No content yet...</p>'
                        ),
                      }}
                      data-oid="ru-kvbh"
                    />
                  </article>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6" data-oid="uiskss2">
          {/* Publish Status */}
          <Card
            className="border-border/50 bg-card/50 backdrop-blur shadow-sm overflow-hidden"
            data-oid="7o:jttu"
          >
            <div
              className="h-1 w-full bg-gradient-to-r from-blue-500 to-purple-500"
              data-oid="_fz.stq"
            />

            <CardContent className="p-6" data-oid="4wd:_dr">
              <div className="flex items-center justify-between mb-4" data-oid="g.qb_n7">
                <div className="space-y-0.5" data-oid=".zlfvje">
                  <h3 className="font-semibold text-sm" data-oid="dti:prz">
                    Publishing
                  </h3>
                  <p className="text-xs text-muted-foreground" data-oid="83.xjmw">
                    Current status
                  </p>
                </div>
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  data-oid="404ynlg"
                />
              </div>
              <div
                className={`p-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-colors ${
                  formData.is_published
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400'
                }`}
                data-oid="u-5wxpa"
              >
                {formData.is_published ? (
                  <>
                    <Eye className="w-4 h-4" data-oid=".bfcf9-" /> Posted Live
                  </>
                ) : (
                  <>
                    <LayoutTemplate className="w-4 h-4" data-oid="cask-cv" /> Draft Mode
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Thumbnail */}
          <Card className="border-border/50 bg-card/50 backdrop-blur shadow-sm" data-oid="5sol8ku">
            <CardContent className="p-6 space-y-4" data-oid="ay4zqu-">
              <Label
                className="uppercase text-xs font-bold text-muted-foreground flex items-center gap-2"
                data-oid="z84t43x"
              >
                <ImageIcon className="w-3 h-3" data-oid="x77gvk5" /> Featured Image
              </Label>
              <div
                className="group relative aspect-video bg-muted/40 rounded-xl overflow-hidden border-2 border-dashed border-border/60 hover:border-primary/50 transition-all duration-300"
                data-oid="4dssur-"
              >
                {formData.thumbnail_url ? (
                  <>
                    <img
                      src={formData.thumbnail_url}
                      alt="Thumbnail"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      data-oid="5l9a2hw"
                    />

                    <div
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]"
                      data-oid="wvnebpm"
                    >
                      <label
                        className="cursor-pointer px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-white text-xs font-bold transition-colors shadow-lg border border-white/20"
                        data-oid="k37azd9"
                      >
                        Replace Image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleThumbnailUpload}
                          data-oid="6xsgjwm"
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <label
                    className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/60 transition-colors"
                    data-oid="bs6q-is"
                  >
                    <div
                      className="p-3 bg-background rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform duration-300"
                      data-oid="i5jv3e5"
                    >
                      <Upload className="w-5 h-5 text-muted-foreground" data-oid="wm-hr7s" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium" data-oid="lqk55nr">
                      Click to upload cover
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleThumbnailUpload}
                      data-oid="fpaldgp"
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card className="border-border/50 bg-card/50 backdrop-blur shadow-sm" data-oid="lnch:b_">
            <CardContent className="p-6 space-y-4" data-oid="593biyx">
              <div className="space-y-2" data-oid="lx:4vvd">
                <Label
                  className="uppercase text-xs font-bold text-muted-foreground"
                  data-oid="g5fwul6"
                >
                  Meta Description
                </Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="flex w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px] resize-none"
                  placeholder="Summarize your post for search engines and social media previews..."
                  data-oid="u7-lgt."
                />
              </div>

              <div className="space-y-3" data-oid=":lohmvx">
                <Label
                  className="uppercase text-xs font-bold text-muted-foreground flex items-center justify-between"
                  data-oid="z2zf:9:"
                >
                  <span data-oid="gjf:226">Keywords</span>
                  <span className="text-[10px] font-normal opacity-70" data-oid="mpbe2na">
                    {formData.seo_tags.length} tags
                  </span>
                </Label>

                <div className="relative" data-oid=":xkmmck">
                  <Tag
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                    data-oid="oe3jo-z"
                  />

                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Add tag and press Enter"
                    className="pl-9 h-10 text-sm rounded-xl bg-background/50"
                    data-oid="po4hebk"
                  />
                </div>

                <div className="flex flex-wrap gap-2 min-h-[2rem]" data-oid="jtqlyjx">
                  {formData.seo_tags.length === 0 && (
                    <span className="text-xs text-muted-foreground italic" data-oid="s2re6kj">
                      No tags added yet
                    </span>
                  )}
                  {formData.seo_tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 pl-2 pr-1 py-1 text-[11px] hover:bg-secondary/80 transition-colors"
                      data-oid="4h8pjg6"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive p-0.5 rounded-full hover:bg-destructive/10 transition-colors"
                        data-oid="cvcq6:n"
                      >
                        <X className="w-3 h-3" data-oid="x59zavc" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style data-oid="na1s:u1">{`
        .ql-toolbar {
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          border-color: rgba(var(--border), 0.5) !important;
          background-color: hsl(var(--muted) / 0.3);
          padding: 12px !important;
        }
        .ql-container {
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          border-color: rgba(var(--border), 0.5) !important;
          background-color: hsl(var(--background));
          font-family: inherit;
          font-size: 1.1rem;
        }
        .ql-editor {
          min-height: 400px;
          padding: 24px;
          line-height: 1.8;
        }
        .ql-editor h1,
        .ql-editor h2,
        .ql-editor h3 {
          font-weight: 700;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .ql-editor p {
          margin-bottom: 1em;
        }
      `}</style>
    </motion.div>
  );
};

export default BlogEditor;
