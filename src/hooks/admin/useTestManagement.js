import { useState, useEffect, useCallback } from 'react';
import { Passage, Question, TestSession } from '@/entities';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const importSingleTest = async (data) => {
  try {
    const {
      id: _oldId,
      created_at: _created_at,
      question_count: _qc,
      ...passageData
    } = data.passage;
    const newPassageData = {
      ...passageData,
      title: `${passageData.title} (Imported)`,
      is_active: false,
    };

    const { data: newPassage, error: pError } = await supabase
      .from('passages')
      .insert(newPassageData)
      .select()
      .single();

    if (pError) throw pError;

    if (data.questions && data.questions.length > 0) {
      const newQuestions = data.questions.map((q) => {
        const { id: _id, created_at: __created_at, passage_id: ___passage_id, ...qData } = q;
        return { ...qData, passage_id: newPassage.id };
      });

      const { error: qError } = await supabase.from('questions').insert(newQuestions);

      if (qError) throw qError;
    }

    return true;
  } catch (error) {
    console.error('Failed to import single test:', error);
    return false;
  }
};

export const useTestManagement = () => {
  const [passages, setPassages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const fetchAllData = useCallback(async (filters = {}, page = 1, pageSize = 10) => {
    try {
      setLoading(true);

      // Fetch Paginated Passages
      const { data: passagesData, count } = await Passage.list(
        filters,
        '-created_at',
        pageSize,
        page
      );

      setPassages(passagesData);
      setPagination((prev) => ({
        ...prev,
        page,
        pageSize,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      }));

      // Fetch questions only for these passages to save bandwidth
      if (passagesData.length > 0) {
        const passageIds = passagesData.map((p) => p.id);
        const questionsData = await Question.listByPassageIds(passageIds);
        setQuestions(questionsData);

        // Fetch stats/counts
        const sessionCounts = await TestSession.getCountsByPassageIds(passageIds);
        setPassages((prev) =>
          prev.map((p) => ({
            ...p,
            usage_count: sessionCounts[p.id] || 0,
          }))
        );
      } else {
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load data');
      setPassages([]);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load is not automatic - the component should call fetchAllData with filters
  // But we set loading to false after a brief delay if no fetch is triggered
  useEffect(() => {
    // If component doesn't trigger a fetch within 100ms, stop showing loading spinner
    const timeout = setTimeout(() => {
      if (loading && passages.length === 0) {
        setLoading(false);
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [loading, passages.length]);

  const deleteTest = async (testId, currentFilters = {}) => {
    try {
      console.log('[deleteTest] Starting delete for test id:', testId);

      // 1. Delete questions linked to this passage
      const { error: questionsError } = await supabase
        .from('questions')
        .delete()
        .eq('passage_id', testId);

      if (questionsError) {
        console.warn('[deleteTest] Error deleting questions:', questionsError);
      }

      // 2. Delete test sessions linked to this passage
      const { error: sessionsError } = await supabase
        .from('test_sessions')
        .delete()
        .eq('passage_id', testId);

      if (sessionsError) {
        console.warn('[deleteTest] Error deleting sessions:', sessionsError);
      }

      // 3. Delete the passage
      await Passage.delete(testId);
      toast.success('Test deleted successfully.');

      // Refresh list
      fetchAllData(currentFilters, pagination.page, pagination.pageSize);
    } catch (error) {
      console.error('[deleteTest] Hard delete failed:', error);

      try {
        // Fallback to soft delete
        console.log('[deleteTest] Attempting soft delete...');
        await Passage.update(testId, { is_active: false });
        toast.success('Test deactivated successfully.');
        fetchAllData(currentFilters, pagination.page, pagination.pageSize);
      } catch (e2) {
        console.error('[deleteTest] Soft delete failed:', e2);
        toast.error('Failed to delete or deactivate test.');
      }
    }
  };

  const duplicateTest = async (testId, currentFilters = {}) => {
    setLoading(true);
    try {
      console.log('[duplicateTest] Starting duplication for:', testId);

      // 1. Get original passage
      const { data: original, error: fetchError } = await supabase
        .from('passages')
        .select('*')
        .eq('id', testId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Create new passage
      const { id: _, created_at: __, ...passageData } = original;
      const newPassageData = {
        ...passageData,
        title: `${original.title} (Copy)`,
        is_active: false, // Default to draft
      };

      const { data: newPassage, error: createError } = await supabase
        .from('passages')
        .insert(newPassageData)
        .select()
        .single();

      if (createError) throw createError;

      // 3. Duplicate questions
      const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('*')
        .eq('passage_id', testId);

      if (qError) throw qError;

      if (questions && questions.length > 0) {
        const newQuestions = questions.map((q) => {
          const { id, created_at, passage_id, ...qData } = q;
          return { ...qData, passage_id: newPassage.id };
        });

        const { error: insertQError } = await supabase.from('questions').insert(newQuestions);

        if (insertQError) throw insertQError;
      }

      toast.success('Test duplicated successfully.');
      fetchAllData(currentFilters, pagination.page, pagination.pageSize);
    } catch (error) {
      console.error('Duplicate failed:', error);
      toast.error('Failed to duplicate test.');
    } finally {
      setLoading(false);
    }
  };

  const bulkDeleteTests = async (testIds, currentFilters = {}) => {
    setLoading(true);
    try {
      await Promise.all(
        testIds.map(async (testId) => {
          // Delete questions
          await supabase.from('questions').delete().eq('passage_id', testId);
          // Delete sessions
          await supabase.from('test_sessions').delete().eq('passage_id', testId);
          // Delete passage
          await Passage.delete(testId);
        })
      );
      toast.success(`Successfully deleted ${testIds.length} tests.`);
      fetchAllData(currentFilters, pagination.page, pagination.pageSize);
    } catch (err) {
      console.error('Bulk delete failed:', err);
      toast.error('Failed to delete some tests.');
      fetchAllData(currentFilters, pagination.page, pagination.pageSize);
    } finally {
      setLoading(false);
    }
  };

  const bulkUpdateStatus = async (testIds, isActive, currentFilters = {}) => {
    setLoading(true);
    try {
      await Promise.all(testIds.map((id) => Passage.update(id, { is_active: isActive })));
      toast.success(`Successfully updated ${testIds.length} tests.`);
      fetchAllData(currentFilters, pagination.page, pagination.pageSize);
    } catch (err) {
      console.error('Bulk update failed:', err);
      toast.error('Failed to update status.');
      fetchAllData(currentFilters, pagination.page, pagination.pageSize);
    } finally {
      setLoading(false);
    }
  };

  const exportTest = async (testId) => {
    try {
      const { data: passage, error: pError } = await supabase
        .from('passages')
        .select('*')
        .eq('id', testId)
        .single();

      if (pError) throw pError;

      const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('*')
        .eq('passage_id', testId);

      if (qError) throw qError;

      const exportData = {
        version: 1,
        exported_at: new Date().toISOString(),
        passage,
        questions,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ielts-test-${passage.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Test exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export test');
    }
  };

  const importTest = async (file, currentFilters = {}) => {
    setLoading(true);
    try {
      const text = await file.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid JSON file');
      }

      // Check if it's a bulk export file (multiple tests)
      if (data.tests && Array.isArray(data.tests)) {
        // Handle bulk export format - import all tests
        let successCount = 0;
        let failCount = 0;

        for (const testData of data.tests) {
          try {
            const result = await importSingleTest(testData);
            if (result) successCount++;
            else failCount++;
          } catch (e) {
            console.error('Error importing test from bulk file:', e);
            failCount++;
          }
        }

        if (successCount > 0) {
          toast.success(
            `Successfully imported ${successCount} test${successCount > 1 ? 's' : ''}${failCount > 0 ? `, ${failCount} failed` : ''}`
          );
        } else if (failCount > 0) {
          toast.error(`Failed to import ${failCount} test${failCount > 1 ? 's' : ''}`);
        }

        fetchAllData(currentFilters, pagination.page, pagination.pageSize);
        return successCount > 0;
      }

      // Single test format
      if (!data.passage || !Array.isArray(data.questions)) {
        throw new Error('Invalid test file format: missing passage or questions');
      }

      // 1. Create Passage
      const {
        id: _oldId,
        created_at: _created_at,
        question_count: _qc,
        ...passageData
      } = data.passage;
      const newPassageData = {
        ...passageData,
        title: `${passageData.title} (Imported)`,
        is_active: false, // Import as draft by default
      };

      const { data: newPassage, error: pError } = await supabase
        .from('passages')
        .insert(newPassageData)
        .select()
        .single();

      if (pError) throw pError;

      // 2. Create Questions
      if (data.questions.length > 0) {
        const newQuestions = data.questions.map((q) => {
          const { id: _id, created_at: __created_at, passage_id: ___passage_id, ...qData } = q;
          return { ...qData, passage_id: newPassage.id };
        });

        const { error: qError } = await supabase.from('questions').insert(newQuestions);

        if (qError) throw qError;
      }

      toast.success('Test imported successfully');
      fetchAllData(currentFilters, pagination.page, pagination.pageSize);
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(error.message || 'Failed to import test');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const bulkExportTests = async (testIds) => {
    try {
      const exportData = {
        version: 1,
        exported_at: new Date().toISOString(),
        tests: [],
      };

      for (const testId of testIds) {
        const { data: passage, error: pError } = await supabase
          .from('passages')
          .select('*')
          .eq('id', testId)
          .single();

        if (pError) {
          console.warn(`Failed to fetch passage ${testId}:`, pError);
          continue;
        }

        const { data: questions, error: qError } = await supabase
          .from('questions')
          .select('*')
          .eq('passage_id', testId);

        if (qError) {
          console.warn(`Failed to fetch questions for ${testId}:`, qError);
          continue;
        }

        exportData.tests.push({ passage, questions: questions || [] });
      }

      if (exportData.tests.length === 0) {
        toast.error('No tests could be exported');
        return;
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ielts-tests-bulk-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Successfully exported ${exportData.tests.length} tests`);
    } catch (error) {
      console.error('Bulk export failed:', error);
      toast.error('Failed to export tests');
    }
  };

  const bulkImportTests = async (files, currentFilters = {}) => {
    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const file of files) {
        try {
          const text = await file.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch (_e) {
            console.warn(`Invalid JSON in file ${file.name}`);
            failCount++;
            continue;
          }

          // Check if it's a bulk export file (multiple tests)
          if (data.tests && Array.isArray(data.tests)) {
            for (const testData of data.tests) {
              const result = await importSingleTest(testData);
              if (result) successCount++;
              else failCount++;
            }
          } else if (data.passage && Array.isArray(data.questions)) {
            // Single test file
            const result = await importSingleTest(data);
            if (result) successCount++;
            else failCount++;
          } else {
            console.warn(`Invalid format in file ${file.name}`);
            failCount++;
          }
        } catch (_e) {
          console.error(`Error processing file ${file.name}:`, _e);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          `Successfully imported ${successCount} test${successCount > 1 ? 's' : ''}${failCount > 0 ? `, ${failCount} failed` : ''}`
        );
      } else if (failCount > 0) {
        toast.error(`Failed to import ${failCount} test${failCount > 1 ? 's' : ''}`);
      }

      fetchAllData(currentFilters, pagination.page, pagination.pageSize);
      return successCount > 0;
    } catch (error) {
      console.error('Bulk import failed:', error);
      toast.error(error.message || 'Failed to import tests');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    passages,
    questions,
    sessions,
    pagination,
    loading,
    fetchAllData,
    deleteTest,
    duplicateTest,
    bulkDeleteTests,
    bulkUpdateStatus,
    exportTest,
    importTest,
    bulkExportTests,
    bulkImportTests,
  };
};
