import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@/entities';
import { queryKeys } from '@/lib/queryClient';
import { toast } from 'sonner';

/**
 * Hook to fetch the current user's profile
 */
export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.user.me(),
    queryFn: () => User.me(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

/**
 * Hook to update the current user's profile with optimistic updates
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => User.updateMyUserData(data),

    // When mutate is called:
    onMutate: async (newUserData) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: queryKeys.user.me() });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData(queryKeys.user.me());

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.user.me(), (old) => {
        return {
          ...old,
          ...newUserData,
        };
      });

      // Return a context object with the snapshotted value
      return { previousUser };
    },

    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newUserData, context) => {
      queryClient.setQueryData(queryKeys.user.me(), context.previousUser);
      toast.error('Failed to update profile', {
        description: err.message || 'Please try again.',
      });
    },

    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
    },

    onSuccess: () => {
      toast.success('Profile updated', {
        description: 'Your changes have been saved successfully.',
      });
    },
  });
}
