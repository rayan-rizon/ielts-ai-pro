import React from 'react';
import Search from 'lucide-react/icons/search';
import X from 'lucide-react/icons/x';
import CheckCircle2 from 'lucide-react/icons/check-circle-2';
import AlertCircle from 'lucide-react/icons/alert-circle';

import { PANEL, NUM, MICRO, MUTED } from '@/features/dashboard/components/primitives';
import { countryByCode } from '../universityData';
import { OUTCOME_META } from './matchToolConstants';

function SuggestionsDropdown({
  suggestions,
  activeSuggestion,
  setActiveSuggestion,
  chooseSuggestion,
}) {
  return (
    <ul
      id="university-suggestions"
      role="listbox"
      aria-label="University suggestions"
      className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-[#e4e2f0] bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[#18171f]"
    >
      {suggestions.map((suggestion, index) => {
        const { entry } = suggestion.result;
        const suggestionMeta = OUTCOME_META[suggestion.result.outcome] || OUTCOME_META.unknown;
        const isActive = index === activeSuggestion;
        const subtitle = [entry.city, countryByCode(entry.country)?.name]
          .filter(Boolean)
          .join(' · ');
        const matchedCitySuffix = suggestion.matchedOn === 'city' ? ' · matched on city' : '';

        return (
          <li key={entry.id} role="none">
            <button
              type="button"
              id={`university-suggestion-${index}`}
              role="option"
              aria-selected={isActive}
              onMouseEnter={() => setActiveSuggestion(index)}
              onClick={() => chooseSuggestion(suggestion)}
              className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors ${
                isActive
                  ? 'bg-[#f2f0ff] dark:bg-white/[0.07]'
                  : 'hover:bg-[#f8f8fe] dark:hover:bg-white/[0.04]'
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-extrabold text-slate-900 dark:text-white">
                  {entry.name}
                </span>
                <span className="mt-0.5 block truncate text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                  {subtitle}
                  {matchedCitySuffix}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider ${suggestionMeta.badgeText}`}
              >
                {suggestionMeta.label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function UniversitySearchBox({
  searchBoxRef,
  searchQuery,
  setSearchQuery,
  suggestionsOpen,
  setSuggestionsOpen,
  activeSuggestion,
  setActiveSuggestion,
  suggestions,
  onKeyDown,
  chooseSuggestion,
}) {
  const showSuggestions = suggestionsOpen && suggestions.length > 0;
  const activeId = activeSuggestion >= 0 ? `university-suggestion-${activeSuggestion}` : undefined;

  return (
    <div className="relative min-w-0 flex-1" ref={searchBoxRef}>
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        role="combobox"
        aria-expanded={showSuggestions}
        aria-controls="university-suggestions"
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        autoComplete="off"
        placeholder="Search university, city or country (e.g. Sheffield, Australia)..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setSuggestionsOpen(true);
        }}
        onFocus={() => setSuggestionsOpen(true)}
        onKeyDown={onKeyDown}
        className="h-10 w-full rounded-xl border border-[#e4e2f0] bg-white pl-9 pr-9 text-xs font-semibold text-slate-900 placeholder:text-slate-400 transition-colors hover:border-[#5a63df]/40 focus:border-[#5a63df] focus:outline-none focus:ring-2 focus:ring-[#5a63df]/20 dark:border-white/10 dark:bg-[#18171f] dark:text-white"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => {
            setSearchQuery('');
            setSuggestionsOpen(false);
          }}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {showSuggestions && (
        <SuggestionsDropdown
          suggestions={suggestions}
          activeSuggestion={activeSuggestion}
          setActiveSuggestion={setActiveSuggestion}
          chooseSuggestion={chooseSuggestion}
        />
      )}
    </div>
  );
}

function FilterPillButtons({ activeFilter, setActiveFilter, counts }) {
  return (
    <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-[#e4e2f0] pt-3 dark:border-white/[0.07]">
      <span className={`${MICRO} ${MUTED} mr-1`}>Filter:</span>

      <button
        type="button"
        onClick={() => setActiveFilter('all')}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all duration-200 ${
          activeFilter === 'all'
            ? 'bg-[#5a63df] text-white shadow-xs dark:bg-[#5a63df] dark:text-white dark:shadow-[0_2px_10px_rgba(90,99,223,0.35)]'
            : 'bg-[#f4f3fb] text-slate-600 hover:bg-[#e8eaf6] dark:border dark:border-white/10 dark:bg-[#16151e] dark:text-slate-300 dark:hover:bg-[#1f1e29]'
        }`}
      >
        All Universities
        <span className={`${NUM} opacity-75`}>({counts.total})</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveFilter('meets')}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all duration-200 ${
          activeFilter === 'meets'
            ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-600 dark:text-white dark:shadow-[0_2px_10px_rgba(16,185,129,0.35)]'
            : 'bg-[#f4f3fb] text-slate-600 hover:bg-[#e8eaf6] dark:border dark:border-white/10 dark:bg-[#16151e] dark:text-slate-300 dark:hover:bg-[#1f1e29]'
        }`}
      >
        <CheckCircle2 className="h-3 w-3 stroke-[2.5]" />
        Meets ({counts.qualifying})
      </button>

      <button
        type="button"
        onClick={() => setActiveFilter('short')}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all duration-200 ${
          activeFilter === 'short'
            ? 'bg-amber-600 text-white shadow-xs dark:bg-amber-600 dark:text-white dark:shadow-[0_2px_10px_rgba(217,119,6,0.35)]'
            : 'bg-[#f4f3fb] text-slate-600 hover:bg-[#e8eaf6] dark:border dark:border-white/10 dark:bg-[#16151e] dark:text-slate-300 dark:hover:bg-[#1f1e29]'
        }`}
      >
        <AlertCircle className="h-3 w-3 stroke-[2.5]" />
        Shortfall ({counts.short})
      </button>

      <button
        type="button"
        onClick={() => setActiveFilter('presessional')}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all duration-200 ${
          activeFilter === 'presessional'
            ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-600 dark:text-white dark:shadow-[0_2px_10px_rgba(79,70,229,0.35)]'
            : 'bg-[#f4f3fb] text-slate-600 hover:bg-[#e8eaf6] dark:border dark:border-white/10 dark:bg-[#16151e] dark:text-slate-300 dark:hover:bg-[#1f1e29]'
        }`}
      >
        Pre-sessional ({counts.preSessional})
      </button>
    </div>
  );
}

export function SearchAndFilterHeader({
  searchBoxRef,
  searchQuery,
  setSearchQuery,
  suggestionsOpen,
  setSuggestionsOpen,
  activeSuggestion,
  setActiveSuggestion,
  suggestions,
  onKeyDown,
  chooseSuggestion,
  activeFilter,
  setActiveFilter,
  counts,
}) {
  return (
    <div className={`${PANEL} p-4 sm:p-5 shadow-xs`}>
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <UniversitySearchBox
          searchBoxRef={searchBoxRef}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          suggestionsOpen={suggestionsOpen}
          setSuggestionsOpen={setSuggestionsOpen}
          activeSuggestion={activeSuggestion}
          setActiveSuggestion={setActiveSuggestion}
          suggestions={suggestions}
          onKeyDown={onKeyDown}
          chooseSuggestion={chooseSuggestion}
        />

        {/* Results Match Count */}
        <div className="flex shrink-0 items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
          <span
            className={`${NUM} rounded-md bg-[#5a63df]/10 px-2 py-1 text-[#5a63df] dark:text-violet-300`}
          >
            {counts.qualifying} of {counts.comparable}
          </span>
          <span>meet your score</span>
        </div>
      </div>

      <FilterPillButtons
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        counts={counts}
      />
    </div>
  );
}

export default SearchAndFilterHeader;
