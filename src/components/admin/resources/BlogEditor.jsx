import { m } from 'framer-motion';
import { Tabs } from '@/components/ui/tabs';
import { FileText, Eye } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM, MICRO, PANEL, STAGGER_CONTAINER, FADE_UP } from '@/components/admin/ui/primitives';
import { QUILL_STYLES } from './BlogEditor.utils';
import { useBlogEditorLogic } from './BlogEditor.hooks';
import {
  BlogEditorHeader,
  BlogEditorWriteTab,
  BlogEditorPreviewTab,
  BlogEditorThumbnail,
  BlogEditorSeoSettings,
  BlogEditorPublishCard,
} from './BlogEditor.components';

const EDITOR_TABS = [
  { id: 'write', label: 'Write', icon: FileText },
  { id: 'preview', label: 'Preview', icon: Eye },
];

const BlogEditor = ({ initialData, onSave, onCancel }) => {
  const {
    formData,
    setFormData,
    tagInput,
    setTagInput,
    submitting,
    activeTab,
    setActiveTab,
    lastSaved,
    handleAddTag,
    removeTag,
    handleThumbnailUpload,
    handleSubmit,
  } = useBlogEditorLogic(initialData, onSave);

  return (
    <m.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-12"
    >
      <m.div variants={FADE_UP}>
        <BlogEditorHeader
          initialData={initialData}
          lastSaved={lastSaved}
          onCancel={onCancel}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </m.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <m.div variants={FADE_UP} className="lg:col-span-2">
          <div className={cn(PANEL, 'overflow-hidden')}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-4 pt-3 pb-2 border-b border-stone-200/80 dark:border-white/[0.07] flex justify-between items-center bg-stone-50/60 dark:bg-white/2">
                <div className="relative flex items-center gap-1 p-1 bg-stone-100 dark:bg-white/4 rounded-lg border border-stone-200/80 dark:border-white/[0.07]">
                  {EDITOR_TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'relative h-7 px-3 rounded-md font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95',
                          isActive
                            ? 'text-stone-900 dark:text-stone-50'
                            : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                        )}
                      >
                        {isActive && (
                          <m.span
                            layoutId="blogEditorTabPill"
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
                <span className={cn(NUM, MICRO, 'text-stone-400')}>
                  {formData.content?.length || 0} chars
                </span>
              </div>

              <BlogEditorWriteTab formData={formData} setFormData={setFormData} />
              <BlogEditorPreviewTab formData={formData} />
            </Tabs>
          </div>
        </m.div>

        <m.div variants={FADE_UP} className="space-y-4">
          <BlogEditorPublishCard formData={formData} setFormData={setFormData} />
          <BlogEditorThumbnail formData={formData} onThumbnailUpload={handleThumbnailUpload} />
          <BlogEditorSeoSettings
            formData={formData}
            setFormData={setFormData}
            tagInput={tagInput}
            setTagInput={setTagInput}
            onAddTag={handleAddTag}
            onRemoveTag={removeTag}
          />
        </m.div>
      </div>

      <style>{QUILL_STYLES}</style>
    </m.div>
  );
};

export default BlogEditor;
