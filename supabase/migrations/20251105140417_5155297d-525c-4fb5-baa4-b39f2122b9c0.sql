-- Allow NULL values for correct_answer to support non-gradable questions
-- Non-gradable questions (poll, word-cloud, open-ended) don't have correct answers
ALTER TABLE student_responses 
ALTER COLUMN correct_answer DROP NOT NULL;