import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Resource } from '@/features/learning/services/Resource';

export function useResources({
  filters = {},
  orderBy = '-created_at',
  limit = 20,
  page = 1,
  includeContent = false,
  enabled = true,
} = {}) {
  return useQuery({
    queryKey: ['resources', { filters, orderBy, limit, page, includeContent }],
    queryFn: () => Resource.list(filters, orderBy, limit, page, includeContent),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
  });
}
