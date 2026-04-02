/* eslint-disable no-console */
import { chromium } from '@playwright/test';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (exception) => {
    console.log(`Uncaught exception: "${exception}"`);
  });
  console.log('Navigating...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  console.log('Done.');
  await browser.close();
})();
