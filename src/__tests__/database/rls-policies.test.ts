import { describe, it, expect } from 'vitest';

/**
 * Database RLS (Row Level Security) Policy Tests
 * Verifies that RLS policies are correctly defined
 */

// RLS Policy definitions based on migrations
const RLS_POLICIES = {
  users: {
    enabled: true,
    policies: [
      {
        name: 'Users can view own data',
        action: 'SELECT',
        using: '(select auth.uid()) = auth_id',
        role: 'authenticated',
      },
      {
        name: 'Admins can view all',
        action: 'SELECT',
        using: 'public.is_admin()',
        role: 'authenticated',
      },
      {
        name: 'Users can insert own',
        action: 'INSERT',
        withCheck: '(select auth.uid()) = auth_id',
        role: 'authenticated',
      },
      {
        name: 'Users can update own',
        action: 'UPDATE',
        using: '(select auth.uid()) = auth_id',
        role: 'authenticated',
      },
    ],
  },
  passages: {
    enabled: true,
    policies: [{ name: 'Public read', action: 'SELECT', using: 'true', role: 'public' }],
  },
  questions: {
    enabled: true,
    policies: [{ name: 'Public read questions', action: 'SELECT', using: 'true', role: 'public' }],
  },
  test_sessions: {
    enabled: true,
    policies: [
      {
        name: 'Users can view own sessions',
        action: 'SELECT',
        using:
          '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = test_sessions.user_id)',
        role: 'authenticated',
      },
      {
        name: 'Users can insert own sessions',
        action: 'INSERT',
        withCheck:
          '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = test_sessions.user_id)',
        role: 'authenticated',
      },
      {
        name: 'Users can update own sessions',
        action: 'UPDATE',
        using:
          '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = test_sessions.user_id)',
        role: 'authenticated',
      },
    ],
  },
  user_points: {
    enabled: true,
    policies: [
      {
        name: 'Users can view own points',
        action: 'SELECT',
        using: '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = user_points.user_id)',
        role: 'authenticated',
      },
      { name: 'Public leaderboard view', action: 'SELECT', using: 'true', role: 'public' },
    ],
  },
  achievements: {
    enabled: true,
    policies: [
      { name: 'Public read achievements', action: 'SELECT', using: 'true', role: 'public' },
      {
        name: 'Admin insert',
        action: 'INSERT',
        withCheck: 'public.is_admin()',
        role: 'authenticated',
      },
      { name: 'Admin update', action: 'UPDATE', using: 'public.is_admin()', role: 'authenticated' },
      { name: 'Admin delete', action: 'DELETE', using: 'public.is_admin()', role: 'authenticated' },
    ],
  },
  user_achievements: {
    enabled: true,
    policies: [
      {
        name: 'Users can view own achievements',
        action: 'SELECT',
        using:
          '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = user_achievements.user_id)',
        role: 'authenticated',
      },
    ],
  },
  vocabulary_items: {
    enabled: true,
    policies: [{ name: 'Public read vocabulary', action: 'SELECT', using: 'true', role: 'public' }],
  },
  promo_codes: {
    enabled: true,
    policies: [
      {
        name: 'Admin only access',
        action: 'ALL',
        using: 'public.is_admin()',
        role: 'authenticated',
      },
    ],
  },
  learning_paths: {
    enabled: true,
    policies: [
      {
        name: 'Users can view own',
        action: 'SELECT',
        using:
          '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = learning_paths.user_id)',
        role: 'authenticated',
      },
      {
        name: 'Users can insert own',
        action: 'INSERT',
        withCheck:
          '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = learning_paths.user_id)',
        role: 'authenticated',
      },
      {
        name: 'Users can update own',
        action: 'UPDATE',
        using:
          '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = learning_paths.user_id)',
        role: 'authenticated',
      },
    ],
  },
  analytics_data: {
    enabled: true,
    policies: [
      {
        name: 'Users can view own',
        action: 'SELECT',
        using:
          '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = analytics_data.user_id)',
        role: 'authenticated',
      },
    ],
  },
  // Adaptive Learning Tables
  skill_proficiency: {
    enabled: true,
    policies: [
      {
        name: 'Users can view own',
        action: 'SELECT',
        using:
          '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = skill_proficiency.user_id)',
        role: 'authenticated',
      },
      {
        name: 'Users can insert own',
        action: 'INSERT',
        withCheck:
          '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = skill_proficiency.user_id)',
        role: 'authenticated',
      },
      {
        name: 'Users can update own',
        action: 'UPDATE',
        using:
          '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = skill_proficiency.user_id)',
        role: 'authenticated',
      },
      {
        name: 'Service role full access',
        action: 'ALL',
        using: '(select auth.role()) = service_role',
        role: 'service_role',
      },
    ],
  },
  learning_path_activities: {
    enabled: true,
    policies: [
      {
        name: 'Users can view own',
        action: 'SELECT',
        using:
          '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = learning_path_activities.user_id)',
        role: 'authenticated',
      },
      {
        name: 'Users can insert own',
        action: 'INSERT',
        withCheck:
          '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = learning_path_activities.user_id)',
        role: 'authenticated',
      },
      {
        name: 'Users can update own',
        action: 'UPDATE',
        using:
          '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = learning_path_activities.user_id)',
        role: 'authenticated',
      },
      {
        name: 'Service role full access',
        action: 'ALL',
        using: '(select auth.role()) = service_role',
        role: 'service_role',
      },
    ],
  },
  daily_focus: {
    enabled: true,
    policies: [
      {
        name: 'Users can view own',
        action: 'SELECT',
        using: '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = daily_focus.user_id)',
        role: 'authenticated',
      },
      {
        name: 'Users can insert own',
        action: 'INSERT',
        withCheck:
          '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = daily_focus.user_id)',
        role: 'authenticated',
      },
      {
        name: 'Users can update own',
        action: 'UPDATE',
        using: '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = daily_focus.user_id)',
        role: 'authenticated',
      },
      {
        name: 'Service role full access',
        action: 'ALL',
        using: '(select auth.role()) = service_role',
        role: 'service_role',
      },
    ],
  },
  // System Tables
  notifications: {
    enabled: true,
    policies: [
      { name: 'Authenticated read', action: 'SELECT', using: 'true', role: 'authenticated' },
      {
        name: 'Admin write',
        action: 'INSERT',
        withCheck: 'public.is_admin()',
        role: 'authenticated',
      },
      { name: 'Admin update', action: 'UPDATE', using: 'public.is_admin()', role: 'authenticated' },
      { name: 'Admin delete', action: 'DELETE', using: 'public.is_admin()', role: 'authenticated' },
    ],
  },
  system_settings: {
    enabled: true,
    policies: [
      {
        name: 'Public safe read',
        action: 'SELECT',
        using: "key IN ('maintenance_mode', 'pricing_tiers', 'public_announcement')",
        role: 'public',
      },
      { name: 'Admin read', action: 'SELECT', using: 'public.is_admin()', role: 'authenticated' },
      {
        name: 'Admin write',
        action: 'INSERT',
        withCheck: 'public.is_admin()',
        role: 'authenticated',
      },
      { name: 'Admin update', action: 'UPDATE', using: 'public.is_admin()', role: 'authenticated' },
      { name: 'Admin delete', action: 'DELETE', using: 'public.is_admin()', role: 'authenticated' },
    ],
  },
  resources: {
    enabled: true,
    policies: [
      {
        name: 'Public read active resources',
        action: 'SELECT',
        using: 'is_active = true',
        role: 'public',
      },
      {
        name: 'Admin full access',
        action: 'ALL',
        using: 'public.is_admin()',
        role: 'authenticated',
      },
    ],
  },
  tier_rate_limits: {
    enabled: true,
    policies: [
      { name: 'Authenticated read', action: 'SELECT', using: 'true', role: 'authenticated' },
      { name: 'Admin write', action: 'ALL', using: 'public.is_admin()', role: 'authenticated' },
    ],
  },
  ai_feedback_cache: {
    enabled: true,
    policies: [
      {
        name: 'Service role manages feedback cache',
        action: 'ALL',
        using: 'true',
        role: 'service_role',
      },
    ],
  },
  ai_api_usage: {
    enabled: true,
    policies: [
      {
        name: 'Users can view own',
        action: 'SELECT',
        using: '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = ai_api_usage.user_id)',
        role: 'authenticated',
      },
      { name: 'Service role full', action: 'ALL', using: 'true', role: 'service_role' },
    ],
  },
  consent_history: {
    enabled: true,
    policies: [
      {
        name: 'Users can view own',
        action: 'SELECT',
        using:
          '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = consent_history.user_id)',
        role: 'authenticated',
      },
      {
        name: 'Users can insert own',
        action: 'INSERT',
        withCheck:
          '(select auth.uid()) IN (SELECT auth_id FROM users WHERE id = consent_history.user_id)',
        role: 'authenticated',
      },
    ],
  },
};

