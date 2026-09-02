import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { uploadFile } from '@/lib/supabase';
import { normalizeBlogEditorData, createSeoCover, buildBlogPayload } from './BlogEditor.utils';

export function useBlogDraftRestore(initialData, setFormData) {
  useEffect(() => {
    if (initialData) {
      setFormData(normalizeBlogEditorData(initialData));
    } else {
      const savedDraft = localStorage.getItem('blog_draft_new');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (confirm('Found an unsaved draft. Restore it?')) {
            setFormData(normalizeBlogEditorData(draft));
          }
        } catch (e) {
          console.error('Draft parse failed', e);
        }
      }
    }
  }, [initialData, setFormData]);
}

export function useBlogAutoSave(formData, initialData, setLastSaved) {
  useEffect(() => {
    const shouldSave = !initialData && formData.title;
    if (shouldSave) {
      const timer = setTimeout(() => {
        localStorage.setItem('blog_draft_new', JSON.stringify(formData));
        setLastSaved(new Date());
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, initialData, setLastSaved]);
}

export function useBlogSlugAutoGenerate(formData, initialData, setFormData) {
  useEffect(() => {
    const shouldGenerate = !initialData && formData.title && !formData.slug;
    if (shouldGenerate) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.title, initialData, formData.slug, setFormData]);
}

export function useBlogEditorLogic(initialData, onSave) {
  const [formData, setFormData] = useState(() => normalizeBlogEditorData(initialData));
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('write');
  const [lastSaved, setLastSaved] = useState(null);

  useBlogDraftRestore(initialData, setFormData);
  useBlogAutoSave(formData, initialData, setLastSaved);
  useBlogSlugAutoGenerate(formData, initialData, setFormData);

  useEffect(() => {
    const thumbnailUrl = formData.thumbnail_url;
    return () => {
      if (thumbnailUrl?.startsWith('blob:')) URL.revokeObjectURL(thumbnailUrl);
    };
  }, [formData.thumbnail_url]);

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
    const file = e.target.files?.[0];
    if (file) {
      try {
        const optimizedFile = await createSeoCover(file);
        setThumbnailFile(optimizedFile);
        const previewUrl = URL.createObjectURL(optimizedFile);
        setFormData((prev) => ({ ...prev, thumbnail_url: previewUrl }));
        toast.success('Cover converted to WebP and watermarked');
      } catch (error) {
        toast.error(error.message || 'Could not prepare this cover image');
      }
      e.target.value = '';
    }
  };

  const validateBlogFormData = (formData) => {
    const hasRequiredText =
      formData.title && formData.slug && formData.description && formData.content;
    if (!hasRequiredText) {
      toast.error('Title, slug, summary, and content are required');
      return false;
    }
    if (formData.meta_description.length > 180) {
      toast.error('Meta description must be 180 characters or fewer');
      return false;
    }
    const hasSeoData = formData.meta_description.trim() && formData.seo_tags.length >= 3;
    if (!hasSeoData) {
      toast.error('Add a meta description and at least three SEO keywords');
      return false;
    }
    return true;
  };

  const uploadBlogThumbnail = async (thumbnailFile, currentUrl) => {
    if (!thumbnailFile) return currentUrl;
    try {
      const { file_url } = await uploadFile(thumbnailFile);
      return file_url;
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload thumbnail');
      return null;
    }
  };

  const handleSubmit = async () => {
    try {
      if (!validateBlogFormData(formData)) return;

      setSubmitting(true);
      const finalThumbnailUrl = await uploadBlogThumbnail(thumbnailFile, formData.thumbnail_url);
      if (thumbnailFile && !finalThumbnailUrl) {
        setSubmitting(false);
        return;
      }

      const payload = buildBlogPayload(formData, finalThumbnailUrl);
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

  return {
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
  };
}
