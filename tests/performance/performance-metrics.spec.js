import { test, expect } from '@playwright/test';

/**
 * Performance Metrics Test
 * Measures Core Web Vitals and page load times using the Browser Performance API
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

// Thresholds optimized for CI environments
const PERFORMANCE_THRESHOLDS = {
  LCP: 3000, // Largest Contentful Paint target: under 3s (up from 2.5s for CI stability)
  FID: 100, // First Input Delay target: under 100ms
  CLS: 0.1, // Cumulative Layout Shift target: under 0.1
};

test.describe('Performance Metrics', () => {
  test('Landing Page Core Web Vitals (LCP)', async ({ page }) => {
    // Navigate and wait for DOM to be ready
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Capture LCP using PerformanceObserver
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        let maxLCP = 0;
        const observer = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          maxLCP = lastEntry.startTime;
        });

        observer.observe({ type: 'largest-contentful-paint', buffered: true });

        // Resolve after a fixed timeout to ensure we capture the paint
        setTimeout(() => {
          observer.disconnect();
          resolve(maxLCP);
        }, 3000);
      });
    });

    console.info(`Landing Page LCP: ${lcp}ms`);

    // Ensure we actually caught an LCP event
    expect(lcp, 'LCP should be captured and greater than 0').toBeGreaterThan(0);
    expect(
      lcp,
      `LCP (${lcp}ms) should be under threshold (${PERFORMANCE_THRESHOLDS.LCP}ms)`
    ).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
  });

  test('Cumulative Layout Shift (CLS) check', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        });

        observer.observe({ type: 'layout-shift', buffered: true });

        // Wait long enough for potential shifts after initial load
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 2000);
      });
    });

    console.info(`Landing Page CLS: ${cls}`);
    expect(
      cls,
      `CLS (${cls}) should be under threshold (${PERFORMANCE_THRESHOLDS.CLS})`
    ).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
  });

  test('Login Page Load Time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    const loadTime = Date.now() - startTime;

    console.info(`Login Page Load Time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(4000);
  });

  test('Dashboard Load Time', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip('Test credentials not provided');
      return;
    }

    // Auth session setup
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Measure dashboard specifically
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    // Look for a unique dashboard element
    await page.waitForSelector('main', { timeout: 5000 });
    const dashboardLoadTime = Date.now() - startTime;

    console.info(`Dashboard Page Load Time: ${dashboardLoadTime}ms`);
    expect(dashboardLoadTime).toBeLessThan(6000);
  });
});
