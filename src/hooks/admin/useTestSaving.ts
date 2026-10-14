import { useState } from 'react';
import { Passage } from '@/features/testing/shared/services/Passage';
import { Question } from '@/features/testing/shared/services/Question';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { TestData, Question as QuestionType, Passage as PassageType } from '@/types';

interface UseTestSavingReturn {
  saveTest: (
    data: TestData,
    isDraftOrOptions?: boolean | { isDraft?: boolean; silent?: boolean }
  ) => Promise<any>;
  saving: boolean;
}

export const useTestSaving = (onSuccess?: (passage: PassageType) => void): UseTestSavingReturn => {
  const [saving, setSaving] = useState(false);

  const saveReadingTest = async (
    {
      passage: passageData,
      questions: questionsData,
    }: { passage: PassageType; questions: QuestionType[] },
    silent = false
  ) => {
    setSaving(true);
    try {
      if (!passageData.title) {
        if (!silent) toast.error('Title is required');
        return;
      }

      const passagePayload = {
        title: passageData.title,
        test_type: passageData.test_type,
        test_format: passageData.test_format,
        topic: passageData.topic,
        content: passageData.content,
        is_official_cambridge: passageData.is_official_cambridge,
        cambridge_year: passageData.cambridge_year,
        cambridge_test_number: passageData.cambridge_test_number,
        access_tier: passageData.access_tier,
        audio_url: passageData.audio_url,
        // Preserve an existing published/draft status during edits and autosave.
        // New manual tests keep the original default; AI drafts stay inactive.
        is_active: typeof passageData.is_active === 'boolean' ? passageData.is_active : !silent,
        updated_at: new Date().toISOString(),
      };

      let savedPassage: PassageType;
      // 1. Save Passage
      if (passageData.id) {
        console.log('[saveReadingTest] Updating passage:', passageData.id);
        savedPassage = await Passage.update(passageData.id, passagePayload);
      } else {
        console.log('[saveReadingTest] Creating new passage:', passagePayload);
        savedPassage = await Passage.create(passagePayload);
      }

      if (!savedPassage || !savedPassage.id) {
        throw new Error('Failed to save or retrieve passage ID');
      }

      // 2. Questions Smart Sync
      // Separate into Existing (Update) and New (Create)
      if (questionsData && questionsData.length > 0) {
        const questionsToUpdate: Partial<QuestionType>[] = [];
        const questionsToCreate: Partial<QuestionType>[] = [];

        // Fetch existing explanation_data BEFORE delete/recreate cycle
        // This preserves admin-imported explanations when question IDs change
        let explanationMap: Map<number, unknown> = new Map();
        if (passageData.id) {
          const { data: existingQuestions } = await supabase
            .from('questions')
            .select('question_number, explanation_data')
            .eq('passage_id', savedPassage.id)
            .not('explanation_data', 'is', null);

          if (existingQuestions && existingQuestions.length > 0) {
            existingQuestions.forEach((eq: any) => {
              if (eq.question_number != null && eq.explanation_data != null) {
                explanationMap.set(eq.question_number, eq.explanation_data);
              }
            });
            console.log(
              '[saveReadingTest] Preserving explanation_data for',
              explanationMap.size,
              'questions'
            );
          }
        }

        questionsData.forEach((q) => {
          // New questions have IDs starting with 'q' (from editor)
          // Real UUIDs do not start with 'q' (hex only)
          const isTempId = q.id && String(q.id).startsWith('q');
          const { id, type, ...rest } = q;

          const payload: any = {
            ...rest,
            type: type || q.type || 'multiple_choice',
            passage_id: savedPassage.id,
          };

          // Carry over explanation_data from existing records if not already present
          if (!payload.explanation_data && payload.question_number != null) {
            const existingExplanation = explanationMap.get(payload.question_number);
            if (existingExplanation) {
              payload.explanation_data = existingExplanation;
            }
          }

          if (!isTempId && id) {
            payload.id = id;
            questionsToUpdate.push(payload);
          } else {
            questionsToCreate.push(payload);
          }
        });

        // Delete missing if editing (Robust Sync)
        if (passageData.id) {
          const keptIds = questionsToUpdate.map((q) => q.id);
          let deleteQuery = supabase.from('questions').delete().eq('passage_id', savedPassage.id);

          if (keptIds.length > 0) {
            const filterString = `(${keptIds.map((id) => `"${id}"`).join(',')})`;
            deleteQuery = deleteQuery.filter('id', 'not.in', filterString);
          }

          const { error: deleteError } = await deleteQuery;
          if (deleteError) throw deleteError;
        }

        // Perform Updates and Creates using Entity methods
        if (questionsToUpdate.length > 0) {
          await Question.bulkUpsert(questionsToUpdate);
        }
        if (questionsToCreate.length > 0) {
          await Question.bulkCreate(questionsToCreate);
        }
      } else if (passageData.id) {
        // If editing and no questions remain, clear all questions
        const { error: deleteError } = await supabase
          .from('questions')
          .delete()
          .eq('passage_id', savedPassage.id);
        if (deleteError) console.warn('Error clearing all questions:', deleteError);
      }

      if (!silent) {
        const typeLabel = passageData.test_type
          ? passageData.test_type.charAt(0).toUpperCase() + passageData.test_type.slice(1)
          : 'Reading';
        toast.success(`${typeLabel} test saved successfully.`);
      }
      if (onSuccess && !silent) onSuccess(savedPassage);
      return savedPassage; // Return savedPassage so caller can track the ID
    } catch (err: any) {
      console.error('Save Reading Test Error:', err);
      if (!silent) toast.error(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveStandardTest = async (testData: TestData, silent = false) => {
    setSaving(true);
    try {
      const validationErrors = validateCompleteTest(testData);
      if (validationErrors.length > 0) {
        if (!silent) toast.error(validationErrors.join('\n'));
        return;
      }

      // 1. Prepare clean passage payload (only valid columns)
      // This prevents Supabase errors from extra fields like 'writing_tasks' or 'isDraft'
      const passagePayload = {
        title: testData.title,
        test_type: testData.test_type,
        test_format: testData.test_format || 'academic',
        topic: testData.topic || 'general',
        content: testData.content,
        access_tier: testData.access_tier || 'free',
        is_official_cambridge: testData.is_official_cambridge || false,
        cambridge_year: testData.cambridge_year,
        cambridge_test_number: testData.cambridge_test_number,
        audio_url: testData.audio_url,
        // Default to active if manual saving, otherwise follow testData.is_active or isDraft
        is_active: testData.is_active !== undefined ? testData.is_active : !testData.isDraft,
        updated_at: new Date().toISOString(),
      };

      console.log('[useTestSaving] passagePayload:', passagePayload);
      console.log('[useTestSaving] testData.is_active:', testData.is_active);
      console.log('[useTestSaving] testData.isDraft:', testData.isDraft);

      let savedPassage: PassageType;
      if (testData.id) {
        console.log('[useTestSaving] Updating passage ID:', testData.id);
        savedPassage = await Passage.update(testData.id, passagePayload);
        if (!silent) toast.success('Test updated successfully.');
      } else {
        console.log('[useTestSaving] Creating new passage');
        savedPassage = await Passage.create(passagePayload);
        if (!silent) toast.success('Test created successfully.');
      }
      console.log('[useTestSaving] savedPassage result:', savedPassage);

      if (!savedPassage || !savedPassage.id) throw new Error('Failed to save test');

      // 2. Extract and save questions/tasks if present
      // CRITICAL: Skip for speaking tests if speaking_parts is absent,
      // because SpeakingTestEditor handles its own question saving.
      if (!(testData.test_type === 'speaking' && !testData.speaking_parts)) {
        await extractAndSaveQuestions(savedPassage, testData);
      }

      if (onSuccess && !silent) onSuccess(savedPassage);
      return savedPassage;
    } catch (err: any) {
      console.error('Save Test Error:', err);
      if (!silent) toast.error(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveTest = async (
    data: TestData,
    isDraftOrOptions: boolean | { isDraft?: boolean; silent?: boolean } = false
  ) => {
    const isDraft =
      typeof isDraftOrOptions === 'boolean' ? isDraftOrOptions : isDraftOrOptions?.isDraft || false;
    const silent =
      typeof isDraftOrOptions === 'object'
        ? isDraftOrOptions?.silent || false
        : typeof isDraftOrOptions === 'boolean'
          ? isDraftOrOptions
          : false;

    // Determine if it's a Reading test or standard test
    if (data.passage && Array.isArray(data.questions)) {
      return await saveReadingTest({ passage: data.passage, questions: data.questions }, silent);
    } else {
      // Ensure data has the isDraft property if needed by saveStandardTest
      return await saveStandardTest({ ...data, isDraft }, silent);
    }
  };

  return { saveTest, saving };
};

// --- Helpers ---

const validateCompleteTest = (testData: TestData): string[] => {
  const errors: string[] = [];
  if (!testData.title?.trim()) errors.push('Test title is required');
  if (!testData.test_type) errors.push('Test type is required');

  if (testData.test_type === 'listening') {
    if (!testData.listening_sections?.length) {
      errors.push('At least one listening section is required');
    }
  }

  if (testData.test_type === 'writing') {
    if (testData.writing_tasks?.length && testData.writing_tasks.length > 0) {
      testData.writing_tasks.forEach((task, idx) => {
        if (!task.prompt?.trim()) errors.push(`Writing Task ${idx + 1}: Prompt is required`);
      });
    }
  }

  if (testData.test_type === 'speaking') {
    // Only validate speaking_parts if it's explicitly provided (not stripped by SpeakingTestEditor)
    if (testData.speaking_parts !== undefined) {
      if (!testData.speaking_parts?.length) {
        errors.push('At least one speaking part is required');
      } else {
        testData.speaking_parts.forEach((part, idx) => {
          if (!part.part_name?.trim())
            errors.push(`Speaking Part ${idx + 1}: Part name is required`);
          if (!part.questions?.length)
            errors.push(`Speaking Part ${idx + 1}: At least one question is required`);
        });
      }
    }
    // If speaking_parts is undefined, SpeakingTestEditor is handling validation and saving parts separately
  }

  return errors;
};

const extractAndSaveQuestions = async (passage: PassageType, testData: TestData) => {
  // Clear existing questions for this passage first (Simple strategy for non-reading tests)
  // Since we reconstruct them from the JSON content anyway.
  await supabase.from('questions').delete().eq('passage_id', passage.id);

  let allQuestions: Partial<QuestionType>[] = [];
  let globalCounter = 1;

  if (testData.test_type === 'listening' && testData.listening_sections) {
    testData.listening_sections.forEach((section, sIdx) => {
      (section.questions || []).forEach((q) => {
        allQuestions.push({
          passage_id: passage.id,
          question_text: q.question_text || '',
          type: q.type || 'multiple_choice',
          options: q.options || [],
          correct_answer: q.correct_answer || '',
          allow_multiple: q.allow_multiple || null,
          question_count: q.question_count || null,
          question_number: globalCounter++,
          section: sIdx + 1,
        });
      });
    });
  } else if (testData.test_type === 'speaking' && testData.speaking_parts) {
    testData.speaking_parts.forEach((part, pIdx) => {
      (part.questions || []).forEach((q) => {
        allQuestions.push({
          passage_id: passage.id,
          question_text: typeof q === 'string' ? q : q.question_text || '', // Speaking questions might be strings or objects
          type: 'speaking_prompt',
          question_number: globalCounter++,
          section: pIdx + 1,
        });
      });
    });
  } else if (testData.test_type === 'writing' && testData.writing_tasks) {
    testData.writing_tasks.forEach((task, tIdx) => {
      allQuestions.push({
        passage_id: passage.id,
        question_text: task.prompt || '',
        type: 'writing_prompt',
        question_number: globalCounter++,
        section: tIdx + 1,
      });
    });
  }

  if (allQuestions.length > 0) {
    await Question.bulkCreate(allQuestions);
  }
};
