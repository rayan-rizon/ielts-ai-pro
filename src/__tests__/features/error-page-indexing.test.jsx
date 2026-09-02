import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath) => fs.readFileSync(path.resolve('.', relativePath), 'utf8');

describe('error page indexing', () => {
  it('replaces inherited homepage metadata with noindex metadata', () => {
    const errorPage = readSource('src/features/core/pages/Error500.jsx');
    const documentHead = readSource('src/components/shared/DocumentHead.jsx');

    expect(documentHead).toContain("'title'");
    expect(errorPage).toContain("import DocumentHead from '@/components/shared/DocumentHead'");
    expect(errorPage).toContain('title="Temporarily unavailable"');
    expect(errorPage).toContain('canonicalUrl="https://www.ieltsai.pro/500"');
    expect(errorPage).toContain('noIndex');
    expect(errorPage).toContain('noFollow');
  });

  it('returns a crawler noindex header for the direct error route', () => {
    const config = JSON.parse(readSource('vercel.json'));
    const errorRoute = config.headers.find((entry) => entry.source === '/500');

    expect(errorRoute?.headers).toContainEqual({
      key: 'X-Robots-Tag',
      value: 'noindex, nofollow, noarchive',
    });
  });
});
