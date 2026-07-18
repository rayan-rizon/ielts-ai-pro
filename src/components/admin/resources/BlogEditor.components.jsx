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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import DOMPurify from 'dompurify';
import { modules, formats } from './BlogEditor.utils';

export function BlogEditorHeader({ initialData, lastSaved, onCancel, onSubmit, submitting }) {
  return (
    <div className="flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-md py-4 border-b border-border/40 -mx-6 px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {initialData ? 'Edit Blog Post' : 'Create Post'}
            {lastSaved && !initialData && (
              <span className="text-xs font-normal text-muted-foreground ml-2 flex items-center animate-pulse">
                <Save className="w-3 h-3 mr-1" /> Autosaved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </h2>
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={submitting}
          className="min-w-[140px] font-bold shadow-lg shadow-primary/20"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {initialData ? 'Update Post' : 'Publish Post'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function BlogEditorWriteTab({ formData, setFormData }) {
  return (
    <TabsContent value="write" className="p-6 space-y-6 mt-0">
      <div className="space-y-2">
        <Label className="uppercase text-xs font-bold text-muted-foreground">Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter an engaging title..."
          className="text-lg font-bold h-14 bg-background border-border/60"
        />
      </div>

      <div className="space-y-2">
        <Label className="uppercase text-xs font-bold text-muted-foreground">URL Slug</Label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />

          <Input
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="pl-9 font-mono text-sm text-muted-foreground bg-muted/20"
            placeholder="url-slug-example"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="uppercase text-xs font-bold text-muted-foreground">Article summary</Label>
        <textarea
          value={formData.description}
          onChange={(event) => setFormData({ ...formData, description: event.target.value })}
          className="flex min-h-[96px] w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="A concise reader-facing summary for the blog index."
        />
      </div>

      <div className="space-y-2">
        <div className="prose-editor-wrapper bg-background rounded-xl border border-border/60 overflow-hidden min-h-[500px] shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <ReactQuill
            theme="snow"
            value={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
            modules={modules}
            formats={formats}
            className="h-[450px]"
            placeholder="Start writing your amazing story..."
          />
        </div>
      </div>
    </TabsContent>
  );
}

export function BlogEditorPreviewTab({ formData }) {
  return (
    <TabsContent
      value="preview"
      className="p-8 mt-0 bg-white dark:bg-slate-950 min-h-[600px] rounded-b-xl"
    >
      <article className="prose dark:prose-invert max-w-none lg:prose-lg mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
          {formData.title || (
            <span className="text-muted-foreground opacity-50">Untitled Post</span>
          )}
        </h1>
        {formData.thumbnail_url && (
          <div className="w-full aspect-video rounded-xl overflow-hidden mb-8 border border-border/20 shadow-sm">
            <img src={formData.thumbnail_url} alt="Cover" className="w-full h-full object-cover" />
          </div>
        )}
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              formData.content ||
                '<p class="text-muted-foreground text-center italic">No content yet...</p>'
            ),
          }}
        />
      </article>
    </TabsContent>
  );
}

export function BlogEditorThumbnail({ formData, onThumbnailUpload }) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur shadow-sm">
      <CardContent className="p-6 space-y-4">
        <Label className="uppercase text-xs font-bold text-muted-foreground flex items-center gap-2">
          <ImageIcon className="w-3 h-3" /> Featured Image
        </Label>
        <div className="group relative aspect-video bg-muted/40 rounded-xl overflow-hidden border-2 border-dashed border-border/60 hover:border-primary/50 transition-all duration-300">
          {formData.thumbnail_url ? (
            <>
              <img
                src={formData.thumbnail_url}
                alt="Thumbnail"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <label className="cursor-pointer px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-white text-xs font-bold transition-colors shadow-lg border border-white/20">
                  Replace Image
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
            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/60 transition-colors">
              <div className="p-3 bg-background rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                Click to upload cover
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={onThumbnailUpload} />
            </label>
          )}
        </div>
        <p className="text-[11px] leading-5 text-muted-foreground">
          Upload any image. It will be resized, converted to WebP, and marked with an “IELTS Ai Pro”
          watermark before upload.
        </p>
      </CardContent>
    </Card>
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
    <Card className="border-border/50 bg-card/50 backdrop-blur shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Label className="uppercase text-xs font-bold text-muted-foreground">
            Meta Description
          </Label>
          <textarea
            value={formData.meta_description}
            onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
            maxLength={180}
            className="flex w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px] resize-none"
            placeholder="Summarize your post for search engines and social media previews..."
          />
          <p className="text-right text-[10px] font-medium text-muted-foreground">
            {formData.meta_description.length}/180
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="uppercase text-xs font-bold text-muted-foreground">Category</Label>
            <Input
              value={formData.category}
              onChange={(event) => setFormData({ ...formData, category: event.target.value })}
              placeholder="Writing"
            />
          </div>
          <div className="space-y-2">
            <Label className="uppercase text-xs font-bold text-muted-foreground">Read time</Label>
            <Input
              type="number"
              min="1"
              max="60"
              value={formData.reading_minutes}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  reading_minutes: Number(event.target.value) || 1,
                })
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="uppercase text-xs font-bold text-muted-foreground flex items-center justify-between">
            <span>Keywords</span>
            <span className="text-[10px] font-normal opacity-70">
              {formData.seo_tags.length} tags
            </span>
          </Label>

          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={onAddTag}
              placeholder="Add tag and press Enter"
              className="pl-9 h-10 text-sm rounded-xl bg-background/50"
            />
          </div>

          <div className="flex flex-wrap gap-2 min-h-[2rem]">
            {formData.seo_tags.length === 0 && (
              <span className="text-xs text-muted-foreground italic">No tags added yet</span>
            )}
            {formData.seo_tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-1 pl-2 pr-1 py-1 text-[11px] hover:bg-secondary/80 transition-colors"
              >
                {tag}
                <button
                  onClick={() => onRemoveTag(tag)}
                  className="ml-1 hover:text-destructive p-0.5 rounded-full hover:bg-destructive/10 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BlogEditorPublishCard({ formData, setFormData }) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-purple-500" />

      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-0.5">
            <h3 className="font-semibold text-sm">Publishing</h3>
            <p className="text-xs text-muted-foreground">Current status</p>
          </div>
          <Switch
            checked={formData.is_published}
            onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
          />
        </div>
        <div
          className={`p-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-colors ${
            formData.is_published
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
              : 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400'
          }`}
        >
          {formData.is_published ? (
            <>
              <Eye className="w-4 h-4" /> Posted Live
            </>
          ) : (
            <>
              <LayoutTemplate className="w-4 h-4" /> Draft Mode
            </>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
          <div>
            <p className="text-sm font-semibold">Featured article</p>
            <p className="text-xs text-muted-foreground">Highlight on the blog landing page</p>
          </div>
          <Switch
            checked={formData.featured}
            onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
