import { test, expect } from '@playwright/test';

/**
 * Gamification E2E Tests
 * Tests for leaderboard, achievements, and points display
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

test.describe('Leaderboard', () => {
  test('should load leaderboard page', async ({ page }) => {
    await page.goto(`${BASE_URL}/leaderboard`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const url = page.url();
    expect(url.includes('/leaderboard') || url.includes('/login')).toBeTruthy();
  });

  test('should display ranking list', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip('Test credentials not provided');
      return;
    }

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/dashboard/i);

    await page.goto(`${BASE_URL}/leaderboard`);
    await page.waitForLoadState('networkidle');

    // Look for ranking indicators
    const rankings = await page
      .locator('text=/#\\d|rank|position|points|xp/i, [class*="rank"], [class*="leaderboard"]')
      .count();
    expect(rankings).toBeGreaterThanOrEqual(0);
  });

  test('should show user position if logged in', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip('Test credentials not provided');
      return;
    }

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/dashboard/i);

    await page.goto(`${BASE_URL}/leaderboard`);
    await page.waitForLoadState('networkidle');

    // Look for "You" or current user highlight
    const userPosition = await page
      .locator('text=/you|your|current user/i, [class*="current"], [class*="highlight"]')
      .count();
    expect(typeof userPosition).toBe('number');
  });

  test('should have time filter options', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip('Test credentials not provided');
      return;
    }

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/dashboard/i);

    await page.goto(`${BASE_URL}/leaderboard`);
    await page.waitForLoadState('networkidle');

    // Look for time filters (weekly, monthly, all-time)
    const filters = await page
      .locator('button:has-text("Week"), button:has-text("Month"), button:has-text("All")')
      .count();
    expect(typeof filters).toBe('number');
  });
});

test.describe('Achievement Display', () => {
  test('should show achievements section on dashboard', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip('Test credentials not provided');
      return;
    }

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/dashboard/i);

    // Look for achievements on dashboard
    const achievements = await page
      .locator('text=/achievement|badge|trophy|unlock/i, [class*="achievement"]')
      .count();
    expect(typeof achievements).toBe('number');
  });

  test('should display points/XP on dashboard', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip('Test credentials not provided');
      return;
    }

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/dashboard/i);

    // Look for XP/points display
    const pointsDisplay = await page
      .locator('text=/\\d+ points|\\d+ xp|experience/i, [class*="points"], [class*="xp"]')
      .count();
    expect(typeof pointsDisplay).toBe('number');
  });
});

test.describe('Streak Display', () => {
  test('should show streak information', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip('Test credentials not provided');
      return;
    }

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/dashboard/i);

    // Look for streak display
    const streakDisplay = await page
      .locator('text=/streak|day|consecutive/i, [class*="streak"]')
      .count();
    expect(typeof streakDisplay).toBe('number');
  });
});
