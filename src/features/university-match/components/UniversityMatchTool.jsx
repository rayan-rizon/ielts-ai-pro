import React, { useEffect, useMemo, useRef, useState } from 'react';
import { m } from 'framer-motion';
import ArrowRight from 'lucide-react/icons/arrow-right';
import RotateCcw from 'lucide-react/icons/rotate-ccw';
import Building2 from 'lucide-react/icons/building-2';

import { roundOverallBand } from '@/features/core/components/calculator/calculatorData';
import { PANEL } from '@/features/dashboard/components/primitives';
import { matchUniversities } from '../universityMatch';
import { ALL_COUNTRIES, ALL_ENTRIES, COUNTRIES } from '../universityData';
import { SKILLS } from './matchToolConstants';
import ScoreControlPanel from './ScoreControlPanel';
import SearchAndFilterHeader from './SearchAndFilterHeader';
import ResultCard from './ResultCard';
import Pagination from './Pagination';
import useUniversitySearch from './useUniversitySearch';

/*
 * Results render eight at a time. The full list used to mean scrolling past
 * every university just to reach the "official authority notice" and the
 * practice CTA at the bottom of the page — a page this long needs a stopping
 * point, not an ever-longer single scroll.
 */
const RESULTS_PER_PAGE = 8;

function findLowestSkill(scores) {
  let minKey = SKILLS[0].key;
  let minVal = scores[minKey];
  for (const skill of SKILLS) {
    if (scores[skill.key] < minVal) {
      minVal = scores[skill.key];
      minKey = skill.key;
    }
  }
  const skillObj = SKILLS.find((s) => s.key === minKey);
  return { name: skillObj?.name ?? 'Skill', value: minVal };
}

function EmptyResultsView({ onReset }) {
  return (
    <div className={`${PANEL} p-10 text-center`}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
        <Building2 className="h-6 w-6" />
      </div>
      <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-white">
        No matching universities found
      </h3>
      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        Try clearing your search query or selecting a different filter.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#e4e2f0] bg-white px-3 py-1.5 text-xs font-bold text-[#5a63df] transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-violet-300 dark:hover:bg-white/10"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset Filters
      </button>
    </div>
  );
}

function AuthorityNotice() {
  return (
    <div className={`${PANEL} p-4 sm:p-5 text-slate-600 dark:text-slate-400`}>
      <p className="text-xs font-medium leading-relaxed">
        <strong className="font-bold text-slate-800 dark:text-slate-200">
          Official authority notice:{' '}
        </strong>
        Requirements change between academic intakes and differ across specialised departments (such
        as Medicine, Law, and Nursing). Every figure on this page links directly to the university’s
        official website. Always verify on the official course page before submitting your UCAS or
        postgraduate application.
      </p>
    </div>
  );
}

function GapCtaBanner({ onPrimaryCta }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        type="button"
        onClick={onPrimaryCta}
        className="group flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ded9ff] bg-linear-to-r from-[#f2f0ff] to-[#f8f7ff] p-4 text-left transition-all duration-200 hover:border-[#5a63df]/40 hover:shadow-sm dark:border-violet-500/25 dark:from-violet-950/40 dark:to-indigo-950/20 sm:p-5"
      >
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#5e50ee] dark:text-violet-300">
            Close The Band Gap
          </span>
          <p className="mt-0.5 text-sm font-extrabold text-[#07142f] dark:text-white">
            Short on a skill? Grade your Writing & Speaking against official examiner rubrics.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#5a63df] px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-xs transition-transform duration-200 group-hover:translate-x-0.5">
          Start Free Practice
          <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
        </span>
      </button>
    </m.div>
  );
}

