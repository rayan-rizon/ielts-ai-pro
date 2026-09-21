/**
 * Country registry for the verified requirement data.
 *
 * Countries are added here as their curation batch is verified, so the picker
 * only ever offers a country that has real entries behind it. An empty country
 * in the dropdown is a promise the page cannot keep.
 */

import type { UniversityEntry } from './universityMatch';

import au from './data/au.json';
import ca from './data/ca.json';
import de from './data/de.json';
import gb from './data/gb.json';
import ie from './data/ie.json';
import nl from './data/nl.json';
import nz from './data/nz.json';
import se from './data/se.json';
import us from './data/us.json';

export interface CountryOption {
  code: string;
  name: string;
  /** Regional indicator pair, so the picker does not hardcode one country's flag. */
  flag: string;
  entries: UniversityEntry[];
}

/** Curated countries, in the order the picker shows them. */
export const COUNTRIES: readonly CountryOption[] = [
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', entries: gb as UniversityEntry[] },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', entries: au as UniversityEntry[] },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', entries: ca as UniversityEntry[] },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', entries: ie as UniversityEntry[] },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', entries: nz as UniversityEntry[] },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', entries: se as UniversityEntry[] },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', entries: de as UniversityEntry[] },
  { code: 'US', name: 'United States', flag: '🇺🇸', entries: us as UniversityEntry[] },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', entries: nl as UniversityEntry[] },
];

/** Countries curation is working through next, shown as "coming soon". */
export const UPCOMING_COUNTRIES: readonly string[] = [];

/**
 * Sentinel for "no country filter". The picker defaults to this: a learner
 * arriving cold has usually not settled on a country, and making them choose
 * one before seeing anything hides most of the data behind a decision they
 * came here to inform.
 */
export const ALL_COUNTRIES = 'ALL';

/**
 * Every verified entry, sorted by name so the unfiltered list has a stable,
 * scannable order rather than whichever order the country files import in.
 */
export const ALL_ENTRIES: readonly UniversityEntry[] = COUNTRIES.flatMap(
  (country) => country.entries
).sort((a, b) => a.name.localeCompare(b.name));

export function countryByCode(code: string): CountryOption | undefined {
  return COUNTRIES.find((country) => country.code === code);
}

export const TOTAL_VERIFIED_ENTRIES = COUNTRIES.reduce(
  (total, country) => total + country.entries.length,
  0
);
