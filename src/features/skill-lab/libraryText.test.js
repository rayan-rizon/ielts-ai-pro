import { describe, expect, it } from 'vitest';
import { formatLibraryText } from './libraryText';

describe('library text formatting', () => {
  it('turns legacy lesson markers into readable, safe HTML', () => {
    const html = formatLibraryText(
      '[heading]Glossary[/heading]\n[palisade] should remain text.\n[center]Read this[/center]'
    );
    expect(html).toContain('<h3');
    expect(html).toContain('Glossary');
    expect(html).toContain('text-center');
    expect(html).not.toContain('[heading]');
    expect(html).not.toContain('<script');
  });
});
