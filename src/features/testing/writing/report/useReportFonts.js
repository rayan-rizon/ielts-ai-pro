import { useEffect } from 'react';

// Only fetched for readers of these scripts; the CSP already allows Google Fonts.
const FONTS = {
  bn: { family: 'Hind Siliguri', query: 'Hind+Siliguri:wght@400;500;600;700' },
  hi: { family: 'Hind', query: 'Hind:wght@400;500;600;700' },
  ur: { family: 'Noto Naskh Arabic', query: 'Noto+Naskh+Arabic:wght@400;500;600;700' },
  fa: { family: 'Vazirmatn', query: 'Vazirmatn:wght@400;500;600;700' },
};

export const reportFontFamily = (language) =>
  FONTS[language]
    ? `'Plus Jakarta Sans', '${FONTS[language].family}', system-ui, sans-serif`
    : undefined;

export function loadReportFont(language) {
  const font = FONTS[language];
  if (!font || typeof document === 'undefined') return Promise.resolve();
  const id = `report-font-${language}`;
  let link = document.getElementById(id);
  if (!link) {
    link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${font.query}&display=swap`;
    link.dataset.loading = 'true';
    link.addEventListener('load', () => delete link.dataset.loading);
    link.addEventListener('error', () => delete link.dataset.loading);
    document.head.appendChild(link);
  }
  if (!link.dataset.loading) return Promise.resolve();
  return new Promise((resolve) => {
    link.addEventListener('load', resolve, { once: true });
    link.addEventListener('error', resolve, { once: true });
  });
}

export function useReportFonts(language) {
  useEffect(() => {
    loadReportFont(language);
  }, [language]);
}
