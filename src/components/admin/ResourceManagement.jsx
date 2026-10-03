import { useLatestRequest } from '@/hooks/admin/useLatestRequest';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import RefinedDeleteModal from './shared/RefinedDeleteModal';
import {
  Plus,
  Trash2,
  Edit,
  Library,
  Link2,
  FileText,
  Video,
  BookOpen,
  Eye,
  EyeOff,
  Upload,
  AlertCircle,
  Download,
  FileJson,
  X,
  Brain,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  LayoutGrid,
  Sparkles,
  Search as SearchIcon,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Resource } from '@/entities';
import { uploadFile, uploadToR2 } from '@/lib/supabase';
import { generatePdfThumbnail } from '@/lib/pdf-thumbnail';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import {
  AdminPageHeader,
  AdminButton,
  PANEL,
  MICRO,
  NUM,
  PILL_BASE,
  STAGGER_CONTAINER,
  FADE_UP,
} from './ui/primitives';

import BlogEditor from './resources/BlogEditor';
import VocabularyEditor from './resources/VocabularyEditor';

const CONTENT_TYPES = [
  { id: 'video', label: 'Video', icon: Video, color: 'rose' },
  { id: 'pdf', label: 'PDF', icon: FileText, color: 'blue' },
  { id: 'blog', label: 'Blog', icon: BookOpen, color: 'emerald' },
  { id: 'vocabulary', label: 'Vocabulary', icon: Brain, color: 'violet' },
];

// Tailwind can't see classes built from a template string (`border-${color}-500`),
// so it purges them from the production build — the content-type selector below
// used to render completely unstyled. Static, literal classes per type instead.
const CONTENT_TYPE_STYLE = {
  video: {
    active: 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400',
    icon: 'text-rose-500 dark:text-rose-400',
    iconBg: 'bg-rose-500/10 border-rose-300/50 dark:border-rose-800/60',
    badge:
      'text-rose-600 dark:text-rose-400 border-rose-300/50 dark:border-rose-800/60 bg-rose-500/6',
  },
  pdf: {
    active: 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    icon: 'text-blue-500 dark:text-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-300/50 dark:border-blue-800/60',
    badge:
      'text-blue-600 dark:text-blue-400 border-blue-300/50 dark:border-blue-800/60 bg-blue-500/6',
  },
  blog: {
    active: 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    icon: 'text-emerald-500 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-300/50 dark:border-emerald-800/60',
    badge:
      'text-emerald-600 dark:text-emerald-400 border-emerald-300/50 dark:border-emerald-800/60 bg-emerald-500/6',
  },
  vocabulary: {
    active: 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400',
    icon: 'text-violet-500 dark:text-violet-400',
    iconBg: 'bg-violet-500/10 border-violet-300/50 dark:border-violet-800/60',
    badge:
      'text-violet-600 dark:text-violet-400 border-violet-300/50 dark:border-violet-800/60 bg-violet-500/6',
  },
};
const contentTypeStyle = (type) => CONTENT_TYPE_STYLE[type] || CONTENT_TYPE_STYLE.pdf;

const FIELD_LABEL = cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-1.5 block');
const FIELD_INPUT =
  'h-10 rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';
const TIER_ACCENT = {
  free: 'border-stone-300 dark:border-white/20 bg-stone-100 dark:bg-white/6 text-stone-700 dark:text-stone-200',
  pro: 'border-[rgb(var(--signal-ok)/0.4)] bg-[rgb(var(--signal-ok)/0.08)] text-[rgb(var(--signal-ok))]',
  premium: 'border-indigo-400/50 bg-indigo-500/8 text-indigo-600 dark:text-indigo-400',
};

