import { fetchListeningData } from './listeningDataService';
import { useObjectiveLibraryData } from '../shared/services/useObjectiveLibraryData';

export function useListeningData(userData, authLoading, activeTab = 'all') {
  const result = useObjectiveLibraryData({
    testType: 'listening',
    userData,
    authLoading,
    activeTab,
    fetchPage: fetchListeningData,
  });
  return { ...result, listeningData: result.data };
}
