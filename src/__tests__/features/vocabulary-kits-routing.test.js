import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

describe('Vocabulary Kit page routing', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'src/App.jsx'), 'utf8');
  const vocabularySource = readFileSync(
    resolve(process.cwd(), 'src/features/vocabulary/pages/Vocabulary.jsx'),
    'utf8'
  );
  const resourceSource = readFileSync(
    resolve(process.cwd(), 'src/components/resources/ResourcesSection.jsx'),
    'utf8'
  );

  it('keeps the kit library and detail views on dedicated protected routes', () => {
    expect(appSource).toContain("path: '/vocabulary/kits'");
    expect(appSource).toContain("path: '/vocabulary/kits/:kitSlug'");
    expect(appSource).toContain('vocabulary-kits-protected');
  });

  it('does not render curated vocabulary in a popup', () => {
    expect(vocabularySource).not.toContain('selectedCuratedList');
    expect(resourceSource).not.toContain('isVocabDialogOpen');
    expect(resourceSource).toContain(
      'navigate(`/vocabulary/kits/${resource.slug || resource.id}`)'
    );
  });

  it('does not retain the hard-coded demo kit fallback', () => {
    const smartKitsSource = readFileSync(
      resolve(process.cwd(), 'src/features/vocabulary/components/WordGroupList.jsx'),
      'utf8'
    );
    expect(smartKitsSource).not.toContain('DEFAULT_TOPIC_KITS');
    expect(smartKitsSource).not.toContain('default-kit-');
  });

  it('keeps the Smart Kits shelf and kit saving actions on the dedicated flow', () => {
    const smartKitsSource = readFileSync(
      resolve(process.cwd(), 'src/features/vocabulary/components/WordGroupList.jsx'),
      'utf8'
    );
    const detailSource = readFileSync(
      resolve(process.cwd(), 'src/features/vocabulary/pages/VocabularyKits.jsx'),
      'utf8'
    );
    const studySource = readFileSync(
      resolve(process.cwd(), 'src/features/vocabulary/components/VocabularyStudyView.jsx'),
      'utf8'
    );

    expect(smartKitsSource).toContain('Slow-moving Vocabulary Kits carousel');
    expect(smartKitsSource).toContain('prefers-reduced-motion: reduce');
    expect(detailSource).toContain('onAddAll={handleAddAll}');
    expect(detailSource).toContain('scrollVocabularyPageToTop');
    expect(detailSource).toContain('ref={pageTopRef}');
    expect(detailSource).toContain('vocabulary-kit-active-category');
    expect(detailSource).toContain('AnimatePresence mode="wait"');
    expect(studySource).toContain('Add all (${unsavedWords.length})');
    expect(studySource).toContain("source: 'Vocabulary Kit'");
  });
});
