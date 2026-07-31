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
  ChevronLeft,
  LayoutTemplate,
  Upload,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { TabsContent } from '@/components/ui/tabs';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/cn';
import {
  NUM,
  MICRO,
  PANEL,
  AdminButton,
  PILL_BASE,
  pillTone,
} from '@/components/admin/ui/primitives';
import { modules, formats } from './BlogEditor.utils';

const FIELD_LABEL = cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-1.5 block');
const FIELD_INPUT =
  'rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';

export function BlogEditorHeader({ initialData, lastSaved, onCancel, onSubmit, submitting }) {
  return (
    <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-200/80 dark:border-white/[0.07]">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onCancel}
          className="h-9 w-9 grid place-items-center rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5 transition-all active:scale-90 shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 truncate">
            {initialData ? 'Edit blog post' : 'Create post'}
          </h2>
          {lastSaved && !initialData && (
            <p
              className={cn(
                MICRO,
                'text-stone-500 dark:text-stone-400 mt-0.5 flex items-center gap-1'
              )}
            >
              <Save className="w-2.5 h-2.5" />
              Autosaved {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <AdminButton variant="outline" onClick={onCancel}>
          Cancel
        </AdminButton>
        <AdminButton
          onClick={onSubmit}
          loading={submitting}
          className="min-w-[130px] justify-center"
        >
          <Save className="w-3.5 h-3.5" />
          {initialData ? 'Update post' : 'Publish post'}
        </AdminButton>
      </div>
    </div>
  );
}

export function BlogEditorWriteTab({ formData, setFormData }) {
  return (
    <TabsContent value="write" className="p-4 space-y-4 mt-0">
      <div>
        <Label className={FIELD_LABEL}>Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter an engaging title…"
          className={cn(FIELD_INPUT, 'h-11 text-base font-bold w-full')}
        />
      </div>

      <div>
        <Label className={FIELD_LABEL}>URL slug</Label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <Input
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className={cn(NUM, FIELD_INPUT, 'h-9 pl-8 text-stone-500 dark:text-stone-400 w-full')}
            placeholder="url-slug-example"
          />
        </div>
      </div>

      <div>
        <Label className={FIELD_LABEL}>Article summary</Label>
        <textarea
          value={formData.description}
          onChange={(event) => setFormData({ ...formData, description: event.target.value })}
          rows={3}
          className={cn(
            FIELD_INPUT,
            'flex w-full resize-none rounded-md px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400'
          )}
          placeholder="A concise reader-facing summary for the blog index."
        />
      </div>

      <div>
        <Label className={FIELD_LABEL}>Content</Label>
        <div className="rounded-md border border-stone-300 dark:border-white/15 overflow-hidden bg-white dark:bg-[#131315]">
          <ReactQuill
            theme="snow"
            value={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
            modules={modules}
            formats={formats}
            className="h-[420px]"
            placeholder="Start writing your amazing story…"
          />
        </div>
      </div>
    </TabsContent>
  );
}

export function BlogEditorPreviewTab({ formData }) {
  return (
    <TabsContent value="preview" className="p-6 mt-0 bg-white dark:bg-[#131315] min-h-[520px]">
      <article className="prose dark:prose-invert max-w-none mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight mb-4">
          {formData.title || <span className="text-stone-400 opacity-60">Untitled post</span>}
        </h1>
        {formData.thumbnail_url && (
          <div className="w-full aspect-video rounded-md overflow-hidden mb-6 border border-stone-200 dark:border-white/10">
            <img src={formData.thumbnail_url} alt="Cover" className="w-full h-full object-cover" />
          </div>
        )}
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              formData.content || '<p class="text-stone-400 text-center italic">No content yet…</p>'
            ),
          }}
        />
      </article>
    </TabsContent>
  );
}

export function BlogEditorThumbnail({ formData, onThumbnailUpload }) {
  return (
    <div className={cn(PANEL, 'p-4 space-y-3')}>
      <Label className={cn(FIELD_LABEL, 'mb-0 flex items-center gap-1.5')}>
        <ImageIcon className="w-3 h-3" /> Featured image
      </Label>
      <div className="group relative aspect-video bg-stone-50 dark:bg-white/[0.03] rounded-md overflow-hidden border-2 border-dashed border-stone-200 dark:border-white/10 hover:border-indigo-400/50 transition-colors">
        {formData.thumbnail_url ? (
          <>
            <img
              src={formData.thumbnail_url}
              alt="Thumbnail"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label
                className={cn(
                  MICRO,
                  'cursor-pointer px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-md text-white transition-colors border border-white/20'
                )}
              >
                Replace image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onThumbnailUpload}
                />
              </label>
            </div>
          </>
        ) : (
          <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-100/60 dark:hover:bg-white/[0.03] transition-colors">
            <div className="p-2.5 bg-white dark:bg-[#131315] rounded-full border border-stone-200 dark:border-white/10 mb-2 group-hover:scale-110 transition-transform">
              <Upload className="w-4 h-4 text-stone-500 dark:text-stone-400" />
            </div>
            <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
              Click to upload cover
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={onThumbnailUpload} />
          </label>
        )}
      </div>
      <p className="text-[11px] leading-5 text-stone-500 dark:text-stone-400">
        Uploaded images are resized, converted to WebP, and watermarked with "IELTS Ai Pro" before
        upload.
      </p>
    </div>
  );
}

