import { fetchReadingData } from './readingDataService';
import { useObjectiveLibraryData } from '../shared/services/useObjectiveLibraryData';

export function useReadingData(userData, authLoading, activeTab = 'all') {
  const result = useObjectiveLibraryData({
    testType: 'reading',
    userData,
    authLoading,
    activeTab,
    fetchPage: fetchReadingData,
  });
  return { ...result, readingData: result.data };
}
