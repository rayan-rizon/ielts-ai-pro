-- Add explanation_data JSONB column to questions table
-- This stores structured paraphrase detective data for each question
-- Format: { passage_highlight, synonym_map, why_correct, why_wrong, blanks }
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS explanation_data JSONB DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN public.questions.explanation_data IS 'Structured explanation data for the Paraphrase Detective feature. Contains passage_highlight, synonym_map, why_correct, why_wrong fields.';
