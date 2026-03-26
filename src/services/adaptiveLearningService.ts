/**
 * Adaptive Learning Service
 * Handles skill proficiency tracking, learning path updates, and daily focus recommendations
 */

import { supabase } from '@/lib/supabase';
import { generateAdaptiveLearningPath } from '@/utils/api';

// Types
export interface SkillProficiency {
    id: string;
    user_id: string;
    skill_code: string;
    module: string;
    mastery_probability: number;
    confidence_level: number;
    practice_count: number;
    correct_count: number;
    last_practiced_at: string | null;
    next_review_at: string | null;
    streak_count: number;
}

export interface LearningPathActivity {
    id: string;
    learning_path_id: string;
    user_id: string;
    activity_key: string;
    activity_type: string;
    module: string | null;
    title: string;
    description: string | null;
    skill_targets: string[];
    scheduled_day: string | null;
    scheduled_date: string | null;
    estimated_minutes: number;
    priority: 'high' | 'medium' | 'low';
    is_completed: boolean;
    completed_at: string | null;
    outcome_score: number | null;
    outcome_data: Record<string, unknown> | null;
}

export interface DailyFocus {
    id: string;
    user_id: string;
    focus_date: string;
    primary_activity_id: string | null;
    primary_skill: string | null;
    primary_module: string | null;
    ai_reason: string | null;
    is_completed: boolean;
    completed_at: string | null;
}

export interface WeakSkill {
    skill_code: string;
    module: string;
    mastery_probability: number;
    practice_count: number;
    days_since_practice: number;
    priority_score: number;
}

// Helper to format skill code for display
export function formatSkillCode(skillCode: string): string {
    return skillCode
        .replace(/_/g, ' ')
        .replace(/reading |writing |listening |speaking /gi, '')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Get user's skill proficiencies
export async function getUserSkillProficiencies(userId: string): Promise<SkillProficiency[]> {
    const { data, error } = await supabase
        .from('skill_proficiency')
        .select('*')
        .eq('user_id', userId)
        .order('mastery_probability', { ascending: true });

    if (error) {
        console.warn('Failed to fetch skill proficiencies:', error);
        return [];
    }

    return data || [];
}

// Get user's weakest skills using the RPC function
export async function getWeakSkills(userId: string, limit: number = 5): Promise<WeakSkill[]> {
    try {
        const { data, error } = await supabase.rpc('get_user_weak_skills', {
            p_user_id: userId,
            p_limit: limit
        });

        if (error) {
            console.warn('RPC get_user_weak_skills failed, falling back to direct query:', error);
            // Fallback: direct query
            const skills = await getUserSkillProficiencies(userId);
            return skills.slice(0, limit).map(s => ({
                skill_code: s.skill_code,
                module: s.module,
                mastery_probability: s.mastery_probability,
                practice_count: s.practice_count,
                days_since_practice: s.last_practiced_at
                    ? Math.floor((Date.now() - new Date(s.last_practiced_at).getTime()) / (1000 * 60 * 60 * 24))
                    : 999,
                priority_score: (1 - s.mastery_probability) * 0.6 + 0.4
            }));
        }

        return data || [];
    } catch (err) {
        console.error('Error getting weak skills:', err);
        return [];
    }
}

// Get learning path activities for a user
export async function getLearningPathActivities(
    userId: string,
    options: { completed?: boolean; day?: string; limit?: number } = {}
): Promise<LearningPathActivity[]> {
    let query = supabase
        .from('learning_path_activities')
        .select('*')
        .eq('user_id', userId);

    if (options.completed !== undefined) {
        query = query.eq('is_completed', options.completed);
    }

    if (options.day) {
        query = query.eq('scheduled_day', options.day);
    }

    query = query.order('priority', { ascending: false })
        .order('created_at', { ascending: true });

    if (options.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
        console.warn('Failed to fetch learning path activities:', error);
        return [];
    }

    return data || [];
}

// Mark an activity as completed
export async function completeActivity(
    activityId: string,
    outcomeData?: { score?: number; data?: Record<string, unknown> }
): Promise<boolean> {
    const updateData: Partial<LearningPathActivity> = {
        is_completed: true,
        completed_at: new Date().toISOString(),
    };

    if (outcomeData?.score !== undefined) {
        updateData.outcome_score = outcomeData.score;
    }

    if (outcomeData?.data) {
        updateData.outcome_data = outcomeData.data;
    }

    const { error } = await supabase
        .from('learning_path_activities')
        .update(updateData)
        .eq('id', activityId);

    if (error) {
        console.error('Failed to complete activity:', error);
        return false;
    }

    return true;
}

// Get or create today's focus
export async function getTodaysFocus(userId: string): Promise<DailyFocus | null> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('daily_focus')
        .select('*')
        .eq('user_id', userId)
        .eq('focus_date', today)
        .maybeSingle();

    if (error) {
        console.warn('Failed to fetch daily focus:', error);
        return null;
    }

    return data;
}

