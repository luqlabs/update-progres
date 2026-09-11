-- Allow NULL values for is_correct to support non-gradable questions
-- Non-gradable questions (poll, word-cloud, open-ended) don't have a concept of correct/incorrect
ALTER TABLE student_responses 
ALTER COLUMN is_correct DROP NOT NULL;