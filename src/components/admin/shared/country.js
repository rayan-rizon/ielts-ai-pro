import { countries } from '@/lib/countries';

const COUNTRY_NAMES = new Map(countries.map(({ code, name }) => [code, name]));

export const normalizeCountryCode = (value) => {
  const code = String(value || '')
    .trim()
    .toUpperCase();
  return /^[A-Z]{2}$/.test(code) && code !== 'XX' && code !== 'T1' ? code : 'unknown';
};

export const countryName = (value) => {
  const code = normalizeCountryCode(value);
  return code === 'unknown' ? 'Unknown country' : COUNTRY_NAMES.get(code) || code;
};

export const countryShortLabel = (value) => {
  const code = normalizeCountryCode(value);
  return code === 'unknown' ? '—' : code;
};