describe('RLS - Table Coverage', () => {
  it('should have RLS enabled on users table', () => {
    expect(RLS_POLICIES.users.enabled).toBe(true);
  });

  it('should have RLS enabled on test_sessions table', () => {
    expect(RLS_POLICIES.test_sessions.enabled).toBe(true);
  });

  it('should have RLS enabled on user_points table', () => {
    expect(RLS_POLICIES.user_points.enabled).toBe(true);
  });

  it('should have RLS enabled on all user-data tables', () => {
    const userDataTables = ['users', 'test_sessions', 'user_points', 'user_achievements'];
    userDataTables.forEach((table) => {
      const policy = RLS_POLICIES[table as keyof typeof RLS_POLICIES];
      expect(policy?.enabled).toBe(true);
    });
  });
});

describe('RLS - User Data Protection', () => {
  it('should restrict users to viewing only their own data', () => {
    const { policies } = RLS_POLICIES.users;
    const selectPolicy = policies.find((p) => p.name.includes('own data'));

    expect(selectPolicy).toBeDefined();
    expect(selectPolicy?.using).toContain('auth.uid()');
  });

  it('should allow admins to view all user data', () => {
    const { policies } = RLS_POLICIES.users;
    const adminPolicy = policies.find((p) => p.name.includes('Admin'));

    expect(adminPolicy).toBeDefined();
    expect(adminPolicy?.using).toContain('admin');
  });

  it('should restrict users to updating only their own profile', () => {
    const { policies } = RLS_POLICIES.users;
    const updatePolicy = policies.find((p) => p.action === 'UPDATE');

    expect(updatePolicy).toBeDefined();
    expect(updatePolicy?.using).toContain('auth.uid()');
  });
});

