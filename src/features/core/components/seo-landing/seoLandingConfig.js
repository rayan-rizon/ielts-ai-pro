import BarChart3 from 'lucide-react/icons/bar-chart-3';
import BookOpenCheck from 'lucide-react/icons/book-open-check';
import Headphones from 'lucide-react/icons/headphones';
import ListChecks from 'lucide-react/icons/list-checks';
import MessagesSquare from 'lucide-react/icons/messages-square';
import Mic2 from 'lucide-react/icons/mic-2';
import PenLine from 'lucide-react/icons/pen-line';
import Sparkles from 'lucide-react/icons/sparkles';
import Timer from 'lucide-react/icons/timer';

import { RELATED_LINKS, SEO_LANDING_CONTENT, SITE_URL } from './seoLandingContent';

export { RELATED_LINKS, SITE_URL };

/*
 * The copy lives in seoLandingContent.js because the static crawler HTML is built
 * from the same file by scripts/generate-public-seo-pages.mjs. Icons stay here:
 * that build script runs in plain Node and cannot import React components, so
 * content refers to icons by key and this map resolves them.
 */
const ICONS = {
  book: BookOpenCheck,
  chart: BarChart3,
  headphones: Headphones,
  list: ListChecks,
  messages: MessagesSquare,
  mic: Mic2,
  pen: PenLine,
  sparkles: Sparkles,
  timer: Timer,
};

function withIcons(content) {
  return {
    ...content,
    icon: ICONS[content.iconKey],
    features: content.features.map((feature) => ({ ...feature, icon: ICONS[feature.iconKey] })),
    breakdown: {
      ...content.breakdown,
      items: content.breakdown.items.map((item) => ({ ...item, icon: ICONS[item.iconKey] })),
    },
    faqs: content.faqs.map(([q, a]) => ({ q, a })),
  };
}

export const PAGE_CONFIG = {
  speaking: withIcons(SEO_LANDING_CONTENT.speaking),
  practice: withIcons(SEO_LANDING_CONTENT.practice),
};

export function getConfig(pathname) {
  return pathname === PAGE_CONFIG.speaking.path ? PAGE_CONFIG.speaking : PAGE_CONFIG.practice;
}

/*
 * Mirrors the graph scripts/generate-public-seo-pages.mjs writes into the static
 * HTML. Both read the same FAQ list, so the markup a crawler sees before and
 * after hydration describes the same questions.
 *
 * No SoftwareApplication node: Google's Software App markup requires an
 * aggregateRating, and inventing review data to satisfy a validator is not an
 * option. Reinstate it only alongside genuine collected reviews.
 */
export function createStructuredData(config) {
  const canonical = `${SITE_URL}${config.path}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: config.title,
        description: config.description,
        inLanguage: 'en',
        isPartOf: { '@id': `${SITE_URL}/#website` },
      },
      {
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        mainEntity: config.faqs.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: config.breadcrumb, item: canonical },
        ],
      },
    ],
  };
}
