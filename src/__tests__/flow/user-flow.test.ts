import { describe, it, expect } from 'vitest';

/**
 * User Flow Logic Tests
 * Tests for user journey, onboarding, and feature access
 */

describe('User Flow - Onboarding Steps', () => {
    interface OnboardingState {
        currentStep: number;
        totalSteps: number;
        completedSteps: Set<number>;
        data: Record<string, any>;
    }

    const canProceedToStep = (state: OnboardingState, targetStep: number): boolean => {
        // Can only proceed if all previous steps are completed
        for (let i = 1; i < targetStep; i++) {
            if (!state.completedSteps.has(i)) {
                return false;
            }
        }
        return targetStep <= state.totalSteps;
    };

    const isOnboardingComplete = (state: OnboardingState): boolean => {
        return state.completedSteps.size >= state.totalSteps;
    };

    it('should allow proceeding to next step when current is complete', () => {
        const state: OnboardingState = {
            currentStep: 1,
            totalSteps: 4,
            completedSteps: new Set([1]),
            data: {}
        };
        expect(canProceedToStep(state, 2)).toBe(true);
    });

    it('should block skipping steps', () => {
        const state: OnboardingState = {
            currentStep: 1,
            totalSteps: 4,
            completedSteps: new Set([1]),
            data: {}
        };
        expect(canProceedToStep(state, 3)).toBe(false);
    });

    it('should detect onboarding completion', () => {
        const incompleteState: OnboardingState = {
            currentStep: 2,
            totalSteps: 4,
            completedSteps: new Set([1, 2]),
            data: {}
        };
        expect(isOnboardingComplete(incompleteState)).toBe(false);

        const completeState: OnboardingState = {
            currentStep: 4,
            totalSteps: 4,
            completedSteps: new Set([1, 2, 3, 4]),
            data: {}
        };
        expect(isOnboardingComplete(completeState)).toBe(true);
    });
});

describe('User Flow - Feature Access', () => {
    type SubscriptionTier = 'free' | 'basic' | 'pro' | 'premium';

    interface FeatureAccess {
        reading: SubscriptionTier[];
        writing: SubscriptionTier[];
        listening: SubscriptionTier[];
        speaking: SubscriptionTier[];
        aiAnalytics: SubscriptionTier[];
        unlimitedTests: SubscriptionTier[];
    }

    const FEATURE_ACCESS: FeatureAccess = {
        reading: ['free', 'basic', 'pro', 'premium'],
        writing: ['free', 'basic', 'pro', 'premium'],
        listening: ['free', 'basic', 'pro', 'premium'],
        speaking: ['pro', 'premium'],
        aiAnalytics: ['pro', 'premium'],
        unlimitedTests: ['premium'],
    };

    const hasFeatureAccess = (
        feature: keyof FeatureAccess,
        userTier: SubscriptionTier
    ): boolean => {
        return FEATURE_ACCESS[feature].includes(userTier);
    };

    it('should grant free users access to basic tests', () => {
        expect(hasFeatureAccess('reading', 'free')).toBe(true);
        expect(hasFeatureAccess('writing', 'free')).toBe(true);
        expect(hasFeatureAccess('listening', 'free')).toBe(true);
    });

    it('should restrict speaking tests to pro users', () => {
        expect(hasFeatureAccess('speaking', 'free')).toBe(false);
        expect(hasFeatureAccess('speaking', 'basic')).toBe(false);
        expect(hasFeatureAccess('speaking', 'pro')).toBe(true);
    });

    it('should restrict AI analytics to pro+ users', () => {
        expect(hasFeatureAccess('aiAnalytics', 'free')).toBe(false);
        expect(hasFeatureAccess('aiAnalytics', 'pro')).toBe(true);
        expect(hasFeatureAccess('aiAnalytics', 'premium')).toBe(true);
    });

    it('should grant premium users all features', () => {
        expect(hasFeatureAccess('reading', 'premium')).toBe(true);
        expect(hasFeatureAccess('speaking', 'premium')).toBe(true);
        expect(hasFeatureAccess('aiAnalytics', 'premium')).toBe(true);
        expect(hasFeatureAccess('unlimitedTests', 'premium')).toBe(true);
    });
});

