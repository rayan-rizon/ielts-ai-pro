import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { createHtmlReport } from 'axe-html-reporter';
import fs from 'fs';
import path from 'path';

/**
 * WCAG AA Accessibility Tests
 * Performs comprehensive accessibility audits in light and dark modes.
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';
const REPORT_DIR = path.join(process.cwd(), 'accessibility-reports');

// Ensure report directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

const pagesToTest = [
  { name: 'Landing Page', url: '/' },
  { name: 'Login Page', url: '/login' },
  { name: 'Dashboard', url: '/dashboard', auth: true },
  { name: 'Pricing', url: '/pricing', auth: true },
];

/**
 * Helper to run login flow
 */
async function loginIfRequired(page, authRequired) {
  if (!authRequired) return;

  // Use provided credentials
  const email = 'hex.ron07@gmail.com';
  const password = 'password123';

  await page.goto(`${BASE_URL}/login`);
  console.log(`Navigated to login, current URL: ${page.url()}`);

  // Check if already logged in (redirected to dashboard/admin)
  if (
    page.url().includes('dashboard') ||
    page.url().includes('onboarding') ||
    page.url().includes('admin')
  ) {
    console.log('Already logged in, skipping login flow');
    return;
  }

  // Ensure we are in Sign In mode
  // If "Join Now" button is visible, we are in Sign In mode (because it toggles TO signup)
  // If "Sign In" button (toggle) is visible, we are in Signup mode

  // If "Join Now" button is visible, we are in Sign In mode.
  // If "Sign In" is visible as a TOGGLE, we are in Signup mode.
  // BUT "Sign In" is also the submit button.

  // Check for unique identifier of the toggle vs submit
  // The submit button has type="submit"
  // The toggle button usually has type="button"

  const toggleBtn = page
    .getByRole('button', { name: /join now|sign in/i })
    .filter({ hasNotText: /^Sign In$/ });
  // Wait, simpler: get the one that is type="button" (toggle) vs type="submit" (login form)

  const joinNowToggle = page.locator('button[type="button"]').filter({ hasText: /join now/i });

  if (await joinNowToggle.isVisible()) {
    // It says "Join Now", so we are in Sign In mode. Good.
    console.log('Join Now toggle visible, assuming Sign In mode.');
  } else {
    // Maybe it says "Sign In" (toggle) -> Signup mode
    const signInToggle = page.locator('button[type="button"]').filter({ hasText: /sign in/i });
    if (await signInToggle.isVisible()) {
      console.log('Sign In toggle visible, switching to Sign In mode...');
      await signInToggle.click();
    }
  }

  // Fill credentials
  console.log('Filling credentials...');
  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', password);

  const submitBtn = page.locator('button[type="submit"]');
  await submitBtn.click();

  // Check for potential error message (short wait)
  try {
    const errorLocator = page
      .locator('.text-destructive, .text-red-500')
      .filter({ hasText: /invalid|incorrect|error/i });
    // We only wait a short time for an error to appear
    await errorLocator.waitFor({ state: 'visible', timeout: 3000 });
    throw new Error(`Login failed with UI error: ${await errorLocator.innerText()}`);
  } catch (e) {
    if (e.message.includes('Login failed')) throw e;
    // If timeout, it means NO error, which is good. Proceed.
  }

  // Wait for success redirect
  // User might be admin, so also wait for /admin
  await page.waitForURL(/dashboard|onboarding|admin/i, { timeout: 45000 });
}

/**
 * Helper to run axe and generate HTML report if violations found
 */
async function runAxeAudit(page, pageName, theme) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();

  if (results.violations.length > 0) {
    const reportFileName = `accessibility-report-${pageName.replace(/\s+/g, '-').toLowerCase()}-${theme}.html`;
    createHtmlReport({
      results,
      options: {
        projectKey: 'IELTS-AI-PRO',
        reportFileName: reportFileName,
        outputDir: 'accessibility-reports', // Relative to process.cwd()
      },
    });
  }

  return results;
}

test.describe('WCAG AA Accessibility Audit', () => {
  // Audit can be heavy, increase timeout
  test.slow();

  for (const pageInfo of pagesToTest) {
    test.describe(`${pageInfo.name}`, () => {
      test('should pass WCAG AA in Light Mode', async ({ page }) => {
        await loginIfRequired(page, pageInfo.auth);
        await page.goto(`${BASE_URL}${pageInfo.url}`);

        // Ensure page is in light mode
        await page.evaluate(() => {
          document.documentElement.classList.remove('dark');
          document.documentElement.removeAttribute('data-theme');
        });

        // Wait for any animations/lazy loading
        await page.waitForTimeout(2000);

        console.log(`Auditing page/URL: ${page.url()}`);
        const results = await runAxeAudit(page, pageInfo.name, 'light');

        // Log violations for better debugging if they occur
        if (results.violations.length > 0) {
          console.log(`\n[${pageInfo.name} - Light] Accessibility Violations:`);
          results.violations.forEach((v) =>
            console.log(`- ${v.id}: ${v.help} (${v.nodes.length} instances)`)
          );
        }

        expect(results.violations).toHaveLength(0);
      });

      test('should pass WCAG AA in Dark Mode', async ({ page }) => {
        await loginIfRequired(page, pageInfo.auth);
        await page.goto(`${BASE_URL}${pageInfo.url}`);

        // Toggle dark mode
        await page.evaluate(() => {
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
        });

        // Wait for theme transition and any layout changes
        await page.waitForTimeout(2000);

        console.log(`Auditing page/URL: ${page.url()}`);
        const results = await runAxeAudit(page, pageInfo.name, 'dark');

        // Log violations for better debugging if they occur
        if (results.violations.length > 0) {
          console.log(`\n[${pageInfo.name} - Dark] Accessibility Violations:`);
          results.violations.forEach((v) =>
            console.log(`- ${v.id}: ${v.help} (${v.nodes.length} instances)`)
          );
        }

        expect(results.violations).toHaveLength(0);
      });
    });
  }
});
