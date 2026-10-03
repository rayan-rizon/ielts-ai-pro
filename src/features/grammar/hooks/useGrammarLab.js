import { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useResultRecommendations } from '@/features/recommendations/useResultRecommendations';
import { generateAdaptiveLearningPath } from '@/utils/api';
import { GRAMMAR_GUIDES } from '../data/grammarGuideCatalog';
import {
  completeGrammarAttempt,
  getGrammarAttempt,
  getGrammarDashboard,
  setGrammarGuideCompletion,
  startGrammarAttempt,
  submitGrammarResponse,
} from '../services/grammarLabService';

export function useGrammarLab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [result, setResult] = useState(null);
  const refreshedAttempts = useRef(new Set());
  const isPaid = ['pro', 'premium', 'admin'].includes(
    String(user?.subscription_tier || 'free').toLowerCase()
  );

  const dashboardQuery = useQuery({
    queryKey: ['grammarLab', 'dashboard', user?.id],
    queryFn: getGrammarDashboard,
    enabled: Boolean(user?.id),
    staleTime: 60_000,
    retry: 1,
  });

  const refreshConsumers = useCallback(
    async (attemptId) => {
      if (!attemptId || refreshedAttempts.current.has(attemptId)) return;
      refreshedAttempts.current.add(attemptId);

      if (isPaid) {
        await generateAdaptiveLearningPath({
          trigger: 'grammar_completed',
          module: 'grammar',
        }).catch((error) =>
          console.warn('Grammar evidence was saved; Learning Path refresh was deferred:', error)
        );
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['grammarLab'] }),
        queryClient.invalidateQueries({ queryKey: ['learningPath'] }),
        queryClient.invalidateQueries({ queryKey: ['analytics'] }),
      ]);
    },
    [isPaid, queryClient]
  );

  const startMutation = useMutation({
    mutationFn: startGrammarAttempt,
    onSuccess: (data) => {
      setResult(null);
      setActiveAttempt(data);
    },
    onError: (error) => {
      toast.error('Could not start Grammar practice', { description: error.message });
    },
  });

  const responseMutation = useMutation({
    mutationFn: submitGrammarResponse,
  });

  const resumeMutation = useMutation({
    mutationFn: getGrammarAttempt,
    onSuccess: (data) => {
      setResult(null);
      setActiveAttempt(data);
    },
    onError: (error) => {
      toast.error('Could not resume Grammar practice', { description: error.message });
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeGrammarAttempt,
    onSuccess: async (data) => {
      const itemsById = new Map(
        (activeAttempt?.items || []).map((item) => [String(item.id), item])
      );
      setResult({
        type: 'deterministic',
        ...data,
        results: (data.results || []).map((item) => ({
          ...item,
          ...itemsById.get(String(item.itemId)),
        })),
      });
      await refreshConsumers(data.attemptId);
    },
    onError: (error) => {
      toast.error('Could not complete Grammar practice', { description: error.message });
    },
  });

  const guideCompletionMutation = useMutation({
    mutationFn: ({ guideSlug, completed }) =>
      setGrammarGuideCompletion({ userId: user?.id, guideSlug, completed }),
    onSuccess: async ({ completed }) => {
      await queryClient.invalidateQueries({ queryKey: ['grammarLab', 'dashboard', user?.id] });
      toast.success(completed ? 'Guide marked complete' : 'Guide marked incomplete');
    },
    onError: (error) => {
      toast.error('Could not update guide completion', { description: error.message });
    },
  });

  const dashboard = dashboardQuery.data;
  const resultRecommendations = useResultRecommendations({
    user,
    grammarSkills: dashboard?.skills,
    completedGrammarSlugs: dashboard?.completedGuideSlugs,
    grammarGuides: GRAMMAR_GUIDES,
  });
  const recommendedSkill = useMemo(() => {
    const skills = dashboard?.skills || [];
    const measured = skills
      .filter((skill) => skill.evidenceClass === 'measured' && skill.mastery < 0.75)
      .sort((a, b) => a.mastery - b.mastery || b.observations - a.observations);
    if (measured.length) return measured[0];
    const early = skills
      .filter((skill) => skill.evidenceClass === 'early')
      .sort((a, b) => a.mastery - b.mastery);
    return early[0] || skills[0] || null;
  }, [dashboard?.skills]);

  const criterionDiagnosticNeeded = useMemo(() => {
    const hasGranular = (dashboard?.skills || []).some((skill) => skill.observations > 0);
    const hasCriterion = (dashboard?.criterionEvidence || []).some(
      (signal) => signal.observations > 0 && signal.mastery < 0.75
    );
    return hasCriterion && !hasGranular;
  }, [dashboard?.criterionEvidence, dashboard?.skills]);

  return {
    user,
    isPaid,
    dashboard,
    isLoading: dashboardQuery.isLoading,
    error: dashboardQuery.error,
    refetch: dashboardQuery.refetch,
    recommendedSkill,
    resultRecommendations,
    criterionDiagnosticNeeded,
    activeAttempt,
    setActiveAttempt,
    result,
    setResult,
    startAttempt: startMutation.mutateAsync,
    resumeAttempt: resumeMutation.mutate,
    submitResponse: responseMutation.mutateAsync,
    completeAttempt: completeMutation.mutate,
    isStarting: startMutation.isPending,
    isResuming: resumeMutation.isPending,
    isSubmitting: responseMutation.isPending,
    isCompleting: completeMutation.isPending,
    setGuideCompletion: guideCompletionMutation.mutate,
    isUpdatingGuideCompletion: guideCompletionMutation.isPending,
  };
}
