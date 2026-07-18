import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Eye } from 'lucide-react';
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <BlogEditorHeader
        initialData={initialData}
        lastSaved={lastSaved}
        onCancel={onCancel}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur shadow-sm">
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-6 pt-6 pb-2 border-b border-border/40 flex justify-between items-center bg-muted/20">
                  <TabsList className="grid w-[200px] grid-cols-2">
                    <TabsTrigger value="write" className="gap-2">
                      <FileText className="w-4 h-4" /> Write
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="gap-2">
                      <Eye className="w-4 h-4" /> Preview
                    </TabsTrigger>
                  </TabsList>
                  <div className="text-xs text-muted-foreground uppercase font-medium tracking-wider">
                    {formData.content?.length || 0} chars
                  </div>
                </div>

                <BlogEditorWriteTab formData={formData} setFormData={setFormData} />
                <BlogEditorPreviewTab formData={formData} />
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
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
        </div>
      </div>

      <style>{QUILL_STYLES}</style>
    </motion.div>
  );
};

export default BlogEditor;
