import { supabase } from '@/lib/supabase';

// URL validation patterns
const URL_PATTERNS = {
    video: /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|wistia\.com)/i,
    pdf: /^https?:\/\/.+\.(pdf)($|\?)|^https?:\/\/(drive\.google\.com|docs\.google\.com|dropbox\.com)/i,
    blog: /^https?:\/\/.+/i,
    vocabulary: /^https?:\/\/.+/i, // URL is optional for vocabulary, will be handled in validateUrl
};

interface ResourceType {
    id: string;
    title: string;
    description?: string;
    url: string;
    content?: string; // HTML content for blogs or JSON for vocabulary
    slug?: string;
    seo_tags?: string[];
    content_type: 'video' | 'pdf' | 'blog' | 'vocabulary' | string;
    thumbnail_url?: string;
    is_published: boolean;
    access_tier?: 'free' | 'pro' | 'premium';
    created_by?: string;
    created_at?: string;
    updated_at?: string;
    view_count?: number;
    [key: string]: any;
}

interface ListResult {
    data: ResourceType[];
    count: number;
    page: number;
    limit: number;
}

export const Resource = {
    /**
     * List resources with filtering, sorting, and pagination
     */
    async list(
        filters: Record<string, any> = {},
        orderBy: string = '-created_at',
        limit: number = 20,
        page: number = 1,
        includeContent: boolean = false
    ): Promise<ListResult> {
        // OPTIMIZATION: Explicitly select columns to EXCLUDE 'content' by default
        // 'content' can be very large (HTML/JSON), and we don't need it for most list views
        const selectFields = includeContent
            ? 'id, title, description, url, slug, seo_tags, content_type, thumbnail_url, is_published, access_tier, created_by, created_at, updated_at, view_count, content'
            : 'id, title, description, url, slug, seo_tags, content_type, thumbnail_url, is_published, access_tier, created_by, created_at, updated_at, view_count';

        let query = supabase.from('resources').select(selectFields, { count: 'exact' });

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '' || value === 'all') return;

            if (key === 'searchQuery') {
                query = query.or(`title.ilike.%${value}%,description.ilike.%${value}%`);
            } else {
                query = query.eq(key, value);
            }
        });

        // Apply ordering
        const ascending = !orderBy.startsWith('-');
        const column = orderBy.replace('-', '');
        query = query.order(column, { ascending });

        // Apply pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;
        if (error) throw error;

        return { data: (data as unknown as ResourceType[]) || [], count: count || 0, page, limit };
    },

    /**
     * Create a new resource
     */
    async create(resourceData: Partial<ResourceType>): Promise<ResourceType> {
        // Validate URL based on content type
        if (!this.validateUrl(resourceData.url, resourceData.content_type)) {
            throw new Error(`Invalid URL for content type: ${resourceData.content_type}`);
        }

        const { data: userData } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('resources')
            .insert({
                ...resourceData,
                url: this.sanitizeUrl(resourceData.url),
                created_by: userData.user?.id || null,
            })
            .select()
            .single();

        if (error) throw error;
        return data as ResourceType;
    },

    /**
     * Update an existing resource
     */
    async update(id: string, updateData: Partial<ResourceType>): Promise<ResourceType> {
        // Validate URL if being updated
        if (updateData.url && updateData.content_type) {
            if (!this.validateUrl(updateData.url, updateData.content_type)) {
                throw new Error(`Invalid URL for content type: ${updateData.content_type}`);
            }
            updateData.url = this.sanitizeUrl(updateData.url);
        }

        const { data, error } = await supabase
            .from('resources')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as ResourceType;
    },

    /**
     * Delete a resource (uses RPC to bypass RLS with internal admin check)
     */
    async delete(id: string): Promise<void> {
        if (!id) throw new Error('Resource ID is required for deletion');

        // Use direct delete which is more standard and follows RLS
        const { error } = await supabase.from('resources').delete().eq('id', id);

        if (error) {
            console.error('Direct delete failed, attempting RPC fallback:', error);
            // Fallback to RPC if direct delete fails (might be RLS issue)
            const { error: rpcError } = await supabase.rpc('delete_resource', { resource_id: id });
            if (rpcError) throw rpcError;
        }
    },

    /**
     * Bulk delete resources
     */
    async bulkDelete(ids: string[]): Promise<boolean | void> {
        if (!ids || ids.length === 0) return;
        const { error } = await supabase.from('resources').delete().in('id', ids);
        if (error) throw error;
        return true;
    },

    /**
     * Bulk update resources (e.g. for publishing)
     */
    async bulkUpdate(ids: string[], updates: Partial<ResourceType>): Promise<ResourceType[] | void> {
        if (!ids || ids.length === 0) return;
        const { data, error } = await supabase.from('resources').update(updates).in('id', ids).select();

        if (error) throw error;
        return data as ResourceType[];
    },

    /**
     * Get a single resource by ID
     */
    async getById(id: string): Promise<ResourceType> {
        const { data, error } = await supabase.from('resources').select('*').eq('id', id).single();

        if (error) throw error;
        return data as ResourceType;
    },

    /**
     * Increment view count via RPC (bypasses RLS for updates)
     */
    async incrementViewCount(id: string): Promise<void> {
        const { error } = await supabase.rpc('increment_resource_view', { resource_id: id });
        if (error) {
            console.warn('Failed to increment view count:', error);
        }
    },

    /**
     * Validate URL based on content type
     */
    validateUrl(url?: string, contentType?: string): boolean {
        if (contentType === 'vocabulary') return true; // Vocabulary lists can use internal content instead of URL
        if (!url || !contentType) return false;
        const pattern = URL_PATTERNS[contentType as keyof typeof URL_PATTERNS] || URL_PATTERNS.blog;
        return pattern.test(url);
    },

    /**
     * Sanitize URL - remove potential XSS vectors
     */
    sanitizeUrl(url?: string): string {
        if (!url) return '';
        if (url.startsWith('#') || url === '') return url;
        // Remove javascript: and data: protocols
        const sanitized = url.replace(/^(javascript|data):/i, '');
        // Ensure it starts with http:// or https://
        if (!/^https?:\/\//i.test(sanitized)) {
            return `https://${sanitized}`;
        }
        return sanitized;
    },

    /**
     * Bulk import resources (Upsert based on URL to prevent duplicates)
     */
    async bulkImport(resources: any[]): Promise<{ count: number }> {
        if (!resources || !Array.isArray(resources) || resources.length === 0) {
            throw new Error('Invalid resources data');
        }

        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        const validResources = resources
            .map((r) => ({
                title: r.title,
                description: r.description,
                url: r.url,
                content: r.content,
                slug: r.slug,
                seo_tags: r.seo_tags,
                content_type: r.content_type,
                thumbnail_url: r.thumbnail_url,
                is_published: r.is_published,
                created_by: userId,
            }))
            .filter((r) => r.url && r.title); // Basic validation

        if (validResources.length === 0) return { count: 0 };

        const { data, error } = await supabase.from('resources').insert(validResources).select();

        if (error) throw error;
        return { count: data ? data.length : 0 };
    },

    /**
     * Extract video embed ID for previews
     */
    getVideoEmbedInfo(url: string): { type: 'youtube' | 'vimeo'; id: string; embedUrl: string } | null {
        // YouTube
        const ytMatch = url.match(
            /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
        );
        if (ytMatch) {
            return {
                type: 'youtube',
                id: ytMatch[1],
                embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
            };
        }
        // Vimeo
        const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        if (vimeoMatch) {
            return {
                type: 'vimeo',
                id: vimeoMatch[1],
                embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
            };
        }
        return null;
    },
};