describe('User Flow - Rate Limiting', () => {
    interface RateLimitState {
        testsToday: number;
        lastTestTime: number;
        subscriptionTier: string;
    }

    const DAILY_LIMITS: Record<string, number> = {
        free: 3,
        basic: 10,
        pro: 50,
        premium: -1, // unlimited
    };

    const canTakeTest = (state: RateLimitState): { allowed: boolean; reason?: string } => {
        const limit = DAILY_LIMITS[state.subscriptionTier] || 3;

        if (limit === -1) {
            return { allowed: true };
        }

        if (state.testsToday >= limit) {
            return { allowed: false, reason: `Daily limit of ${limit} tests reached` };
        }

        return { allowed: true };
    };

    it('should allow tests within daily limit', () => {
        const state: RateLimitState = { testsToday: 2, lastTestTime: Date.now(), subscriptionTier: 'free' };
        expect(canTakeTest(state).allowed).toBe(true);
    });

    it('should block tests when limit reached', () => {
        const state: RateLimitState = { testsToday: 3, lastTestTime: Date.now(), subscriptionTier: 'free' };
        const result = canTakeTest(state);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('3');
    });

    it('should allow unlimited tests for premium', () => {
        const state: RateLimitState = { testsToday: 100, lastTestTime: Date.now(), subscriptionTier: 'premium' };
        expect(canTakeTest(state).allowed).toBe(true);
    });
});

describe('User Flow - Navigation Guards', () => {
    interface NavigationContext {
        isAuthenticated: boolean;
        isAdmin: boolean;
        hasCompletedOnboarding: boolean;
        subscriptionTier: string;
    }

    type RouteGuard = (ctx: NavigationContext) => { allowed: boolean; redirect?: string };

    const protectedRoute: RouteGuard = (ctx) => {
        if (!ctx.isAuthenticated) {
            return { allowed: false, redirect: '/login' };
        }
        return { allowed: true };
    };

    const adminRoute: RouteGuard = (ctx) => {
        if (!ctx.isAuthenticated) {
            return { allowed: false, redirect: '/login' };
        }
        if (!ctx.isAdmin) {
            return { allowed: false, redirect: '/dashboard' };
        }
        return { allowed: true };
    };

    const onboardingGuard: RouteGuard = (ctx) => {
        if (!ctx.isAuthenticated) {
            return { allowed: false, redirect: '/login' };
        }
        if (!ctx.hasCompletedOnboarding) {
            return { allowed: false, redirect: '/onboarding' };
        }
        return { allowed: true };
    };

    it('should redirect unauthenticated users to login', () => {
        const ctx: NavigationContext = {
            isAuthenticated: false,
            isAdmin: false,
            hasCompletedOnboarding: false,
            subscriptionTier: 'free'
        };
        const result = protectedRoute(ctx);
        expect(result.allowed).toBe(false);
        expect(result.redirect).toBe('/login');
    });

    it('should allow authenticated users to access protected routes', () => {
        const ctx: NavigationContext = {
            isAuthenticated: true,
            isAdmin: false,
            hasCompletedOnboarding: true,
            subscriptionTier: 'free'
        };
        expect(protectedRoute(ctx).allowed).toBe(true);
    });

    it('should redirect non-admins from admin routes', () => {
        const ctx: NavigationContext = {
            isAuthenticated: true,
            isAdmin: false,
            hasCompletedOnboarding: true,
            subscriptionTier: 'free'
        };
        const result = adminRoute(ctx);
        expect(result.allowed).toBe(false);
        expect(result.redirect).toBe('/dashboard');
    });

    it('should redirect to onboarding if not completed', () => {
        const ctx: NavigationContext = {
            isAuthenticated: true,
            isAdmin: false,
            hasCompletedOnboarding: false,
            subscriptionTier: 'free'
        };
        const result = onboardingGuard(ctx);
        expect(result.allowed).toBe(false);
        expect(result.redirect).toBe('/onboarding');
    });
});

describe('User Flow - Study Streak', () => {
    interface StreakState {
        currentStreak: number;
        longestStreak: number;
        lastActivityDate: string | null;
    }

    const calculateNewStreak = (state: StreakState, today: string): number => {
        if (!state.lastActivityDate) {
            return 1; // First activity
        }

        const lastDate = new Date(state.lastActivityDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor(
            (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) {
            return state.currentStreak; // Same day, no change
        } else if (diffDays === 1) {
            return state.currentStreak + 1; // Consecutive day
        } else {
            return 1; // Streak broken
        }
    };

    it('should start streak at 1 for first activity', () => {
        const state: StreakState = { currentStreak: 0, longestStreak: 0, lastActivityDate: null };
        expect(calculateNewStreak(state, '2024-01-15')).toBe(1);
    });

    it('should increment streak for consecutive days', () => {
        const state: StreakState = { currentStreak: 5, longestStreak: 5, lastActivityDate: '2024-01-14' };
        expect(calculateNewStreak(state, '2024-01-15')).toBe(6);
    });

    it('should maintain streak for same day activity', () => {
        const state: StreakState = { currentStreak: 5, longestStreak: 5, lastActivityDate: '2024-01-15' };
        expect(calculateNewStreak(state, '2024-01-15')).toBe(5);
    });

    it('should reset streak after missed day', () => {
        const state: StreakState = { currentStreak: 5, longestStreak: 5, lastActivityDate: '2024-01-13' };
        expect(calculateNewStreak(state, '2024-01-15')).toBe(1);
    });
});
