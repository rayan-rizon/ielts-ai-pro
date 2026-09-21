import { useState, useMemo, useEffect, useRef } from 'react';
import { countryByCode } from '../universityData';

function matchesSearchQuery(entry, lowerQuery) {
  if (!lowerQuery) return true;
  const matchesName = entry.name.toLowerCase().includes(lowerQuery);
  const matchesCity = entry.city ? entry.city.toLowerCase().includes(lowerQuery) : false;
  const countryName = countryByCode(entry.country)?.name ?? '';
  const matchesCountry = countryName.toLowerCase().includes(lowerQuery);
  return matchesName || matchesCity || matchesCountry;
}

function matchesFilterTab(result, activeFilter) {
  if (activeFilter === 'meets') {
    return result.outcome === 'safe' || result.outcome === 'match';
  }
  if (activeFilter === 'short') {
    return result.outcome === 'reach' || result.outcome === 'unlikely';
  }
  if (activeFilter === 'presessional') {
    return Boolean(result.entry.preSessional);
  }
  return true;
}

function getSuggestionRank(nameIndex, cityIndex, countryIndex) {
  if (nameIndex === 0) return 0;
  if (nameIndex > 0) return 1;
  if (cityIndex === 0) return 2;
  if (cityIndex > 0) return 3;
  if (countryIndex === 0) return 4;
  return 5;
}

function evaluateSuggestion(result, query) {
  const name = result.entry.name;
  const city = result.entry.city ?? '';
  const countryName = countryByCode(result.entry.country)?.name ?? '';

  const nameIndex = name.toLowerCase().indexOf(query);
  const cityIndex = city.toLowerCase().indexOf(query);
  const countryIndex = countryName.toLowerCase().indexOf(query);

  const hasMatch = nameIndex !== -1 || cityIndex !== -1 || countryIndex !== -1;
  if (!hasMatch) return null;

  const rank = getSuggestionRank(nameIndex, cityIndex, countryIndex);
  let matchedOn = 'country';
  if (nameIndex !== -1) {
    matchedOn = 'name';
  } else if (cityIndex !== -1) {
    matchedOn = 'city';
  }

  return { result, rank, matchedOn };
}

function handleClosedKeyDown(event, suggestionsLength, setSuggestionsOpen, setActiveSuggestion) {
  if (event.key === 'ArrowDown' && suggestionsLength > 0) {
    setSuggestionsOpen(true);
    setActiveSuggestion(0);
    event.preventDefault();
  }
}

function handleOpenKeyDown(event, suggestions, activeSuggestion, actions) {
  const { setSuggestionsOpen, setActiveSuggestion, chooseSuggestion } = actions;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    setActiveSuggestion((curr) => (curr + 1) % suggestions.length);
    return;
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    setActiveSuggestion((curr) => (curr <= 0 ? suggestions.length - 1 : curr - 1));
    return;
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    if (activeSuggestion >= 0) {
      chooseSuggestion(suggestions[activeSuggestion]);
    } else {
      setSuggestionsOpen(false);
    }
    return;
  }
  if (event.key === 'Escape') {
    setSuggestionsOpen(false);
    setActiveSuggestion(-1);
  }
}

export function useUniversitySearch(allResults) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all | meets | short | presessional
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const searchBoxRef = useRef(null);

  const qualifyingCount = useMemo(
    () => allResults.filter((r) => r.outcome === 'safe' || r.outcome === 'match').length,
    [allResults]
  );

  const comparableCount = useMemo(
    () => allResults.filter((r) => r.outcome !== 'unknown' && r.outcome !== 'not-accepted').length,
    [allResults]
  );

  const shortCount = useMemo(
    () => allResults.filter((r) => r.outcome === 'reach' || r.outcome === 'unlikely').length,
    [allResults]
  );

  const preSessionalCount = useMemo(
    () => allResults.filter((r) => r.entry.preSessional).length,
    [allResults]
  );

  const filteredResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return allResults.filter((r) => {
      if (!matchesSearchQuery(r.entry, query)) return false;
      return matchesFilterTab(r, activeFilter);
    });
  }, [allResults, searchQuery, activeFilter]);

  const suggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return allResults
      .map((result) => evaluateSuggestion(result, query))
      .filter(Boolean)
      .sort((a, b) => a.rank - b.rank || a.result.entry.name.localeCompare(b.result.entry.name))
      .slice(0, 6);
  }, [allResults, searchQuery]);

  useEffect(() => {
    setActiveSuggestion(-1);
  }, [searchQuery]);

  useEffect(() => {
    if (!suggestionsOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!searchBoxRef.current?.contains(event.target)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [suggestionsOpen]);

  const chooseSuggestion = (suggestion) => {
    if (!suggestion) return;
    setSearchQuery(suggestion.result.entry.name);
    setSuggestionsOpen(false);
    setActiveSuggestion(-1);
    setActiveFilter('all');
  };

  const handleSearchKeyDown = (event) => {
    if (!suggestionsOpen || suggestions.length === 0) {
      handleClosedKeyDown(event, suggestions.length, setSuggestionsOpen, setActiveSuggestion);
      return;
    }
    handleOpenKeyDown(event, suggestions, activeSuggestion, {
      setSuggestionsOpen,
      setActiveSuggestion,
      chooseSuggestion,
    });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setActiveFilter('all');
  };

  return {
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
    counts: {
      total: allResults.length,
      qualifying: qualifyingCount,
      comparable: comparableCount,
      short: shortCount,
      preSessional: preSessionalCount,
    },
  };
}

export default useUniversitySearch;
