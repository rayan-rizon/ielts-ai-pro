import { test, expect } from '@playwright/test';

/**
 * Performance Metrics Test
 * Measures Core Web Vitals and page load times using the Browser Performance API
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

const PERFORMANCE_THRESHOLDS = {
  LCP: 2500, // Largest Contentful Paint should be under 2.5s
  FID: 100, // First Input Delay should be under 100ms
  CLS: 0.1, // Cumulative Layout Shift should be under 0.1
};

test.describe('Performance Metrics', () => {
  test('Landing Page Core Web Vitals', async ({ page }) => {
    await page.goto(BASE_URL);

    // Give it a moment to stabilize
    await page.waitForLoadState('networkidle');

    // Get Largest Contentful Paint
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // Timeout if no LCP entry found
        setTimeout(() => resolve(0), 5000);
      });
    });

    console.log(`Landing Page LCP: ${lcp}ms`);
    if (lcp > 0) {
      expect(lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
    }
  });

  test('Login Page Performance', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]');
    const loadTime = Date.now() - startTime;

    console.log(`Login Page Load Time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('Dashboard Load Time', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip('Test credentials not provided');
      return;
    }

    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);

    // Measure dashboard specifically
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    const dashboardLoadTime = Date.now() - startTime;

    console.log(`Dashboard Page Load Time: ${dashboardLoadTime}ms`);
    expect(dashboardLoadTime).toBeLessThan(5000);
  });

  test('Cumulative Layout Shift (CLS) check', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const cls = await page.evaluate(() => {
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });

      return new Promise((resolve) => {
        setTimeout(() => resolve(clsValue), 2000);
      });
    });

    console.log(`Landing Page CLS: ${cls}`);
    expect(cls).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
  });
});