export function BlogEditorSeoSettings({
  formData,
  setFormData,
  tagInput,
  setTagInput,
  onAddTag,
  onRemoveTag,
}) {
  return (
    <div className={cn(PANEL, 'p-4 space-y-4')}>
      <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>SEO settings</h3>

      <div>
        <Label className={FIELD_LABEL}>Meta description</Label>
        <textarea
          value={formData.meta_description}
          onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
          maxLength={180}
          rows={4}
          className={cn(
            FIELD_INPUT,
            'flex w-full resize-none rounded-md px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400'
          )}
          placeholder="Summarize your post for search engines and social previews…"
        />
        <p className={cn(NUM, 'text-right text-[10px] font-bold text-stone-400 mt-1')}>
          {formData.meta_description.length}/180
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <Label className={FIELD_LABEL}>Category</Label>
          <Input
            value={formData.category}
            onChange={(event) => setFormData({ ...formData, category: event.target.value })}
            placeholder="Writing"
            className={cn(FIELD_INPUT, 'h-9 w-full')}
          />
        </div>
        <div>
          <Label className={FIELD_LABEL}>Read time</Label>
          <Input
            type="number"
            min="1"
            max="60"
            value={formData.reading_minutes}
            onChange={(event) =>
              setFormData({ ...formData, reading_minutes: Number(event.target.value) || 1 })
            }
            className={cn(FIELD_INPUT, 'h-9 w-full')}
          />
        </div>
      </div>

      <div>
        <Label className={cn(FIELD_LABEL, 'flex items-center justify-between')}>
          <span>Keywords</span>
          <span className="normal-case font-medium text-stone-400">
            {formData.seo_tags.length} tags
          </span>
        </Label>

        <div className="relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={onAddTag}
            placeholder="Add tag and press Enter"
            className={cn(FIELD_INPUT, 'h-9 pl-8 w-full')}
          />
        </div>

        <div className="flex flex-wrap gap-1.5 min-h-[1.75rem] mt-2">
          {formData.seo_tags.length === 0 && (
            <span className="text-[11px] text-stone-400 italic">No tags added yet</span>
          )}
          {formData.seo_tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                PILL_BASE,
                pillTone('accent'),
                'normal-case pr-1 transition-transform duration-150 hover:scale-105'
              )}
            >
              {tag}
              <button
                onClick={() => onRemoveTag(tag)}
                className="ml-0.5 h-3.5 w-3.5 grid place-items-center rounded-full hover:bg-[rgb(var(--signal-fault)/0.15)] hover:text-[rgb(var(--signal-fault))] transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BlogEditorPublishCard({ formData, setFormData }) {
  return (
    <div className={cn(PANEL, 'p-4 space-y-4')}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-extrabold text-stone-900 dark:text-stone-50">Publishing</h3>
          <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-0.5')}>Current status</p>
        </div>
        <Switch
          checked={formData.is_published}
          onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
        />
      </div>

      <div
        className={cn(
          PILL_BASE,
          'w-full justify-center py-2',
          pillTone(formData.is_published ? 'ok' : 'warn')
        )}
      >
        {formData.is_published ? (
          <>
            <Eye className="w-3 h-3" /> Posted live
          </>
        ) : (
          <>
            <LayoutTemplate className="w-3 h-3" /> Draft mode
          </>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-white/[0.06]">
        <div>
          <p className="text-xs font-bold text-stone-900 dark:text-stone-50">Featured article</p>
          <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-0.5')}>
            Highlight on the blog landing page
          </p>
        </div>
        <Switch
          checked={formData.featured}
          onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
        />
      </div>
    </div>
  );
}
