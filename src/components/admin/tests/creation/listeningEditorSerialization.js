import { sanitizeHtml } from '@/lib/security';

function sanitizeTranscriptHighlight(highlight) {
  return {
    ...highlight,
    ...(highlight?.phrase ? { phrase: sanitizeHtml(highlight.phrase) } : {}),
    ...(Array.isArray(highlight?.phrases)
      ? { phrases: highlight.phrases.map((phrase) => sanitizeHtml(phrase)) }
      : {}),
  };
}

export function serializeListeningSections(sections = []) {
  return sections.map((section, sectionIndex) => ({
    section_number: sectionIndex + 1,
    title: section.title,
    audio_url: section.audio_url,
    transcript: sanitizeHtml(section.transcript),
    srt_content: sanitizeHtml(section.srt_content || ''),
    transcript_highlights: Array.isArray(section.transcript_highlights)
      ? section.transcript_highlights.map(sanitizeTranscriptHighlight)
      : [],
    question_groups: (section.groups || []).map((group) => ({
      ...group,
      instructions: sanitizeHtml(group.instructions),
    })),
  }));
}