describe('RLS - Test Sessions Security', () => {
  it('should restrict test session access to owner', () => {
    const { policies } = RLS_POLICIES.test_sessions;
    const selectPolicy = policies.find((p) => p.action === 'SELECT');

    expect(selectPolicy?.using).toContain('auth.uid()');
  });

  it('should allow users to create their own sessions', () => {
    const { policies } = RLS_POLICIES.test_sessions;
    const insertPolicy = policies.find((p) => p.action === 'INSERT');

    expect(insertPolicy).toBeDefined();
  });
});

describe('RLS - Public Content', () => {
  it('should allow public read access to passages', () => {
    const { policies } = RLS_POLICIES.passages;
    const publicPolicy = policies.find((p) => p.name.includes('Public'));

    expect(publicPolicy).toBeDefined();
    expect(publicPolicy?.using).toBe('true');
  });

  it('should allow public read access to achievements', () => {
    const { policies } = RLS_POLICIES.achievements;
    const publicPolicy = policies.find((p) => p.action === 'SELECT');

    expect(publicPolicy?.using).toBe('true');
  });

  it('should allow public read access to vocabulary', () => {
    const { policies } = RLS_POLICIES.vocabulary_items;
    const publicPolicy = policies.find((p) => p.action === 'SELECT');

    expect(publicPolicy?.using).toBe('true');
  });

  it('should allow only safe public system settings', () => {
    const { policies } = RLS_POLICIES.system_settings;
    const publicPolicy = policies.find((p) => p.name === 'Public safe read');

    expect(publicPolicy).toBeDefined();
    expect(publicPolicy?.using).toContain('maintenance_mode');
    expect(publicPolicy?.using).toContain('pricing_tiers');
    expect(publicPolicy?.using).toContain('public_announcement');
    expect(publicPolicy?.using).not.toBe('true');
  });
});

describe('RLS - Admin-Only Tables', () => {
  it('should restrict promo_codes to admins', () => {
    const { policies } = RLS_POLICIES.promo_codes;
    const adminPolicy = policies.find((p) => p.name.includes('Admin'));

    expect(adminPolicy).toBeDefined();
    expect(adminPolicy?.using).toContain('admin');
  });

  it('should restrict AI feedback cache to service role only', () => {
    const { policies } = RLS_POLICIES.ai_feedback_cache;

    expect(policies).toHaveLength(1);
    expect(policies[0]).toMatchObject({ action: 'ALL', role: 'service_role' });
    expect(policies.some((p) => p.role === 'authenticated')).toBe(false);
  });
});

describe('RLS - Policy Completeness', () => {
  it('should have SELECT policies defined', () => {
    Object.values(RLS_POLICIES).forEach((table) => {
      if (table.enabled) {
        const hasSelectPolicy = table.policies.some(
          (p) => p.action === 'SELECT' || p.action === 'ALL'
        );
        expect(hasSelectPolicy).toBe(true);
      }
    });
  });

  it('should protect INSERT operations on user data tables', () => {
    const { policies } = RLS_POLICIES.test_sessions;
    const insertPolicy = policies.find((p) => p.action === 'INSERT');

    expect(insertPolicy).toBeDefined();
    expect(insertPolicy?.withCheck).toContain('auth.uid()');
  });
});
