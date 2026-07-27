import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  CheckCircle2,
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

import BlogEditor from './resources/BlogEditor';
import VocabularyEditor from './resources/VocabularyEditor';

const CONTENT_TYPES = [
  { id: 'video', label: 'Video', icon: Video, color: 'rose' },
  { id: 'pdf', label: 'PDF', icon: FileText, color: 'blue' },
  { id: 'blog', label: 'Blog', icon: BookOpen, color: 'emerald' },
  { id: 'vocabulary', label: 'Vocabulary', icon: Brain, color: 'indigo' },
];

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
  const [urlError, setUrlError] = useState('');
  const [showBlogEditor, setShowBlogEditor] = useState(false);
  const [showVocabEditor, setShowVocabEditor] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Deletion state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const [bulkActionToDelete, setBulkActionToDelete] = useState(false);

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterType !== 'all') filters.content_type = filterType;
      if (searchQuery.trim()) filters.searchQuery = searchQuery.trim();

      const orderBy = sortDirection === 'desc' ? `-${sortField}` : sortField;
      const result = await Resource.list(filters, orderBy, pagination.limit, pagination.page);
      setResources(result.data);
      setPagination((prev) => ({ ...prev, count: result.count }));
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  }, [filterType, searchQuery, sortField, sortDirection, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

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
      // Fetch all resources without pagination for export
      const result = await Resource.list({}, '-created_at', 1000, 1);

      const dataStr =
        'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result.data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute(
        'download',
        `resources_export_${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const getContentTypeInfo = (type) => CONTENT_TYPES.find((t) => t.id === type) || CONTENT_TYPES[2];

  if (showBlogEditor) {
    return (
      <BlogEditor
        initialData={editingResource}
        onSave={handleBlogSave}
        onCancel={() => {
          setShowBlogEditor(false);
          setEditingResource(null);
        }}
        data-oid="8p_2e5o"
      />
    );
  }

  if (showVocabEditor) {
    return (
      <VocabularyEditor
        initialData={editingResource}
        onSave={handleVocabSave}
        onCancel={() => {
          setShowVocabEditor(false);
          setEditingResource(null);
        }}
        data-oid="8:2gym2"
      />
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-6"
      data-oid="7ze--xz"
    >
      {/* Top Header Section */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1"
        data-oid="o56ihpo"
      >
        <div className="space-y-0.5" data-oid="8o9gofp">
          <h2
            className="text-xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2.5"
            data-oid="3fimod-"
          >
            <div
              className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
              data-oid="fm45sc-"
            >
              <Library className="w-5 h-5" data-oid="i1.ai0g" />
            </div>
            Resource Management
          </h2>
          <p
            className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 ml-1"
            data-oid="r5:4ldd"
          >
            Manage educational video guides, PDFs, blogs, and vocabulary banks for candidates
          </p>
        </div>

        <div className="flex items-center gap-2" data-oid="42vher3">
          <DropdownMenu data-oid="actions-dropdown">
            <DropdownMenuTrigger asChild data-oid="actions-trigger">
              <Button
                variant="outline"
                className="h-9 px-3.5 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs shadow-2xs"
                data-oid="btn-more-actions"
              >
                <MoreVertical className="w-4 h-4 mr-1.5 text-slate-500" data-oid="icon-more" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-xl border-border/50 bg-popover/95 backdrop-blur-xl"
              data-oid="actions-content"
            >
              <DropdownMenuItem
                onClick={handleExport}
                className="cursor-pointer font-medium py-2 rounded-lg"
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
                  className="cursor-pointer font-medium py-2 rounded-lg"
                  data-oid="item-import"
                >
                  <FileJson className="w-4 h-4 mr-2" data-oid="icon-import" />
                  Import Data
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="bg-border/50" data-oid="sep-1" />
              <DropdownMenuItem
                onClick={() => {
                  setEditingResource(null);
                  setShowBlogEditor(true);
                }}
                className="cursor-pointer font-medium py-2 rounded-lg text-emerald-600 dark:text-emerald-400"
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
                className="cursor-pointer font-medium py-2 rounded-lg text-indigo-600 dark:text-indigo-400"
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
              <Button
                className="h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-2xs rounded-xl text-xs gap-1 transition-all"
                data-oid="pow-z6t"
              >
                <Plus className="w-3.5 h-3.5" data-oid="_lhw9j3" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 max-w-lg rounded-2xl overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto"
              data-oid="dtsedp6"
            >
              <DialogHeader className="space-y-1" data-oid="9ymdqci">
                <DialogTitle
                  className="text-lg font-black tracking-tight text-slate-950 dark:text-white"
                  data-oid="q4ff11i"
                >
                  {editingResource ? 'Edit Resource' : 'New Resource'}
                </DialogTitle>
                <DialogDescription
                  className="text-slate-500 dark:text-slate-400 font-medium text-xs"
                  data-oid="koc8ozk"
                >
                  Enter details to publish or update educational content
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-4" data-oid="b99_0_r">
                {/* Content Type Selector */}
                <div className="space-y-2" data-oid="sy.xfys">
                  <Label
                    className="text-sm font-bold ml-1 uppercase tracking-wider opacity-70"
                    data-oid="ow56.:7"
                  >
                    Content Type
                  </Label>
                  <div className="grid grid-cols-3 gap-3" data-oid="p0.5qes">
                    {CONTENT_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, content_type: type.id })}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                          formData.content_type === type.id
                            ? `border-${type.color}-500 bg-${type.color}-500/10 text-${type.color}-600 dark:text-${type.color}-400`
                            : 'border-border/50 hover:border-border text-muted-foreground hover:text-foreground'
                        }`}
                        data-oid="r1h-r_w"
                      >
                        <type.icon className="w-5 h-5" data-oid="ps_q55-" />
                        <span
                          className="text-xs font-bold uppercase tracking-wider"
                          data-oid="dswdj1n"
                        >
                          {type.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2" data-oid="hh9hmic">
                  <Label
                    className="text-sm font-bold ml-1 uppercase tracking-wider opacity-70"
                    data-oid="li34xyq"
                  >
                    Title *
                  </Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter resource title"
                    className="h-11 bg-muted/30 border-border/50 rounded-xl focus-visible:ring-primary/20"
                    data-oid="75.hcge"
                  />
                </div>

                {/* URL */}
                <div className="space-y-2" data-oid="mexanab">
                  <Label
                    className="text-sm font-bold ml-1 uppercase tracking-wider opacity-70"
                    data-oid="-m:2557"
                  >
                    URL *
                  </Label>
                  <div className="relative" data-oid="tqea:xz">
                    <Link2
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary"
                      data-oid="r05-p:t"
                    />

                    <Input
                      value={formData.url}
                      onChange={(e) => {
                        const newUrl = e.target.value;
                        setFormData((prev) => ({ ...prev, url: newUrl }));

                        // Clear validation error if any
                        if (urlError) validateUrl(newUrl, formData.content_type);
                      }}
                      placeholder={
                        formData.content_type === 'video'
                          ? 'https://youtube.com/watch?v=...'
                          : formData.content_type === 'pdf'
                            ? 'https://example.com/document.pdf'
                            : 'https://blog.example.com/article'
                      }
                      className={`h-11 pl-10 pr-12 bg-muted/30 border-border/50 rounded-xl focus-visible:ring-primary/20 ${urlError ? 'border-red-500' : ''}`}
                      data-oid="x7g.4gw"
                    />

                    {formData.content_type === 'video' && formData.url.length > 10 && (
                      <button
                        type="button"
                        onClick={() => fetchVideoMetadata(formData.url)}
                        disabled={fetchingMetadata}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
                        title="Fetch video details"
                        data-oid="fetch-meta-btn"
                      >
                        <Sparkles
                          className={cn('w-4 h-4', fetchingMetadata && 'animate-spin')}
                          data-oid="icon-spark"
                        />
                      </button>
                    )}
                  </div>
                  {urlError && (
                    <p
                      className="text-xs text-red-500 flex items-center gap-1 ml-1"
                      data-oid="upsldzt"
                    >
                      <AlertCircle className="w-3 h-3" data-oid="y.pbbc0" /> {urlError}
                    </p>
                  )}
                </div>

                {/* PDF Upload Section */}
                {formData.content_type === 'pdf' && (
                  <div className="space-y-2" data-oid="pdf-upload-section">
                    <Label className="text-sm font-bold ml-1 uppercase tracking-wider opacity-70">
                      Upload PDF
                    </Label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handlePdfUpload}
                          disabled={uploadingPdf}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                        />
                        <div
                          className={`h-12 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-colors ${
                            uploadingPdf
                              ? 'border-primary/50 bg-primary/5'
                              : 'border-border/50 hover:border-primary/50 hover:bg-primary/5'
                          }`}
                        >
                          {uploadingPdf ? (
                            <>
                              <Sparkles className="w-4 h-4 text-primary animate-spin" />
                              <span className="text-sm text-primary font-medium">
                                Uploading to R2...
                              </span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {formData.url
                                  ? 'Change PDF File'
                                  : 'Click to Upload PDF (Max 50MB)'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {formData.url && (
                        <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-600">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2" data-oid="yn-3nf0">
                  <Label
                    className="text-sm font-bold ml-1 uppercase tracking-wider opacity-70"
                    data-oid="dm070i5"
                  >
                    Description
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the resource"
                    className="min-h-[80px] bg-muted/30 border-border/50 rounded-xl resize-none focus-visible:ring-primary/20"
                    data-oid="qrcpbvm"
                  />
                </div>

                {/* Thumbnail Upload */}
                <div className="space-y-2" data-oid="id2w2gd">
                  <Label
                    className="text-sm font-bold ml-1 uppercase tracking-wider opacity-70"
                    data-oid="0xaxc41"
                  >
                    Thumbnail Image
                  </Label>
                  <div className="flex items-center gap-3" data-oid="844q26t">
                    {(formData.thumbnail_url || thumbnailFile) && (
                      <div
                        className="w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/30"
                        data-oid="7:ai7ok"
                      >
                        <img
                          src={
                            thumbnailFile
                              ? URL.createObjectURL(thumbnailFile)
                              : formData.thumbnail_url
                          }
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                          data-oid="o5.pvq4"
                        />
                      </div>
                    )}
                    <label
                      className="flex-1 h-16 border-2 border-dashed border-border/50 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                      data-oid=".h.-9w9"
                    >
                      <Upload className="w-4 h-4 text-muted-foreground" data-oid="1cw35_v" />
                      <span className="text-sm text-muted-foreground" data-oid="noq7m0w">
                        {thumbnailFile ? thumbnailFile.name : 'Upload image'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                        data-oid="qky:hkz"
                      />
                    </label>
                  </div>
                </div>

                {/* Access Tier Selector */}
                <div className="space-y-2" data-oid="4koqs-m">
                  <Label
                    className="text-sm font-bold ml-1 uppercase tracking-wider opacity-70"
                    data-oid="u_u_fc."
                  >
                    Access Tier
                  </Label>
                  <div className="grid grid-cols-3 gap-2" data-oid="h.jthgs">
                    {['free', 'pro', 'premium'].map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setFormData({ ...formData, access_tier: tier })}
                        className={`py-2 px-4 rounded-xl border-2 transition-all duration-200 text-xs font-bold uppercase tracking-wider ${
                          formData.access_tier === tier
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border/50 hover:border-border text-muted-foreground'
                        }`}
                        data-oid="ggl4ea."
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Publish Toggle */}
                <div
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50"
                  data-oid="bgnheqq"
                >
                  <div className="space-y-0.5" data-oid="2fogzjp">
                    <Label className="text-sm font-bold" data-oid="weo7afk">
                      Publish Immediately
                    </Label>
                    <p className="text-xs text-muted-foreground" data-oid="t.vzrn1">
                      Make visible to users on dashboard
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_published: checked })
                    }
                    data-oid="bg3gmmj"
                  />
                </div>
              </div>

              <DialogFooter className="gap-3" data-oid="q.ovgwu">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  className="rounded-xl font-bold h-11"
                  data-oid="bvuumc8"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    submitting ||
                    uploadingPdf ||
                    (formData.content_type === 'video' && fetchingMetadata)
                  }
                  className="px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                  data-oid="btn-submit"
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span> Saving...
                    </>
                  ) : (
                    'Save Resource'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* 3 Compact KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5" data-oid="ju0dnr8">
        {[
          { label: 'Total Resources', value: stats.total, icon: Library, color: 'indigo' },
          { label: 'Published', value: stats.published, icon: Sparkles, color: 'emerald' },
          { label: 'Total Views', value: stats.totalViews, icon: Eye, color: 'rose' },
        ].map((item, idx) => (
          <motion.div key={idx} variants={itemVariants} data-oid="11um8uk">
            <Card
              className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 rounded-2xl shadow-2xs overflow-hidden"
              data-oid="eqw6up2"
            >
              <CardContent
                className="p-3.5 px-4 flex items-center justify-between"
                data-oid="vrw0:b8"
              >
                <div data-oid="9_afd1:">
                  <p
                    className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5"
                    data-oid="7.kttsj"
                  >
                    {item.label}
                  </p>
                  <h4
                    className="text-xl font-black text-slate-950 dark:text-white leading-none"
                    data-oid="odze9k4"
                  >
                    {item.value || 0}
                  </h4>
                </div>
                <div
                  className={`p-2 rounded-xl ${
                    item.color === 'emerald'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900'
                      : item.color === 'indigo'
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900'
                  }`}
                  data-oid="5d3m6tk"
                >
                  <item.icon className="w-4 h-4" data-oid="zq:k7jh" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter Toolbar */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 p-2 rounded-2xl shadow-2xs"
        data-oid="a_eoz4w"
      >
        <div className="relative flex-1 w-full" data-oid="u9h2esc">
          <SearchIcon
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            data-oid="aehg331"
          />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            placeholder="Search by title, description, or URL..."
            className="h-9 pl-9 border-none bg-transparent focus-visible:ring-0 text-xs font-semibold placeholder:text-slate-400 shadow-none"
            data-oid="-7jwxl2"
          />
        </div>
        <div
          className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"
          data-oid="spacer-line"
        />
        <div
          className="flex items-center gap-1 p-0.5 w-full sm:w-auto overflow-x-auto no-scrollbar shrink-0"
          data-oid="r-36p1t"
        >
          {[{ id: 'all', label: 'All', icon: LayoutGrid }, ...CONTENT_TYPES].map((type) => {
            const Icon = type.icon;
            const isActive = filterType === type.id;
            return (
              <Button
                key={type.id}
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterType(type.id);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={cn(
                  'h-8 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap border',
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-white/10 hover:border-slate-300'
                )}
                data-oid="2092.e1"
              >
                <Icon
                  className={cn('w-3.5 h-3.5', isActive ? 'text-white' : 'text-slate-400')}
                  data-oid={`icon-${type.id}`}
                />
                {type.label}
              </Button>
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
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10"
            data-oid="47a_a6n"
          >
            <span className="font-bold text-sm whitespace-nowrap" data-oid="jhdg0tw">
              {selectedIds.length} selected
            </span>
            <div className="h-4 w-px bg-white/20" data-oid="q8zu:.b" />
            <div className="flex gap-2" data-oid="hrdl2y4">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleBulkAction('publish')}
                className="hover:bg-white/10 hover:text-white text-white/90 h-8 font-semibold"
                data-oid="i5sd2.g"
              >
                Publish
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleBulkAction('unpublish')}
                className="hover:bg-white/10 hover:text-white text-white/90 h-8 font-semibold"
                data-oid="uf3617t"
              >
                Unpublish
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBulkAction('delete')}
                className="h-8 rounded-lg font-bold shadow-sm"
                data-oid="dv2nga1"
              >
                Delete
              </Button>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              className="h-8 w-8 rounded-full hover:bg-white/10 text-white/70 hover:text-white ml-2 transition-colors"
              data-oid="7spaznw"
            >
              <X className="w-4 h-4" data-oid="1c3nwu2" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants} data-oid="k:o:4tl">
        <Card
          className="bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-2xs rounded-2xl overflow-hidden"
          data-oid="p8t1fgh"
        >
          <div className="overflow-x-auto" data-oid="u-.q60o">
            <Table className="min-w-[900px]" data-oid="lh7lr::">
              <TableHeader
                className="bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-100 dark:border-white/5"
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
                    className="py-3 px-4 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[380px] cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors select-none"
                    onClick={() => handleSort('title')}
                    data-oid="4fc45ak"
                  >
                    <div className="flex items-center gap-1.5">
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
                    className="py-3 px-4 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors select-none"
                    onClick={() => handleSort('content_type')}
                    data-oid="b9952cs"
                  >
                    <div className="flex items-center justify-center gap-1.5">
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
                    className="py-3 px-4 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors select-none"
                    onClick={() => handleSort('is_published')}
                    data-oid="56ad8mw"
                  >
                    <div className="flex items-center justify-center gap-1.5">
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
                    className="py-3 px-4 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors select-none"
                    onClick={() => handleSort('view_count')}
                    data-oid=".yt65mt"
                  >
                    <div className="flex items-center justify-center gap-1.5">
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
                  <TableHead
                    className="py-3 px-4 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right"
                    data-oid=":ifq2i:"
                  >
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody data-oid="v3rqu:3">
                <AnimatePresence mode="wait" data-oid="x6-.6m9">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow
                        key={`skeleton-${i}`}
                        className="border-b border-slate-100 dark:border-white/5"
                        data-oid="-85f5s-"
                      >
                        <TableCell className="py-3 px-4" data-oid="skel-1">
                          <div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                        </TableCell>
                        <TableCell className="py-3 px-4" data-oid="skel-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
                            <div className="space-y-1.5">
                              <div className="w-32 h-3 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                              <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 animate-pulse rounded opacity-50" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4" data-oid="skel-3">
                          <div className="w-16 h-5 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg mx-auto" />
                        </TableCell>
                        <TableCell className="py-3 px-4" data-oid="skel-4">
                          <div className="w-16 h-5 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg mx-auto" />
                        </TableCell>
                        <TableCell className="py-3 px-4" data-oid="skel-5">
                          <div className="w-10 h-3 bg-slate-100 dark:bg-slate-800 animate-pulse rounded mx-auto" />
                        </TableCell>
                        <TableCell className="py-3 px-4" data-oid="skel-6">
                          <div className="w-20 h-7 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg ml-auto" />
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
                            Your library is currently empty. Start by adding your first educational
                            asset.
                          </p>
                          <Button
                            onClick={() => setIsDialogOpen(true)}
                            className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-6 rounded-xl font-extrabold text-xs shadow-2xs"
                            data-oid="vvpkk1m"
                          >
                            Add Resource
                          </Button>
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
                          className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                          data-oid="9wxwesr"
                        >
                          <TableCell
                            className="py-3 px-4"
                            data-oid="bmit8uj"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={selectedIds.includes(resource.id)}
                              onCheckedChange={(checked) => handleSelectOne(resource.id, checked)}
                              className="border-slate-300 dark:border-slate-700"
                              data-oid="7p1.zr2"
                            />
                          </TableCell>
                          <TableCell className="py-3 px-4" data-oid="k30.m6_">
                            <div className="flex items-center gap-3" data-oid="_73kb:6">
                              {resource.thumbnail_url ? (
                                <img
                                  src={resource.thumbnail_url}
                                  alt=""
                                  className="w-9 h-9 rounded-xl object-cover border border-slate-200/80 dark:border-white/10 shrink-0"
                                  data-oid="s:vpfd_"
                                />
                              ) : (
                                <div
                                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 shadow-2xs"
                                  data-oid="mji9x8k"
                                >
                                  <Icon
                                    className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                                    data-oid="xw9ksuj"
                                  />
                                </div>
                              )}
                              <div className="min-w-0" data-oid="hu9g-26">
                                <p
                                  className="font-extrabold text-xs text-slate-950 dark:text-white truncate max-w-[220px]"
                                  data-oid="eg-a6ai"
                                >
                                  {resource.title}
                                </p>
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[10px] font-mono text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 truncate block max-w-[220px]"
                                  data-oid="r78phhx"
                                >
                                  {resource.url}
                                </a>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-center" data-oid="sxceztj">
                            <Badge
                              variant="outline"
                              className={cn(
                                'capitalize font-bold text-[10px] px-2 py-0.5 rounded-lg border',
                                resource.content_type === 'video' &&
                                  'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
                                resource.content_type === 'pdf' &&
                                  'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
                                resource.content_type === 'blog' &&
                                  'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
                                resource.content_type === 'vocabulary' &&
                                  'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900'
                              )}
                              data-oid=":i36tj8"
                            >
                              {resource.content_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-center" data-oid="-1064ur">
                            <Badge
                              variant="outline"
                              className={cn(
                                'capitalize font-bold text-[10px] px-2 py-0.5 rounded-lg border',
                                resource.is_published
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                              )}
                              data-oid="w:xo_on"
                            >
                              {resource.is_published ? 'Published' : 'Draft'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-center" data-oid="tg35wai">
                            <span
                              className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300"
                              data-oid=".1g.ywp"
                            >
                              {resource.view_count || 0}
                            </span>
                          </TableCell>
                          <TableCell
                            className="py-3 px-4 text-right"
                            data-oid="z.8z-y:"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex justify-end items-center gap-1" data-oid="enq8n_h">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(resource);
                                }}
                                className="h-7 w-7 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Edit"
                                data-oid="btn-edit"
                              >
                                <Edit className="w-3.5 h-3.5" data-oid="icon-edit" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePublishStatus(resource);
                                }}
                                className={cn(
                                  'h-7 w-7 rounded-lg transition-colors',
                                  resource.is_published
                                    ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                    : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                )}
                                title={resource.is_published ? 'Unpublish' : 'Publish'}
                                data-oid="btn-pub"
                              >
                                {resource.is_published ? (
                                  <EyeOff className="w-3.5 h-3.5" data-oid="off" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" data-oid="on" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(resource);
                                }}
                                className="h-7 w-7 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Delete"
                                data-oid="btn-del"
                              >
                                <Trash2 className="w-3.5 h-3.5" data-oid="del" />
                              </Button>
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
              className="px-6 py-4 bg-muted/20 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4"
              data-oid="pagin"
            >
              <p
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60"
                data-oid="page-info"
              >
                Page {pagination.page} of {totalPages} — Showing{' '}
                {Math.min(pagination.count, pagination.limit)} items
              </p>
              <div className="flex items-center gap-2" data-oid="btns-pag">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  className="h-10 px-4 rounded-xl border-border/50 font-bold hover:bg-background transition-all"
                  data-oid="btn-prev"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" data-oid="cl" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= totalPages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  className="h-10 px-4 rounded-xl border-border/50 font-bold hover:bg-background transition-all"
                  data-oid="btn-next"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" data-oid="cr" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen} data-oid="081hpnm">
        <AlertDialogContent
          className="bg-card border-border/50 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl"
          data-oid="ffzftz5"
        >
          <AlertDialogHeader data-oid="ltm.yj7">
            <AlertDialogTitle
              className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2"
              data-oid="c26w95x"
            >
              <Trash2 className="w-6 h-6 text-destructive" data-oid="b1bde3y" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription
              className="text-muted-foreground text-lg leading-relaxed"
              data-oid="jggdsa1"
            >
              {bulkActionToDelete
                ? `Are you sure you want to delete ${selectedIds.length} selected resources? This action is permanent and cannot be undone.`
                : `Are you sure you want to delete "${resourceToDelete?.title}"? This action is permanent and cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-6" data-oid="wu360f9">
            <AlertDialogCancel
              disabled={submitting}
              className="rounded-xl font-bold h-12"
              data-oid="u91cmaa"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={submitting}
              className="h-12 px-8 rounded-xl font-black bg-destructive text-destructive-foreground shadow-lg shadow-destructive/10 hover:bg-destructive/90"
              data-oid="k.ttggi"
            >
              {submitting ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default ResourceManagement;