const ResourceManagement = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, count: 0 });
  const [selectedIds, setSelectedIds] = useState([]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    content_type: 'video',
    thumbnail_url: '',
    is_published: false,
    access_tier: 'free',
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState(null);
  const [urlError, setUrlError] = useState('');
  const [showBlogEditor, setShowBlogEditor] = useState(false);
  const [showVocabEditor, setShowVocabEditor] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Deletion state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const [bulkActionToDelete, setBulkActionToDelete] = useState(false);

  const requestGate = useLatestRequest();

  const fetchResources = useCallback(async () => {
    const request = requestGate.start();
    try {
      setLoading(true);
      const filters = {};
      if (filterType !== 'all') filters.content_type = filterType;
      if (searchQuery.trim()) filters.searchQuery = searchQuery.trim();

      const orderBy = sortDirection === 'desc' ? `-${sortField}` : sortField;
      const result = await Resource.list(filters, orderBy, pagination.limit, pagination.page);
      if (!requestGate.isCurrent(request)) return;
      setResources(result.data);
      setPagination((prev) => ({ ...prev, count: result.count }));
    } catch (error) {
      if (!requestGate.isCurrent(request)) return;
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
    } finally {
      if (requestGate.isCurrent(request)) setLoading(false);
    }
  }, [
    filterType,
    searchQuery,
    sortField,
    sortDirection,
    pagination.page,
    pagination.limit,
    requestGate,
  ]);

  useEffect(() => {
    fetchResources();
    return requestGate.invalidate;
  }, [fetchResources, requestGate]);

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreviewUrl(null);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(thumbnailFile);
    setThumbnailPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [thumbnailFile]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      url: '',
      content_type: 'video',
      thumbnail_url: '',
      is_published: false,
      access_tier: 'free',
    });
    setThumbnailFile(null);
    setUrlError('');
    setEditingResource(null);
  };

  const openEditDialog = async (resource) => {
    const toastId = toast.loading('Loading resource details...');
    try {
      // Blog editing needs the complete SEO record, not the lightweight list row.
      const fullResource =
        resource.content_type === 'blog'
          ? await Resource.getBlogForEdit(resource.id)
          : await Resource.getById(resource.id);

      setEditingResource(fullResource);

      if (fullResource.content_type === 'blog') {
        setShowBlogEditor(true);
        toast.dismiss(toastId);
        return;
      }
      if (fullResource.content_type === 'vocabulary') {
        setShowVocabEditor(true);
        toast.dismiss(toastId);
        return;
      }

      setFormData({
        title: fullResource.title,
        description: fullResource.description || '',
        url: fullResource.url,
        content_type: fullResource.content_type,
        thumbnail_url: fullResource.thumbnail_url || '',
        is_published: fullResource.is_published,
        access_tier: fullResource.access_tier || 'free',
      });
      setIsDialogOpen(true);
      toast.dismiss(toastId);
    } catch (error) {
      console.error('Failed to load resource details:', error);
      toast.error('Failed to load full resource details', { id: toastId });
    }
  };

  const validateUrl = (url, contentType) => {
    if (!url.trim()) {
      setUrlError('URL is required');
      return false;
    }
    if (!Resource.validateUrl(url, contentType)) {
      setUrlError(`Invalid URL for ${contentType} content`);
      return false;
    }
    setUrlError('');
    return true;
  };

  const fetchVideoMetadata = async (url) => {
    if (!url) return;

    // Check if it's a supported video platform for noembed
    const isVideo = Resource.validateUrl(url, 'video');
    if (!isVideo) return;

    let fetchUrl = url;
    // Special handling for YouTube Shorts - noembed works better with standard watch URLs
    if (url.includes('youtube.com/shorts/')) {
      fetchUrl = url.replace('youtube.com/shorts/', 'youtube.com/watch?v=');
    }

    try {
      setFetchingMetadata(true);
      const response = await fetch(`https://noembed.com/embed?url=${fetchUrl}`);
      const data = await response.json();

      if (data.title) {
        // Remove " - YouTube" suffix if present
        const cleanTitle = data.title.replace(/ - YouTube$/i, '');

        setFormData((prev) => ({
          ...prev,
          title: prev.title.trim() === '' ? cleanTitle : prev.title,
          thumbnail_url: prev.thumbnail_url || data.thumbnail_url,
          description: prev.description.trim() === '' ? cleanTitle : prev.description,
        }));
        toast.success(`Details auto-filled: ${cleanTitle.substring(0, 30)}...`);
      }
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
      toast.error('Failed to auto-fetch video details');
    } finally {
      setFetchingMetadata(false);
    }
  };

  const generateAndUploadPdfThumbnail = async (file, fallbackUrl) => {
    try {
      const thumbBlob = await generatePdfThumbnail(file, 2.0);
      const thumbFile = new File([thumbBlob], `thumb_${file.name.replace('.pdf', '.jpg')}`, {
        type: 'image/jpeg',
      });
      const { file_url } = await uploadFile(thumbFile);
      return file_url;
    } catch (thumbErr) {
      console.error('Failed to generate thumbnail:', thumbErr);
      return fallbackUrl;
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a valid PDF file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    try {
      setUploadingPdf(true);
      const toastId = toast.loading('Uploading PDF and generating thumbnail...');

      const thumbUrl = await generateAndUploadPdfThumbnail(file, formData.thumbnail_url);
      const { file_url } = await uploadToR2(file);

      setFormData((prev) => ({
        ...prev,
        url: file_url,
        thumbnail_url: thumbUrl,
        title: prev.title || file.name.replace('.pdf', '').replace(/[_-]/g, ' '),
        description: prev.description || `PDF Resource: ${file.name}`,
      }));

      toast.success('PDF uploaded and thumbnail generated', { id: toastId });
    } catch (error) {
      console.error('PDF upload failed:', error);
      toast.error(error.message || 'Failed to upload PDF');
    } finally {
      setUploadingPdf(false);
      e.target.value = '';
    }
  };

  // Auto-fill video metadata when URL changes
  useEffect(() => {
    if (formData.content_type === 'video' && formData.url.length > 10) {
      const timer = setTimeout(() => {
        if (Resource.validateUrl(formData.url, 'video')) {
          fetchVideoMetadata(formData.url);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [formData.url, formData.content_type]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!validateUrl(formData.url, formData.content_type)) {
      return;
    }

    try {
      setSubmitting(true);
      let thumbnailUrl = formData.thumbnail_url;

      // Upload thumbnail if new file selected
      if (thumbnailFile) {
        const { file_url } = await uploadFile(thumbnailFile);
        thumbnailUrl = file_url;
      }

      const resourceData = {
        ...formData,
        thumbnail_url: thumbnailUrl,
      };

      if (editingResource) {
        await Resource.update(editingResource.id, resourceData);
        toast.success('Resource updated successfully');
      } else {
        await Resource.create(resourceData);
        toast.success('Resource created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchResources();
    } catch (error) {
      console.error('Error saving resource:', error);
      toast.error(error.message || 'Failed to save resource');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlogSave = async (blogData) => {
    try {
      if (editingResource) {
        await Resource.update(editingResource.id, blogData);
        toast.success('Blog post updated successfully');
      } else {
        await Resource.create(blogData);
        toast.success('Blog post published successfully');
      }
      setShowBlogEditor(false);
      setEditingResource(null);
      fetchResources();
    } catch (error) {
      console.error('Failed to save blog:', error);
      throw error;
    }
  };

  const handleVocabSave = async (vocabData) => {
    const loadingToast = toast.loading(
      editingResource ? 'Updating vocabulary list...' : 'Creating vocabulary list...'
    );
    try {
      if (editingResource) {
        await Resource.update(editingResource.id, vocabData);
        toast.success('Vocabulary list updated successfully', { id: loadingToast });
      } else {
        await Resource.create(vocabData);
        toast.success('Vocabulary list created successfully', { id: loadingToast });
      }
      setShowVocabEditor(false);
      setEditingResource(null);
      fetchResources();
    } catch (error) {
      console.error('Failed to save vocabulary:', error);
      toast.error(error.message || 'Failed to save vocabulary list', { id: loadingToast });
      throw error;
    }
  };

  const togglePublishStatus = async (resource) => {
    try {
      await Resource.update(resource.id, { is_published: !resource.is_published });
      toast.success(`Resource ${resource.is_published ? 'unpublished' : 'published'}`);
      fetchResources();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (resource) => {
    setResourceToDelete(resource);
    setBulkActionToDelete(false);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!resourceToDelete && !bulkActionToDelete) return;

    try {
      setSubmitting(true);
      if (bulkActionToDelete) {
        await Resource.bulkDelete(selectedIds);
        toast.success(`Successfully deleted ${selectedIds.length} resources`);
        setSelectedIds([]);
      } else if (resourceToDelete) {
        await Resource.delete(resourceToDelete.id);
        toast.success(`"${resourceToDelete.title}" deleted`);
      }
      fetchResources();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error.message || 'Failed to delete resource');
    } finally {
      setSubmitting(false);
      setDeleteConfirmOpen(false);
      setResourceToDelete(null);
      setBulkActionToDelete(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(resources.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const handleBulkAction = async (action) => {
    if (action === 'delete') {
      setBulkActionToDelete(true);
      setResourceToDelete(null);
      setDeleteConfirmOpen(true);
      return;
    }

    try {
      setSubmitting(true);
      if (action === 'publish') {
        await Resource.bulkUpdate(selectedIds, { is_published: true });
        toast.success('Selected resources published');
      } else if (action === 'unpublish') {
        await Resource.bulkUpdate(selectedIds, { is_published: false });
        toast.success('Selected resources unpublished');
      }
      setSelectedIds([]);
      fetchResources();
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error(`Failed to ${action} resources`);
    }
  };

  const handleExport = async () => {
    try {
      toast.info('Preparing export...');
      const resources = await Resource.exportAll();
      const dataStr = URL.createObjectURL(
        new Blob([JSON.stringify(resources, null, 2)], {
          type: 'application/json',
        })
      );
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute(
        'download',
        `resources_export_${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      setTimeout(() => URL.revokeObjectURL(dataStr), 1000);
      toast.success('Export successful');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export resources');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (!Array.isArray(importedData)) throw new Error('Invalid format: root must be an array');

        toast.info(`Importing ${importedData.length} resources...`);
        await Resource.bulkImport(importedData);

        toast.success(`Successfully imported ${importedData.length} resources`);
        fetchResources(); // Refresh list
      } catch (error) {
        console.error('Import failed:', error);
        toast.error('Import failed: ' + error.message);
      }
      // Clear input
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const stats = {
    total: pagination.count,
    published: resources.filter((r) => r.is_published).length,
    totalViews: resources.reduce((acc, r) => acc + (r.view_count || 0), 0),
  };

  const totalPages = Math.ceil(pagination.count / pagination.limit);

  const getContentTypeInfo = (type) => CONTENT_TYPES.find((t) => t.id === type) || CONTENT_TYPES[2];

  return (
    <AnimatePresence mode="wait">
      {showBlogEditor ? (
        <motion.div
          key="blog-editor"
          initial={{ opacity: 0, y: 12, filter: 'blur(2px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <BlogEditor
            initialData={editingResource}
            onSave={handleBlogSave}
            onCancel={() => {
              setShowBlogEditor(false);
              setEditingResource(null);
            }}
            data-oid="8p_2e5o"
          />
        </motion.div>
      ) : showVocabEditor ? (
        <motion.div
          key="vocab-editor"
          initial={{ opacity: 0, y: 12, filter: 'blur(2px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <VocabularyEditor
            initialData={editingResource}
            onSave={handleVocabSave}
            onCancel={() => {
              setShowVocabEditor(false);
              setEditingResource(null);
            }}
            data-oid="8:2gym2"
          />
        </motion.div>
      ) : (
        <motion.div
          key="resource-list"
          variants={STAGGER_CONTAINER}
          initial="hidden"
          animate="visible"
          exit={{
            opacity: 0,
            y: -8,
            filter: 'blur(2px)',
            transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
          }}
          className="space-y-4 pb-6 pt-12 md:pt-0"
          data-oid="7ze--xz"
        >
          {/* Top Header Section */}
          <motion.div variants={FADE_UP} data-oid="o56ihpo">
            <AdminPageHeader
              title="Resources"
              description="Manage educational video guides, PDFs, blogs, and vocabulary banks for candidates"
            >
              <DropdownMenu data-oid="actions-dropdown">
                <DropdownMenuTrigger asChild data-oid="actions-trigger">
                  <AdminButton variant="outline" data-oid="btn-more-actions">
                    <MoreVertical
                      className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400"
                      data-oid="icon-more"
                    />
                    Actions
                  </AdminButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-xl border-stone-200 dark:border-white/10 bg-white dark:bg-[#131315]"
                  data-oid="actions-content"
                >
                  <DropdownMenuItem
                    onClick={handleExport}
                    className="cursor-pointer font-medium py-2 rounded-lg text-xs"
                    data-oid="item-export"
                  >
                    <Download className="w-4 h-4 mr-2" data-oid="icon-export" />
                    Export Data
                  </DropdownMenuItem>
                  <div className="relative" data-oid="import-wrapper">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      data-oid="input-import"
                    />
                    <DropdownMenuItem
                      className="cursor-pointer font-medium py-2 rounded-lg text-xs"
                      data-oid="item-import"
                    >
                      <FileJson className="w-4 h-4 mr-2" data-oid="icon-import" />
                      Import Data
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator
                    className="bg-stone-100 dark:bg-white/6"
                    data-oid="sep-1"
                  />
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingResource(null);
                      setShowBlogEditor(true);
                    }}
                    className="cursor-pointer font-medium py-2 rounded-lg text-xs text-emerald-600 dark:text-emerald-400"
                    data-oid="item-blog"
                  >
                    <BookOpen className="w-4 h-4 mr-2" data-oid="icon-blog" />
                    Write Blog
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingResource(null);
                      setShowVocabEditor(true);
                    }}
                    className="cursor-pointer font-medium py-2 rounded-lg text-xs text-indigo-600 dark:text-indigo-400"
                    data-oid="item-vocab"
                  >
                    <Brain className="w-4 h-4 mr-2" data-oid="icon-vocab" />
                    Add Vocabulary
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) resetForm();
                }}
                data-oid="0:6qif:"
              >
                <DialogTrigger asChild data-oid="6_pg2-m">
                  <AdminButton data-oid="pow-z6t">
                    <Plus className="w-3.5 h-3.5" data-oid="_lhw9j3" />
                    Add Resource
                  </AdminButton>
                </DialogTrigger>
                <DialogContent
                  className="bg-white dark:bg-[#131315] border border-stone-200/90 dark:border-white/10 w-[95vw] max-w-lg rounded-lg overflow-hidden shadow-lg max-h-[90vh] overflow-y-auto p-4 sm:p-5"
                  data-oid="dtsedp6"
                >
                  <DialogHeader className="space-y-0.5" data-oid="9ymdqci">
                    <DialogTitle
                      className="text-base font-extrabold tracking-tight text-stone-900 dark:text-stone-50"
                      data-oid="q4ff11i"
                    >
                      {editingResource ? 'Edit resource' : 'New resource'}
                    </DialogTitle>
                    <DialogDescription className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                      Enter details to publish or update educational content
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-3" data-oid="b99_0_r">
                    {/* Content Type Selector */}
                    <div>
                      <Label className={FIELD_LABEL}>Content type</Label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {CONTENT_TYPES.map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, content_type: type.id })}
                            className={cn(
                              'p-2 rounded-md border transition-all duration-150 active:scale-95 flex flex-col items-center gap-1',
                              formData.content_type === type.id
                                ? contentTypeStyle(type.id).active
                                : 'border-stone-200 dark:border-white/10 text-stone-400 hover:border-stone-300 dark:hover:border-white/20'
                            )}
                          >
                            <type.icon className="w-3.5 h-3.5" />
                            <span className={MICRO}>{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <Label className={FIELD_LABEL}>Title *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter resource title"
                        className={cn(FIELD_INPUT, 'w-full')}
                      />
                    </div>

                    {/* URL */}
                    <div>
                      <Label className={FIELD_LABEL}>URL *</Label>
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                        <Input
                          value={formData.url}
                          onChange={(e) => {
                            const newUrl = e.target.value;
                            setFormData((prev) => ({ ...prev, url: newUrl }));
                            if (urlError) validateUrl(newUrl, formData.content_type);
                          }}
                          placeholder={
                            formData.content_type === 'video'
                              ? 'https://youtube.com/watch?v=...'
                              : formData.content_type === 'pdf'
                                ? 'https://example.com/document.pdf'
                                : 'https://blog.example.com/article'
                          }
                          className={cn(
                            FIELD_INPUT,
                            'pl-8 pr-10 w-full',
                            urlError && 'border-[rgb(var(--signal-fault))]'
                          )}
                        />
                        {formData.content_type === 'video' && formData.url.length > 10 && (
                          <button
                            type="button"
                            onClick={() => fetchVideoMetadata(formData.url)}
                            disabled={fetchingMetadata}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded-md bg-indigo-500/8 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/15 transition-all active:scale-90 disabled:opacity-50"
                            title="Fetch video details"
                          >
                            <Sparkles
                              className={cn('w-3.5 h-3.5', fetchingMetadata && 'animate-spin')}
                            />
                          </button>
                        )}
                      </div>
                      {urlError && (
                        <p className="text-[11px] text-[rgb(var(--signal-fault))] flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" /> {urlError}
                        </p>
                      )}
                    </div>

                    {/* PDF Upload Section */}
                    {formData.content_type === 'pdf' && (
                      <div>
                        <Label className={FIELD_LABEL}>Upload PDF</Label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={handlePdfUpload}
                            disabled={uploadingPdf}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                          />
                          <div
                            className={cn(
                              FIELD_INPUT,
                              'px-3 flex items-center gap-2 hover:border-stone-400 dark:hover:border-white/25 transition-colors'
                            )}
                          >
                            <FileText className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 truncate">
                              {uploadingPdf
                                ? 'Uploading PDF…'
                                : formData.url && formData.url.endsWith('.pdf')
                                  ? 'PDF uploaded successfully'
                                  : 'Choose a PDF file to upload'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <div>
                      <Label className={FIELD_LABEL}>Description</Label>
                      <Textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter brief description"
                        rows={3}
                        className="rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium resize-none p-2.5"
                      />
                    </div>

                    {/* Thumbnail Upload */}
                    <div>
                      <Label className={FIELD_LABEL}>Thumbnail image</Label>
                      <div className="flex items-center gap-2.5">
                        {(formData.thumbnail_url || thumbnailPreviewUrl) && (
                          <div className="w-12 h-12 rounded-md overflow-hidden border border-stone-200 dark:border-white/10 relative shrink-0">
                            <img
                              src={thumbnailPreviewUrl || formData.thumbnail_url}
                              alt="Thumbnail preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <label className="flex-1 h-12 border-2 border-dashed border-stone-200 dark:border-white/10 rounded-md flex items-center justify-center gap-2 cursor-pointer hover:border-indigo-400/50 hover:bg-indigo-500/4 transition-all">
                          <Upload className="w-3.5 h-3.5 text-stone-400" />
                          <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                            {thumbnailFile ? thumbnailFile.name : 'Upload image'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Access Tier Selector */}
                    <div>
                      <Label className={FIELD_LABEL}>Access tier</Label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {['free', 'pro', 'premium'].map((tier) => (
                          <button
                            key={tier}
                            type="button"
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

                    {/* Publish Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-md bg-stone-50 dark:bg-white/3 border border-stone-200/70 dark:border-white/6">
                      <div>
                        <Label className="text-xs font-bold text-stone-900 dark:text-stone-50">
                          Publish immediately
                        </Label>
                        <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-0.5')}>
                          Make visible to users on dashboard
                        </p>
                      </div>
                      <Switch
                        checked={formData.is_published}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_published: checked })
                        }
                      />
                    </div>
                  </div>

                  <DialogFooter className="gap-2 flex-col sm:flex-row" data-oid="q.ovgwu">
                    <AdminButton
                      variant="ghost"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                      data-oid="bvuumc8"
                    >
                      Cancel
                    </AdminButton>
                    <AdminButton
                      onClick={handleSubmit}
                      disabled={
                        submitting ||
                        uploadingPdf ||
                        (formData.content_type === 'video' && fetchingMetadata)
                      }
                      loading={submitting}
                      data-oid="btn-submit"
                    >
                      Save Resource
                    </AdminButton>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </AdminPageHeader>
          </motion.div>

          {/* KPI Stat Cards */}
          <motion.div
            variants={FADE_UP}
            className="grid grid-cols-3 gap-2 sm:gap-3"
            data-oid="ju0dnr8"
          >
            {[
              { label: 'Total Resources', value: stats.total, icon: Library },
              { label: 'Published', value: stats.published, icon: Sparkles },
              { label: 'Total Views', value: stats.totalViews, icon: Eye },
            ].map((item) => (
              <div key={item.label} className={cn(PANEL, 'py-2.5 px-3.5')}>
                <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-1 truncate')}>
                  {item.label}
                </p>
                <div className="flex items-end justify-between">
                  <span
                    className={cn(
                      NUM,
                      'text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-50 leading-none'
                    )}
                  >
                    {(item.value || 0).toLocaleString()}
                  </span>
                  <item.icon className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 shrink-0" />
                </div>
              </div>
            ))}
          </motion.div>

          {/* Search & Filter Toolbar */}
          <motion.div
            variants={FADE_UP}
            className={cn(
              PANEL,
              'flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-2'
            )}
            data-oid="a_eoz4w"
          >
            <div className="relative flex-1 w-full" data-oid="u9h2esc">
              <SearchIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 dark:text-stone-400"
                data-oid="aehg331"
              />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                placeholder="Search by title, description, or URL..."
                className="h-8 pl-8 border-none bg-transparent focus-visible:ring-0 text-xs font-semibold placeholder:text-stone-500 dark:text-stone-400 shadow-none w-full"
                data-oid="-7jwxl2"
              />
            </div>
            <div
              className="h-5 w-px bg-stone-200 dark:bg-white/[0.07] hidden sm:block"
              data-oid="spacer-line"
            />
            <div
              className="flex items-center gap-1 p-0.5 w-full sm:w-auto overflow-x-auto no-scrollbar shrink-0 relative"
              data-oid="r-36p1t"
            >
              {[{ id: 'all', label: 'All', icon: LayoutGrid }, ...CONTENT_TYPES].map((type) => {
                const Icon = type.icon;
                const isActive = filterType === type.id;
                return (
                  <motion.button
                    key={type.id}
                    onClick={() => {
                      setFilterType(type.id);
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className={cn(
                      'relative h-7 px-2.5 rounded-lg font-extrabold text-[11px] flex items-center gap-1.5 whitespace-nowrap border overflow-hidden',
                      isActive
                        ? 'text-white dark:text-stone-900 border-stone-800 dark:border-stone-200 shadow-2xs'
                        : 'bg-white dark:bg-[#131315] text-stone-500 dark:text-stone-400 border-stone-200/80 dark:border-white/[0.07] hover:border-stone-300 dark:hover:border-white/20'
                    )}
                    data-oid="2092.e1"
                  >
                    {isActive && (
                      <motion.span
                        layoutId="tab-active-bg"
                        className="absolute inset-0 bg-stone-900 dark:bg-stone-50 rounded-lg"
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                      />
                    )}
                    <Icon
                      className={cn(
                        'w-3 h-3 relative z-10',
                        isActive
                          ? type.id === 'all'
                            ? 'text-white dark:text-stone-900'
                            : 'text-white/90 dark:text-stone-900/80'
                          : type.color
                            ? contentTypeStyle(type.id).icon
                            : 'text-stone-500 dark:text-stone-400'
                      )}
                      data-oid={`icon-${type.id}`}
                    />
                    <span className="relative z-10">{type.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Bulk Actions Bar */}
          <AnimatePresence data-oid="wn36izy">
            {selectedIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-4 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 bg-stone-900 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg flex items-center justify-between sm:justify-start gap-2 sm:gap-4 border border-white/15 overflow-x-auto max-w-[calc(100vw-1.5rem)]"
                data-oid="47a_a6n"
              >
                <span className="font-bold text-xs sm:text-sm whitespace-nowrap" data-oid="jhdg0tw">
                  {selectedIds.length} selected
                </span>
                <div className="h-4 w-px bg-white/20 shrink-0" data-oid="q8zu:.b" />
                <div className="flex items-center gap-1 sm:gap-2 shrink-0" data-oid="hrdl2y4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleBulkAction('publish')}
                    className="hover:bg-white/10 hover:text-white text-white/90 h-8 font-semibold text-xs px-2.5 sm:px-3"
                    data-oid="i5sd2.g"
                  >
                    Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleBulkAction('unpublish')}
                    className="hover:bg-white/10 hover:text-white text-white/90 h-8 font-semibold text-xs px-2.5 sm:px-3"
                    data-oid="uf3617t"
                  >
                    Unpublish
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkAction('delete')}
                    className="h-8 rounded-lg font-bold shadow-sm text-xs px-2.5 sm:px-3"
                    data-oid="dv2nga1"
                  >
                    Delete
                  </Button>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSelectedIds([])}
                  className="h-8 w-8 rounded-full hover:bg-white/10 text-white/70 hover:text-white shrink-0 ml-1 transition-colors"
                  data-oid="7spaznw"
                >
                  <X className="w-4 h-4" data-oid="1c3nwu2" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={FADE_UP} data-oid="k:o:4tl">
            <div className={cn(PANEL, 'overflow-hidden')} data-oid="p8t1fgh">
              <div
                className="overflow-x-auto scrollbar-thin scrollbar-thumb-stone-200 dark:scrollbar-thumb-white/10"
                data-oid="u-.q60o"
              >
                <Table className="min-w-[900px]" data-oid="lh7lr::">
                  <TableHeader
                    className="border-b border-stone-200/80 dark:border-white/[0.07]"
                    data-oid="8ym8_ow"
                  >
                    <TableRow className="hover:bg-transparent" data-oid="1oauzid">
                      <TableHead className="w-10 py-3 px-4" data-oid="osgwj6q">
                        <Checkbox
                          checked={resources.length > 0 && selectedIds.length === resources.length}
                          onCheckedChange={handleSelectAll}
                          className="border-slate-300 dark:border-slate-700"
                          data-oid="s.8umtk"
                        />
                      </TableHead>
                      <TableHead
                        className="py-3 px-4 w-[380px] cursor-pointer select-none hover:text-stone-900 dark:hover:text-stone-50 transition-colors"
                        onClick={() => handleSort('title')}
                        data-oid="4fc45ak"
                      >
                        <div
                          className={cn(
                            'flex items-center gap-1.5',
                            MICRO,
                            'text-stone-500 dark:text-stone-400'
                          )}
                        >
                          Resource Title & URL
                          {sortField === 'title' ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100 shrink-0" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="py-3 px-4 text-center cursor-pointer select-none hover:text-stone-900 dark:hover:text-stone-50 transition-colors"
                        onClick={() => handleSort('content_type')}
                        data-oid="b9952cs"
                      >
                        <div
                          className={cn(
                            'flex items-center justify-center gap-1.5',
                            MICRO,
                            'text-stone-500 dark:text-stone-400'
                          )}
                        >
                          Type
                          {sortField === 'content_type' ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100 shrink-0" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="py-3 px-4 text-center cursor-pointer select-none hover:text-stone-900 dark:hover:text-stone-50 transition-colors"
                        onClick={() => handleSort('is_published')}
                        data-oid="56ad8mw"
                      >
                        <div
                          className={cn(
                            'flex items-center justify-center gap-1.5',
                            MICRO,
                            'text-stone-500 dark:text-stone-400'
                          )}
                        >
                          Status
                          {sortField === 'is_published' ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100 shrink-0" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="py-3 px-4 text-center cursor-pointer select-none hover:text-stone-900 dark:hover:text-stone-50 transition-colors"
                        onClick={() => handleSort('view_count')}
                        data-oid=".yt65mt"
                      >
                        <div
                          className={cn(
                            'flex items-center justify-center gap-1.5',
                            MICRO,
                            'text-stone-500 dark:text-stone-400'
                          )}
                        >
                          Views
                          {sortField === 'view_count' ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100 shrink-0" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="py-3 px-4 text-right" data-oid=":ifq2i:">
                        <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                          Actions
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody data-oid="v3rqu:3">
                    <AnimatePresence mode="wait" data-oid="x6-.6m9">
                      {loading ? (
                        [...Array(5)].map((_, i) => (
                          <TableRow
                            key={`skeleton-${i}`}
                            className="border-b border-stone-100 dark:border-white/4"
                            data-oid="-85f5s-"
                          >
                            <TableCell className="py-3 px-4" data-oid="skel-1">
                              <div className="w-4 h-4 bg-stone-100 dark:bg-white/4 animate-pulse rounded" />
                            </TableCell>
                            <TableCell className="py-3 px-4" data-oid="skel-2">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-stone-100 dark:bg-white/4 animate-pulse rounded-lg" />
                                <div className="space-y-1.5">
                                  <div className="w-32 h-3 bg-stone-100 dark:bg-white/4 animate-pulse rounded" />
                                  <div className="w-24 h-2 bg-stone-100 dark:bg-white/4 animate-pulse rounded opacity-50" />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4" data-oid="skel-3">
                              <div className="w-14 h-5 bg-stone-100 dark:bg-white/4 animate-pulse rounded-md mx-auto" />
                            </TableCell>
                            <TableCell className="py-3 px-4" data-oid="skel-4">
                              <div className="w-14 h-5 bg-stone-100 dark:bg-white/4 animate-pulse rounded-md mx-auto" />
                            </TableCell>
                            <TableCell className="py-3 px-4" data-oid="skel-5">
                              <div className="w-10 h-3 bg-stone-100 dark:bg-white/4 animate-pulse rounded mx-auto" />
                            </TableCell>
                            <TableCell className="py-3 px-4" data-oid="skel-6">
                              <div className="w-20 h-7 bg-stone-100 dark:bg-white/4 animate-pulse rounded-md ml-auto" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : resources.length === 0 ? (
                        <TableRow data-oid="a83z4o9">
                          <TableCell colSpan={6} className="py-16 text-center" data-oid="iur8kmj">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex flex-col items-center max-w-[280px] mx-auto"
                              data-oid="42-by7e"
                            >
                              <div
                                className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-2xs"
                                data-oid="m8d5s9j"
                              >
                                <Library
                                  className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
                                  data-oid="hpqrxop"
                                />
                              </div>
                              <h3
                                className="font-black text-base text-slate-950 dark:text-white tracking-tight mt-4"
                                data-oid="13wu0c5"
                              >
                                No resources found
                              </h3>
                              <p
                                className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1 leading-relaxed"
                                data-oid="6ops55x"
                              >
                                Your library is currently empty. Start by adding your first
                                educational asset.
                              </p>
                              <AdminButton
                                onClick={() => setIsDialogOpen(true)}
                                className="mt-5"
                                data-oid="vvpkk1m"
                              >
                                Add Resource
                              </AdminButton>
                            </motion.div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        resources.map((resource) => {
                          const typeInfo = getContentTypeInfo(resource.content_type);
                          const Icon = typeInfo.icon;
                          return (
                            <motion.tr
                              key={resource.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              onClick={() => openEditDialog(resource)}
                              className="border-b border-stone-100 dark:border-white/5 hover:bg-stone-50/70 dark:hover:bg-white/2 transition-colors group cursor-pointer"
                              data-oid="9wxwesr"
                            >
                              <TableCell
                                className="py-3 px-4"
                                data-oid="bmit8uj"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Checkbox
                                  checked={selectedIds.includes(resource.id)}
                                  onCheckedChange={(checked) =>
                                    handleSelectOne(resource.id, checked)
                                  }
                                  data-oid="7p1.zr2"
                                />
                              </TableCell>
                              <TableCell className="py-3 px-4" data-oid="k30.m6_">
                                <div className="flex items-center gap-3" data-oid="_73kb:6">
                                  {resource.thumbnail_url ? (
                                    <img
                                      src={resource.thumbnail_url}
                                      alt=""
                                      className="w-8 h-8 rounded-md object-cover border border-stone-200/80 dark:border-white/[0.07] shrink-0"
                                      data-oid="s:vpfd_"
                                    />
                                  ) : (
                                    <div
                                      className={cn(
                                        'w-8 h-8 rounded-md border grid place-items-center shrink-0',
                                        contentTypeStyle(resource.content_type).iconBg
                                      )}
                                      data-oid="mji9x8k"
                                    >
                                      <Icon
                                        className={cn(
                                          'w-3.5 h-3.5',
                                          contentTypeStyle(resource.content_type).icon
                                        )}
                                        data-oid="xw9ksuj"
                                      />
                                    </div>
                                  )}
                                  <div className="min-w-0" data-oid="hu9g-26">
                                    <p
                                      className="font-extrabold text-xs text-stone-900 dark:text-stone-50 truncate max-w-[220px]"
                                      data-oid="eg-a6ai"
                                    >
                                      {resource.title}
                                    </p>
                                    <a
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className={cn(
                                        MICRO,
                                        'font-mono normal-case tracking-normal text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 truncate block max-w-[220px]'
                                      )}
                                      data-oid="r78phhx"
                                    >
                                      {resource.url}
                                    </a>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-3 px-4 text-center" data-oid="sxceztj">
                                <span
                                  className={cn(
                                    PILL_BASE,
                                    contentTypeStyle(resource.content_type).badge,
                                    'capitalize transition-transform duration-150 hover:scale-105'
                                  )}
                                >
                                  <Icon
                                    className={cn(
                                      'w-2 h-2',
                                      contentTypeStyle(resource.content_type).icon
                                    )}
                                  />
                                  {resource.content_type}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 px-4 text-center" data-oid="-1064ur">
                                <span
                                  className={cn(
                                    'inline-flex items-center rounded-md border px-1.5 py-0.5',
                                    MICRO,
                                    resource.is_published
                                      ? 'text-[rgb(var(--signal-ok))] border-[rgb(var(--signal-ok)/0.3)] bg-[rgb(var(--signal-ok)/0.06)]'
                                      : 'text-stone-500 dark:text-stone-400 border-stone-200 dark:border-white/10'
                                  )}
                                >
                                  {resource.is_published ? 'Published' : 'Draft'}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 px-4 text-center" data-oid="tg35wai">
                                <span
                                  className={cn(
                                    NUM,
                                    'text-[11px] font-bold text-stone-700 dark:text-stone-200'
                                  )}
                                >
                                  {resource.view_count || 0}
                                </span>
                              </TableCell>
                              <TableCell
                                className="py-3 px-4 text-right"
                                data-oid="z.8z-y:"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div
                                  className="flex justify-end items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  data-oid="enq8n_h"
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditDialog(resource);
                                    }}
                                    title="Edit"
                                    className="h-7 w-7 grid place-items-center rounded-md transition-all duration-150 active:scale-90 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5"
                                    data-oid="btn-edit"
                                  >
                                    <Edit className="w-3.5 h-3.5" data-oid="icon-edit" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      togglePublishStatus(resource);
                                    }}
                                    title={resource.is_published ? 'Unpublish' : 'Publish'}
                                    className="h-7 w-7 grid place-items-center rounded-md transition-all duration-150 active:scale-90 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5"
                                    data-oid="btn-pub"
                                  >
                                    {resource.is_published ? (
                                      <EyeOff className="w-3.5 h-3.5" data-oid="off" />
                                    ) : (
                                      <Eye className="w-3.5 h-3.5" data-oid="on" />
                                    )}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(resource);
                                    }}
                                    title="Delete"
                                    className="h-7 w-7 grid place-items-center rounded-md transition-all duration-150 active:scale-90 text-stone-500 dark:text-stone-400 hover:text-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.08)]"
                                    data-oid="btn-del"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" data-oid="del" />
                                  </button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  className="px-4 py-3 border-t border-stone-100 dark:border-white/6 flex flex-col sm:flex-row items-center justify-between gap-3"
                  data-oid="pagin"
                >
                  <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                    Page {pagination.page} of {totalPages} —{' '}
                    {Math.min(pagination.count, pagination.limit)} items
                  </p>
                  <div className="flex items-center gap-1.5" data-oid="btns-pag">
                    <AdminButton
                      variant="outline"
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    >
                      <ChevronLeft className="w-3 h-3" />
                      Previous
                    </AdminButton>
                    <AdminButton
                      variant="outline"
                      disabled={pagination.page >= totalPages}
                      onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    >
                      Next
                      <ChevronRight className="w-3 h-3" />
                    </AdminButton>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Delete Confirmation Dialog */}
          <RefinedDeleteModal
            isOpen={deleteConfirmOpen}
            onClose={() => setDeleteConfirmOpen(false)}
            onConfirm={confirmDelete}
            title="Delete resource"
            description={
              bulkActionToDelete
                ? `Permanently delete ${selectedIds.length} selected resources? This cannot be undone.`
                : 'This resource will be permanently removed and cannot be recovered.'
            }
            itemIdentifier={!bulkActionToDelete ? resourceToDelete?.title : null}
            confirmText="DELETE"
            isLoading={submitting}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResourceManagement;
