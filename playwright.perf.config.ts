import { defineConfig, devices } from '@playwright/test';
import config from './playwright.config';

export default defineConfig({
  ...config,
  testDir: './tests/performance',
  testIgnore: [],
  reporter: 'list',
});