// Create daily focus based on weak skills and pending activities
export async function createTodaysFocus(userId: string): Promise<DailyFocus | null> {
    const today = new Date().toISOString().split('T')[0];
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayDay = dayNames[new Date().getDay()];

    // Get today's pending activities
    const activities = await getLearningPathActivities(userId, {
        completed: false,
        day: todayDay,
        limit: 1
    });

    // Get weakest skill
    const weakSkills = await getWeakSkills(userId, 1);

    const focusData: Partial<DailyFocus> = {
        user_id: userId,
        focus_date: today,
        is_completed: false,
    };

    if (activities.length > 0) {
        focusData.primary_activity_id = activities[0].id;
        focusData.primary_module = activities[0].module;
        focusData.ai_reason = `Scheduled activity: ${activities[0].title}`;
    } else if (weakSkills.length > 0) {
        focusData.primary_skill = weakSkills[0].skill_code;
        focusData.primary_module = weakSkills[0].module;
        focusData.ai_reason = `Your ${formatSkillCode(weakSkills[0].skill_code)} needs practice (${Math.round(weakSkills[0].mastery_probability * 100)}% mastery)`;
    }

    // Atomic upsert — leverages UNIQUE(user_id, focus_date) constraint
    // If a row already exists for today, ignoreDuplicates returns it without overwriting
    const { data, error } = await supabase
        .from('daily_focus')
        .upsert(focusData, { onConflict: 'user_id,focus_date', ignoreDuplicates: true })
        .select()
        .single();

    if (error) {
        console.warn('Failed to create daily focus:', error);
        // Fallback: if upsert had a conflict, fetch the existing row
        return await getTodaysFocus(userId);
    }

    return data;
}

// Update learning path after test completion
export async function refreshLearningPathAfterTest(
    userId: string,
    testType: string,
    testScore: number
): Promise<void> {
    try {
        // Check if learning path is stale (older than 24 hours or score changed significantly)
        const { data: user } = await supabase
            .from('users')
            .select('last_path_generated_at, subscription_tier')
            .eq('id', userId)
            .single();

        if (!user) return;

        // Only auto-refresh for pro/premium users
        if (user.subscription_tier !== 'pro' && user.subscription_tier !== 'premium') {
            return;
        }

        const lastGenerated = user.last_path_generated_at
            ? new Date(user.last_path_generated_at)
            : null;

        const hoursSinceLastGeneration = lastGenerated
            ? (Date.now() - lastGenerated.getTime()) / (1000 * 60 * 60)
            : Infinity;

        // Check for significant score change (compare to previous average for this module)
        let significantScoreChange = false;
        if (testScore > 0) {
            const { data: prevSessions } = await supabase
                .from('test_sessions')
                .select('score')
                .eq('user_id', userId)
                .eq('test_type', testType)
                .eq('is_completed', true)
                .order('completed_at', { ascending: false })
                .limit(5);

            if (prevSessions && prevSessions.length >= 2) {
                // Calculate previous average (excluding current test)
                const prevScores = prevSessions.slice(1).map(s => s.score).filter(s => s > 0);
                if (prevScores.length > 0) {
                    const prevAvg = prevScores.reduce((a, b) => a + b, 0) / prevScores.length;
                    const scoreDiff = Math.abs(testScore - prevAvg);
                    // Trigger if score changed by more than 0.8 band
                    significantScoreChange = scoreDiff >= 0.8;
                }
            }
        }

        // Refresh if path is older than 24 hours, never generated, or significant score change
        if (hoursSinceLastGeneration >= 24 || significantScoreChange) {
            const reason = significantScoreChange
                ? 'significant score change'
                : 'path older than 24 hours';
            console.log(`[AdaptiveLearning] Refreshing learning path after test completion (${reason})`);

            // Fire and forget - don't block the submission
            generateAdaptiveLearningPath().catch(err => {
                // 403 = free tier, expected — skip silently
                if (err?.status !== 403) console.warn('Background learning path refresh failed:', err?.message || err);
            });

            // Update last generated timestamp
            await supabase
                .from('users')
                .update({ last_path_generated_at: new Date().toISOString() })
                .eq('id', userId);
        }
    } catch (err) {
        console.warn('Error in refreshLearningPathAfterTest:', err);
    }
}

