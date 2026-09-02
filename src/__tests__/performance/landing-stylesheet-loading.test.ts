import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('landing page stylesheet loading', () => {
  it('does not wait for user interaction before loading the application stylesheet', () => {
    const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    const viteConfig = readFileSync(resolve(process.cwd(), 'vite.config.js'), 'utf8');

    expect(indexHtml).toContain('rel="stylesheet" href="/src/index.css"');
    expect(viteConfig).not.toContain('deferred-app-styles');
    expect(viteConfig).not.toMatch(
      /addEventListener\(["'](?:pointerdown|touchstart|keydown|wheel)["']/
    );
  });

  it('bootstraps the saved theme before the application renders', () => {
    const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    const bootstrap = indexHtml.slice(
      indexHtml.indexOf("window.localStorage.getItem('vite-ui-theme')"),
      indexHtml.indexOf(
        '</script>',
        indexHtml.indexOf("window.localStorage.getItem('vite-ui-theme')")
      )
    );

    expect(bootstrap).toContain('document.documentElement.classList.add(theme)');
    expect(bootstrap).toContain("window.matchMedia('(prefers-color-scheme: dark)')");
  });

  it('gives the compact theme control an action-specific accessible name', () => {
    const themeToggle = readFileSync(
      resolve(process.cwd(), 'src/features/core/components/Sidebar/ThemeToggle.jsx'),
      'utf8'
    );

    expect(themeToggle).toContain("const nextTheme = theme === 'dark' ? 'light' : 'dark';");
    expect(themeToggle).toContain('aria-label={`Switch to ${nextTheme} theme`}');
    expect(themeToggle).toContain("aria-pressed={theme === 'dark'}");
  });
});
