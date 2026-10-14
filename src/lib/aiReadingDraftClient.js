import { getSupabaseClient } from '@/lib/supabase';
import { callEdgeFunction } from '@/utils/api';
import {
  AI_READING_LIMITS,
  validateAiReadingInput,
} from '../../supabase/functions/_shared/aiReadingInput';
import {
  validateAiReadingDraft,
  aiReadingDraftSections,
} from '../../supabase/functions/_shared/aiReadingDraft';

export async function prepareReadingScreenshot(file, role) {
  if (
    !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
    file.size > 12 * 1024 * 1024
  ) {
    throw new Error('Choose a PNG, JPEG or WebP image smaller than 12 MB.');
  }
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 40000000)
      throw new Error('This image is too large. Crop it into separate screenshots.');
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not read this screenshot.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    if ((dataUrl.length * 3) / 4 > AI_READING_LIMITS.imageBytes) {
      throw new Error('This screenshot is too detailed. Crop it into smaller sections.');
    }
    return { role, dataUrl, name: file.name };
  } finally {
    bitmap.close();
  }
}

export async function generateReadingDraft(body) {
  const input = validateAiReadingInput(body);
  const result = await callEdgeFunction('admin-reading-draft', input);
  return { ...result, draft: validateAiReadingDraft(result.draft, input) };
}

// A single admin-only transaction, with a stable request UUID for safe retry.
// The RPC only inserts new inactive rows; no legacy save/update path is used.
export async function saveReadingAiDraft({
  draft,
  expectedQuestions,
  requestId,
  testFormat,
  accessTier,
}) {
  const clean = validateAiReadingDraft(draft, { expectedQuestions });
  const db = await getSupabaseClient();
  const { data, error } = await db.rpc('admin_create_ai_reading_draft', {
    p_request_id: requestId,
    p_draft: {
      title: clean.title,
      test_format: testFormat,
      access_tier: accessTier,
      sections: aiReadingDraftSections(clean),
    },
  });
  if (error) {
    if (error.code === 'PGRST202')
      throw new Error('AI draft saving is not deployed yet. Your preview is still available.');
    throw new Error(error.message || 'Draft could not be saved. Your preview is still available.');
  }
  if (!data) throw new Error('The server did not confirm saving. Retry with this preview.');
  return data;
}

export async function generateReadingExplanations(sections, selectedSection) {
  const { buildReadingPreview } =
    await import('@/components/admin/tests/preview/readingPreviewData');
  const { makeReadingExplanationInput, validateReadingExplanations } =
    await import('../../supabase/functions/_shared/aiReadingExplanations');
  const snapshot = buildReadingPreview(sections);
  const input = makeReadingExplanationInput(
    snapshot.testData.sections,
    snapshot.allQuestions,
    selectedSection
  );
  const result = await callEdgeFunction('admin-reading-draft', input);
  return {
    ...result,
    explanations: validateReadingExplanations({ explanations: result.explanations }, input),
  };
}

export async function generateListeningDraft(body) {
  const { validateAiListeningInput, validateAiListeningDraft } =
    await import('../../supabase/functions/_shared/aiListeningDraft.js');
  const input = validateAiListeningInput(body);
  const result = await callEdgeFunction('admin-listening-draft', input);
  return { ...result, draft: validateAiListeningDraft(result.draft, input) };
}
export async function saveListeningAiDraft({
  draft,
  expectedQuestions,
  requestId,
  accessTier,
  audioUrls,
}) {
  const { validateAiListeningDraft, aiListeningDraftSections, validateListeningAudioUrls } =
    await import('../../supabase/functions/_shared/aiListeningDraft.js');
  const clean = validateAiListeningDraft(draft, { expectedQuestions });
  const db = await getSupabaseClient();
  const { data, error } = await db.rpc('admin_create_ai_listening_draft', {
    p_request_id: requestId,
    p_draft: {
      title: clean.title,
      test_format: 'listening',
      access_tier: accessTier,
      sections: aiListeningDraftSections(clean, validateListeningAudioUrls(audioUrls)),
    },
  });
  if (error)
    throw new Error(error.message || 'Could not save draft. Your preview is still available.');
  if (!data) throw new Error('Saving was not confirmed. Retry with this preview.');
  return data;
}

export async function generateListeningExplanations(sections, selectedSection) {
  const { makeListeningExplanationInput } =
    await import('@/components/admin/tests/preview/listeningExplanationData');
  const { validateReadingExplanations } =
    await import('../../supabase/functions/_shared/aiReadingExplanations');
  const input = makeListeningExplanationInput(sections, selectedSection);
  const result = await callEdgeFunction('admin-listening-draft', input);
  return {
    ...result,
    explanations: validateReadingExplanations({ explanations: result.explanations }, input),
  };
}
