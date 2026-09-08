import { sanitizeHtml } from '@/lib/security';

/**
 * Library content contains a small amount of legacy BBCode. Convert the
 * supported presentation markers before sanitising so students see the
 * lesson as formatted content instead of storage syntax.
 */
export function formatLibraryText(value = '') {
  const content = String(value)
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(
      /\[center\]([\s\S]*?)\[\/center\]/gi,
      '<div class="text-center font-semibold">$1</div>'
    )
    .replace(
      /\[heading\]([\s\S]*?)\[\/heading\]/gi,
      '<h3 class="mb-2 text-base font-semibold">$1</h3>'
    )
    .replace(
      /\[(?:subheading|title)\]([\s\S]*?)\[\/(?:subheading|title)\]/gi,
      '<h4 class="mb-1 font-semibold">$1</h4>'
    )
    .replace(/\[br\]/gi, '<br />')
    .replace(/\[\/?(?:left|right|justify)\]/gi, '')
    .replace(/\[\/?(?:b|bold)\]/gi, (tag) => (tag.startsWith('[/') ? '</strong>' : '<strong>'))
    .replace(/\[\/?(?:i|italic)\]/gi, (tag) => (tag.startsWith('[/') ? '</em>' : '<em>'))
    .replace(/\[\/?(?:u|underline)\]/gi, (tag) => (tag.startsWith('[/') ? '</u>' : '<u>'))
    .replace(/\[list\]([\s\S]*?)\[\/list\]/gi, '<ul class="my-2 list-disc space-y-1 pl-5">$1</ul>')
    .replace(/\[\/?(?:item|li)\]/gi, (tag) => (tag.startsWith('[/') ? '</li>' : '<li>'))
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/^\s*-{5,}\s*$/gm, '<hr class="my-3 border-[#e4e2f0] dark:border-white/10" />');

  return sanitizeHtml(content);
}