// Calculate days until exam
export function calculateDaysUntilExam(testDate: string | null): number | null {
    if (!testDate) return null;

    const examDate = new Date(testDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    examDate.setHours(0, 0, 0, 0);

    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

// Get study intensity recommendation based on days until exam
export function getStudyIntensity(daysUntilExam: number | null): {
    level: 'urgent' | 'focused' | 'balanced' | 'relaxed';
    message: string;
    hoursPerDay: number;
} {
    if (daysUntilExam === null || daysUntilExam < 0) {
        return { level: 'balanced', message: 'Set your exam date for personalized pacing', hoursPerDay: 1.5 };
    }

    if (daysUntilExam <= 7) {
        return { level: 'urgent', message: 'Final week! Focus on review and simulation tests', hoursPerDay: 3 };
    }

    if (daysUntilExam <= 14) {
        return { level: 'focused', message: 'Two weeks left. Intensify practice on weak areas', hoursPerDay: 2.5 };
    }

    if (daysUntilExam <= 30) {
        return { level: 'focused', message: 'One month to go. Maintain consistent daily practice', hoursPerDay: 2 };
    }

    return { level: 'relaxed', message: 'Build strong foundations with varied practice', hoursPerDay: 1.5 };
}

// Parse and store activities from learning path data
export async function syncActivitiesFromLearningPath(
    userId: string,
    learningPathId: string,
    pathData: Record<string, unknown>
): Promise<void> {
    const weeklySchedule = pathData.weekly_schedule as Record<string, unknown[]> | undefined;
    if (!weeklySchedule) return;

    const activities: Partial<LearningPathActivity>[] = [];

    for (const [day, dayActivities] of Object.entries(weeklySchedule)) {
        if (!Array.isArray(dayActivities)) continue;

        dayActivities.forEach((activity, idx) => {
            const activityObj = typeof activity === 'string'
                ? { title: activity }
                : activity as Record<string, unknown>;

            activities.push({
                learning_path_id: learningPathId,
                user_id: userId,
                activity_key: `${day}_${idx}`,
                activity_type: (activityObj.activity_type as string) || 'practice',
                module: (activityObj.module as string) || null,
                title: (activityObj.title as string) || (activityObj.activity as string) || String(activity),
                description: (activityObj.description as string) || null,
                skill_targets: (activityObj.skill_targets as string[]) || [],
                scheduled_day: day,
                estimated_minutes: (activityObj.estimated_time as number) || 30,
                priority: (activityObj.priority as 'high' | 'medium' | 'low') || 'medium',
                is_completed: false,
            });
        });
    }

    if (activities.length === 0) return;

    // Insert activities (using insert instead of upsert since each learning path has a unique ID)
    // If there's a conflict, it will be caught and logged
    const { error } = await supabase
        .from('learning_path_activities')
        .insert(activities);

    if (error) {
        console.warn('Failed to sync learning path activities:', error);
    }
}

// Get completion stats for the current learning path
export async function getLearningPathProgress(userId: string): Promise<{
    total: number;
    completed: number;
    percentage: number;
    todayCompleted: number;
    todayTotal: number;
    recentConsistency: number[];
}> {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayDay = dayNames[new Date().getDay()];

    const { data: allActivities, error } = await supabase
        .from('learning_path_activities')
        .select('is_completed, scheduled_day, completed_at')
        .eq('user_id', userId);

    if (error || !allActivities) {
        return { total: 0, completed: 0, percentage: 0, todayCompleted: 0, todayTotal: 0, recentConsistency: [0, 0, 0, 0, 0] };
    }

    const total = allActivities.length;
    const completed = allActivities.filter(a => a.is_completed).length;

    // Today stats
    const todayActivities = allActivities.filter(a => a.scheduled_day === todayDay);
    const todayTotal = todayActivities.length;
    const todayCompleted = todayActivities.filter(a => a.is_completed).length;

    // Calculate Consistency (Last 5 days)
    const recentConsistency = [0, 0, 0, 0, 0]; // [Day-4, Day-3, Day-2, Yesterday, Today]
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Group completions by date
    allActivities.forEach(activity => {
        if (activity.is_completed && activity.completed_at) {
            const completedDate = new Date(activity.completed_at);
            completedDate.setHours(0, 0, 0, 0);

            const diffTime = today.getTime() - completedDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays < 5) {
                // Map diffDays to index: 0->4 (Today), 1->3 (Yest), etc.
                const index = 4 - diffDays;
                if (index >= 0 && index < 5) {
                    recentConsistency[index] = 1;
                }
            }
        }
    });

    return {
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        todayCompleted,
        todayTotal,
        recentConsistency
    };
}