export default function UniversityMatchTool({ handlePrimaryCta }) {
  const [countryCode, setCountryCode] = useState(ALL_COUNTRIES);
  const [level, setLevel] = useState('postgraduate');
  const [scores, setScores] = useState({
    listening: 6.5,
    reading: 6.5,
    writing: 6.0,
    speaking: 6.5,
  });

  const overall = useMemo(() => {
    const total = SKILLS.reduce((sum, skill) => sum + scores[skill.key], 0);
    return roundOverallBand(total / SKILLS.length);
  }, [scores]);

  const lowestSkill = useMemo(() => findLowestSkill(scores), [scores]);

  const showingAllCountries = countryCode === ALL_COUNTRIES;
  const country = showingAllCountries
    ? undefined
    : COUNTRIES.find((option) => option.code === countryCode);

  const activeEntries = useMemo(
    () => (showingAllCountries ? ALL_ENTRIES : (country?.entries ?? [])),
    [showingAllCountries, country]
  );

  const allResults = useMemo(
    () => matchUniversities(activeEntries, level, { overall, skills: scores }),
    [activeEntries, level, overall, scores]
  );

  const {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    suggestionsOpen,
    setSuggestionsOpen,
    activeSuggestion,
    setActiveSuggestion,
    searchBoxRef,
    filteredResults,
    suggestions,
    chooseSuggestion,
    handleSearchKeyDown,
    resetFilters,
    counts,
  } = useUniversitySearch(allResults);

  const toggleLevel = () => {
    setLevel((curr) => (curr === 'postgraduate' ? 'undergraduate' : 'postgraduate'));
  };

  const [page, setPage] = useState(1);
  const resultsTopRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / RESULTS_PER_PAGE));

  /*
   * Whatever narrowed the list — a new search term, a filter tab, a different
   * country or level — the old page number almost never still makes sense
   * against the new result count, so land back on page 1 rather than showing
   * an empty page 4 of a 2-page list.
   */
  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeFilter, countryCode, level]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pagedResults = useMemo(() => {
    const start = (page - 1) * RESULTS_PER_PAGE;
    return filteredResults.slice(start, start + RESULTS_PER_PAGE);
  }, [filteredResults, page]);

  const goToPage = (nextPage) => {
    setPage(nextPage);
    // A page change should read as "new screen", not "the old one moved" —
    // without this, clicking page 2 on a long list leaves the viewport
    // wherever it was in page 1's card list, which can land mid-card.
    resultsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,390px)_minmax(0,1fr)] lg:gap-8">
      {/* LEFT COLUMN: Sticky Score & Destination Controls */}
      <ScoreControlPanel
        countryCode={countryCode}
        setCountryCode={setCountryCode}
        showingAllCountries={showingAllCountries}
        country={country}
        activeEntries={activeEntries}
        level={level}
        setLevel={setLevel}
        scores={scores}
        setScores={setScores}
        overall={overall}
        lowestSkill={lowestSkill}
      />

      {/* RIGHT COLUMN: Search, Filters & University Results */}
      <div className="space-y-4">
        <div ref={resultsTopRef} className="scroll-mt-24" />
        <SearchAndFilterHeader
          searchBoxRef={searchBoxRef}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          suggestionsOpen={suggestionsOpen}
          setSuggestionsOpen={setSuggestionsOpen}
          activeSuggestion={activeSuggestion}
          setActiveSuggestion={setActiveSuggestion}
          suggestions={suggestions}
          onKeyDown={handleSearchKeyDown}
          chooseSuggestion={chooseSuggestion}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          counts={counts}
        />

        {filteredResults.length === 0 ? (
          <EmptyResultsView onReset={resetFilters} />
        ) : (
          <>
            <ul className="space-y-3">
              {pagedResults.map((result) => (
                <ResultCard
                  key={result.entry.id}
                  result={result}
                  learnerOverall={overall}
                  learnerLowest={lowestSkill.value}
                  level={level}
                  onSwitchLevel={toggleLevel}
                />
              ))}
            </ul>
            <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
          </>
        )}

        <AuthorityNotice />

        <GapCtaBanner onPrimaryCta={handlePrimaryCta} />
      </div>
    </div>
  );
}
