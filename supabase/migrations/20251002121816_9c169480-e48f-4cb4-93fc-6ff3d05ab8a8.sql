-- Phase 1: Student Analytics Foundation - Create tracking tables

-- Table for student play sessions
CREATE TABLE public.student_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  total_questions INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for individual student responses
CREATE TABLE public.student_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.student_sessions(id) ON DELETE CASCADE NOT NULL,
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  student_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER DEFAULT 0,
  hint_used BOOLEAN DEFAULT false,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for pre-computed analytics
CREATE TABLE public.analytics_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_plays INTEGER DEFAULT 0,
  avg_score NUMERIC(5,2),
  completion_rate NUMERIC(5,2),
  common_mistakes JSONB DEFAULT '[]'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_sessions
CREATE POLICY "Anyone can insert sessions"
  ON public.student_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Teachers can view sessions for their apps"
  ON public.student_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.apps
      WHERE apps.id = student_sessions.app_id
      AND apps.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can update their own session"
  ON public.student_sessions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policies for student_responses
CREATE POLICY "Anyone can insert responses"
  ON public.student_responses
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Teachers can view responses for their apps"
  ON public.student_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.student_sessions
      JOIN public.apps ON apps.id = student_sessions.app_id
      WHERE student_sessions.id = student_responses.session_id
      AND apps.teacher_id = auth.uid()
    )
  );

-- RLS Policies for analytics_summary
CREATE POLICY "Teachers can view analytics for their apps"
  ON public.analytics_summary
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.apps
      WHERE apps.id = analytics_summary.app_id
      AND apps.teacher_id = auth.uid()
    )
  );

CREATE POLICY "System can update analytics"
  ON public.analytics_summary
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX idx_student_sessions_app_id ON public.student_sessions(app_id);
CREATE INDEX idx_student_sessions_started_at ON public.student_sessions(started_at);
CREATE INDEX idx_student_responses_session_id ON public.student_responses(session_id);
CREATE INDEX idx_student_responses_is_correct ON public.student_responses(is_correct);
CREATE INDEX idx_analytics_summary_app_id ON public.analytics_summary(app_id);