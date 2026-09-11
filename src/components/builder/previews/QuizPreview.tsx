import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Lightbulb, ChevronLeft, ChevronRight, Clock, Pencil, Check, X, BookOpen } from "lucide-react";
import { AppConfig } from "@/pages/Builder";
import { supabase } from "@/integrations/supabase/client";
import TrueFalseQuestion from "./question-types/TrueFalseQuestion";
import ShortAnswerQuestion from "./question-types/ShortAnswerQuestion";
import FillBlankQuestion from "./question-types/FillBlankQuestion";
import PollQuestion from "./question-types/PollQuestion";
import WordCloudQuestion from "./question-types/WordCloudQuestion";
import OpenEndedQuestion from "./question-types/OpenEndedQuestion";
import InstructionalSlide from "./question-types/InstructionalSlide";
import ResultsScreen from "./ResultsScreen";
import Leaderboard from "./Leaderboard";
import AudioPlayer from "../AudioPlayer";

interface QuizPreviewProps {
  config: AppConfig;
  sessionId?: string | null;
  studentName?: string;
  isPreviewMode?: boolean;
  appId?: string | null;
  onConfigUpdate?: (config: AppConfig) => void;
}

const themeStyles = {
  indigo: {
    bg: "bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900",
    card: "bg-indigo-950/90 backdrop-blur-sm border-indigo-400/60 shadow-[0_8px_32px_rgba(40,0,80,0.25)]",
    button: "bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 text-white shadow-none transition-all",
    buttonSecondary: "bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-400/60 text-indigo-100 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 transition-all",
    correct: "bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-400 text-white",
    incorrect: "bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-400 text-white",
    text: "text-white",
    muted: "text-indigo-200",
    border: "border-indigo-400/60"
  },
  emerald: {
    bg: "bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900",
    card: "bg-emerald-950/90 backdrop-blur-sm border-emerald-400/60 shadow-[0_8px_32px_rgba(0,80,60,0.25)]",
    button: "bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-teal-300 focus:ring-offset-2 text-white shadow-none transition-all",
    buttonSecondary: "bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-400/60 text-emerald-100 focus:ring-2 focus:ring-teal-300 focus:ring-offset-2 transition-all",
    correct: "bg-lime-500 hover:bg-lime-600 focus:ring-2 focus:ring-lime-400 text-white",
    incorrect: "bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-400 text-white",
    text: "text-white",
    muted: "text-emerald-200",
    border: "border-emerald-400/60"
  },
  slate: {
    bg: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
    card: "bg-slate-900/90 backdrop-blur-sm border-slate-500/50 shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
    button: "bg-slate-200 hover:bg-white focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 text-slate-900 shadow-none transition-all",
    buttonSecondary: "bg-slate-700/40 hover:bg-slate-700/60 border border-slate-500/60 text-slate-100 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all",
    correct: "bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-400 text-white",
    incorrect: "bg-rose-600 hover:bg-rose-700 focus:ring-2 focus:ring-rose-400 text-white",
    text: "text-white",
    muted: "text-slate-300",
    border: "border-slate-500/50"
  },
  blue: {
    bg: "bg-gradient-to-br from-blue-950 via-blue-900 to-cyan-900",
    card: "bg-blue-950/90 backdrop-blur-sm border-cyan-400/60 shadow-[0_8px_32px_rgba(0,80,120,0.25)]",
    button: "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 text-white shadow-none transition-all",
    buttonSecondary: "bg-blue-600/20 hover:bg-blue-600/30 border border-cyan-400/60 text-cyan-100 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all",
    correct: "bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-400 text-white",
    incorrect: "bg-rose-600 hover:bg-rose-700 focus:ring-2 focus:ring-rose-400 text-white",
    text: "text-white",
    muted: "text-cyan-200",
    border: "border-cyan-400/60"
  },
  amber: {
    bg: "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50",
    card: "bg-white border-amber-200 shadow-[0_2px_8px_rgba(255,150,50,0.10)]",
    button: "bg-amber-600 hover:bg-amber-700 focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 text-white shadow-md transition-all",
    buttonSecondary: "bg-amber-600/10 hover:bg-amber-600/20 border border-amber-300 text-amber-800 focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 transition-all",
    correct: "bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-400 text-white",
    incorrect: "bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-400 text-white",
    text: "text-gray-900",
    muted: "text-gray-700",
    border: "border-amber-200"
  },
  sky: {
    bg: "bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-50",
    card: "bg-white border-sky-200 shadow-[0_2px_8px_rgba(0,150,200,0.08)]",
    button: "bg-sky-700 hover:bg-sky-800 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 text-white shadow-md transition-all",
    buttonSecondary: "bg-sky-700/10 hover:bg-sky-700/20 border border-sky-300 text-sky-900 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all",
    correct: "bg-teal-600 hover:bg-teal-700 focus:ring-2 focus:ring-teal-400 text-white",
    incorrect: "bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-400 text-white",
    text: "text-gray-900",
    muted: "text-gray-700",
    border: "border-sky-200"
  },
};

type ThemeKey = keyof typeof themeStyles;
const LIGHT_THEMES: ThemeKey[] = ["amber", "sky"];
const normalizeTheme = (t: unknown): ThemeKey =>
  (t && Object.prototype.hasOwnProperty.call(themeStyles, t as string) ? (t as ThemeKey) : "indigo");

// Group instructional slides with their following questions for shuffle
const groupQuestionsWithSlides = <T extends { questionType?: string }>(questions: T[]): T[][] => {
  const groups: T[][] = [];
  let currentGroup: T[] = [];
  
  for (const question of questions) {
    if (question.questionType === 'slide') {
      // Accumulate slides
      currentGroup.push(question);
    } else {
      // Non-slide question: add any accumulated slides + this question as a group
      currentGroup.push(question);
      groups.push(currentGroup);
      currentGroup = [];
    }
  }
  
  // Handle trailing slides (if quiz ends with slides, treat as standalone group)
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  
  return groups;
};

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const QuizPreview = ({ config, sessionId, studentName, isPreviewMode = false, appId, onConfigUpdate }: QuizPreviewProps) => {
  // Defensive check for incomplete config
  if (!config || !config.questions || !Array.isArray(config.questions)) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-muted-foreground">
        <p>Loading quiz preview...</p>
      </div>
    );
  }
  
  const [quizStarted, setQuizStarted] = useState(isPreviewMode);
  
  const handleStartQuiz = useCallback(() => {
    console.log("handleStartQuiz called, current quizStarted:", quizStarted);
    setQuizStarted(true);
  }, [quizStarted]);

  // Auto-start quiz in play mode (when student name exists)
  useEffect(() => {
    if (!isPreviewMode && studentName && !quizStarted) {
      handleStartQuiz();
    }
  }, [studentName, isPreviewMode, quizStarted, handleStartQuiz]);
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(config.title);
  const [activeSessionId, setActiveSessionId] = useState(sessionId);

  // Initialize questions with intelligent shuffle (only in play mode)
  // Track original indices for analytics
  // Use useMemo so it recalculates when config.questions changes (for preview updates)
  const shuffledQuestionsWithIndices = useMemo(() => {
    const rawQuestions = config.questions || [];
    
    // Add original index to each question
    const questionsWithIndices = rawQuestions.map((q, idx) => ({ ...q, _originalIndex: idx }));
    
    // Only shuffle in play mode (not preview) and if shuffle is enabled
    if (!isPreviewMode && config.shuffleQuestions && questionsWithIndices.length > 0) {
      // Group slides with following questions
      const groups = groupQuestionsWithSlides(questionsWithIndices);
      // Shuffle the groups
      const shuffledGroups = shuffleArray(groups);
      // Flatten back to single array
      return shuffledGroups.flat();
    }
    
    return questionsWithIndices;
  }, [config.questions, isPreviewMode, config.shuffleQuestions]);

  // Track previous questions length to detect actual changes (editing scenario)
  const prevQuestionsLengthRef = useRef(config.questions?.length || 0);

  // Reset current question if out of bounds after questions CHANGE (not during normal progression)
  useEffect(() => {
    const questionsLength = config.questions?.length || 0;
    const prevLength = prevQuestionsLengthRef.current;
    
    // Only reset if questions array length actually changed (editing scenario)
    // AND current question is now out of valid range
    if (questionsLength !== prevLength) {
      prevQuestionsLengthRef.current = questionsLength;
      
      if (currentQuestion >= questionsLength && questionsLength > 0) {
        setCurrentQuestion(0);
      }
    }
  }, [config.questions?.length, currentQuestion]);

  const questions = shuffledQuestionsWithIndices;
  const question = questions[currentQuestion];
  const themeKey = normalizeTheme(config.theme);
  const theme = themeStyles[themeKey];
  
  // Derive feedbackMode with backward compatibility
  const feedbackMode = config.feedbackMode || (config.showCorrectAnswers === false ? 'basic' : 'full');
  
  // Check against all accepted answers
  const normalizeString = (str: string) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };
  
  const answersToCheckForDisplay = question?.acceptedAnswers && question.acceptedAnswers.length > 0 
    ? question.acceptedAnswers 
    : [question?.answer];
  
  const isCorrect = selectedAnswer && answersToCheckForDisplay.some(
    (acceptedAnswer) => normalizeString(selectedAnswer) === normalizeString(acceptedAnswer || '')
  );
  
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // Helper functions to distinguish gradable questions from non-gradable items
  const isGradableQuestion = (q: any) => {
    const nonGradableTypes = ['slide', 'poll', 'word-cloud', 'open-ended'];
    return !nonGradableTypes.includes(q?.questionType);
  };

  const gradableQuestions = questions.filter(isGradableQuestion);
  const gradableCount = gradableQuestions.length;
  
  // Get current position among gradable questions only
  const gradableQuestionsBeforeCurrent = questions.slice(0, currentQuestion).filter(isGradableQuestion).length;
  const currentGradableNumber = isGradableQuestion(question) ? gradableQuestionsBeforeCurrent + 1 : null;

  // Helper function to get question type label for shortcuts
  const getQuestionTypeLabel = (q: any, index: number): string => {
    switch (q?.questionType) {
      case 'slide':
        return 'S';
      case 'poll':
        return 'P';
      case 'word-cloud':
        return 'W';
      case 'open-ended':
        return 'O';
      default:
        return (index + 1).toString();
    }
  };

  // Generate appropriate label for current item
  const getItemLabel = () => {
    if (!question) return '';
    
    switch (question.questionType) {
      case 'slide':
        return `Slide`;
      case 'poll':
        return `Poll`;
      case 'word-cloud':
      case 'open-ended':
        return `Activity`;
      default:
        return `Question ${currentGradableNumber} of ${gradableCount}`;
    }
  };

  useEffect(() => {
    setQuestionStartTime(Date.now());
    
    // Initialize timer for the new question (only if quiz has started)
    const timerSeconds = question?.timerSeconds ?? config.timerSeconds;
    if (quizStarted && timerSeconds && timerSeconds > 0) {
      setTimeRemaining(timerSeconds);
      setTimerActive(true);
    } else {
      setTimeRemaining(null);
      setTimerActive(false);
    }
  }, [currentQuestion, question, config.timerSeconds, quizStarted]);

  // Timer countdown effect
  useEffect(() => {
    if (!timerActive || timeRemaining === null || timeRemaining <= 0 || showFeedback) {
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          setTimerActive(false);
          // Time's up - auto-submit empty answer
          handleAnswer("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, timeRemaining, showFeedback]);

  // Stop timer when feedback is shown
  useEffect(() => {
    if (showFeedback) {
      setTimerActive(false);
    }
  }, [showFeedback]);

  // Auto-proceed in 'none' feedback mode (exam mode)
  useEffect(() => {
    if (showFeedback && feedbackMode === 'none' && !isPreviewMode) {
      // Small delay to allow response to be saved, then auto-proceed
      const timer = setTimeout(() => {
        handleNext();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showFeedback, feedbackMode, isPreviewMode]);

  // Keyboard navigation in preview mode
  useEffect(() => {
    if (!isPreviewMode) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentQuestion > 0) {
        handlePrevious();
      } else if (e.key === "ArrowRight" && currentQuestion < questions.length - 1) {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentQuestion, questions.length, isPreviewMode]);

  const handleAnswer = async (answer: string) => {
    console.log("handleAnswer called", { answer, questionType: question.questionType, showFeedback });
    setSelectedAnswer(answer);
    setShowFeedback(true);
    setTimerActive(false); // Stop timer when answer is submitted
    
    // Check if this is a non-gradable question type
    const isNonGradable = ['poll', 'word-cloud', 'open-ended', 'slide'].includes(question.questionType);
    
    let correct = false;
    
    // Only validate and score gradable questions
    if (!isNonGradable) {
      // Check against all accepted answers (case-insensitive)
      const answersToCheck = question.acceptedAnswers && question.acceptedAnswers.length > 0 
        ? question.acceptedAnswers 
        : [question.answer];

      console.log("🔍 Answer Validation Debug:", {
        userAnswer: answer,
        primaryAnswer: question.answer,
        acceptedAnswers: question.acceptedAnswers,
        answersToCheck,
        questionType: question.questionType
      });

      // Normalize and clean strings more aggressively
      const normalizeString = (str: string) => {
        return str
          .toLowerCase()
          .trim()
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .normalize('NFD') // Normalize unicode
          .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
      };

      console.log("🔍 Detailed Answer Comparison:", {
        userAnswerNormalized: normalizeString(answer),
        userAnswerCharCodes: Array.from(answer).map(c => c.charCodeAt(0)),
        acceptedAnswersNormalized: answersToCheck.map(normalizeString),
        acceptedAnswersCharCodes: answersToCheck.map(a => Array.from(a).map(c => c.charCodeAt(0)))
      });

      correct = answersToCheck.some(
        (acceptedAnswer) => normalizeString(answer) === normalizeString(acceptedAnswer)
      );
      
      if (correct) {
        setScore(score + 1);
      }
      console.log("After setting showFeedback to true, correct:", correct);
    }

    // Track response if session exists
    if (activeSessionId && question) {
      const timeSpent = Math.max(1, Math.floor((Date.now() - questionStartTime) / 1000)); // Minimum 1 second
      try {
        await supabase.functions.invoke("play-data", {
          body: {
            action: "submit_response",
            session_id: activeSessionId,
            question_index: question._originalIndex ?? currentQuestion, // Use original index for analytics
            question_text: question.q,
            student_answer: answer,
            correct_answer: isNonGradable ? null : (question.answer || null),
            is_correct: isNonGradable ? null : correct,
            time_spent_seconds: timeSpent,
            hint_used: showHint,
          },
        });
      } catch (error) {
        console.error("Error saving response:", error);
      }

    }
  };

  const handleNext = async () => {
    console.log("handleNext clicked", { currentQuestion, totalQuestions: questions.length });
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setShowHint(false);
      console.log("Moving to question", currentQuestion + 1);
    } else if (currentQuestion === questions.length - 1) {
      // On last question, complete session FIRST, then advance to results
      if (activeSessionId && questions.length > 0) {
        try {
          await supabase.functions.invoke("play-data", {
            body: {
              action: "complete_session",
              session_id: activeSessionId,
              score,
              total_questions: gradableCount,
            },
          });
        } catch (error) {
          console.error("Error completing session:", error);
        }
      }
      setCurrentQuestion(questions.length);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setShowHint(false);
    }
  };


  const handlePlayAgain = async () => {
    // Create new session in play mode to reset time tracking
    if (!isPreviewMode && activeSessionId && studentName && appId) {
      try {
        const { data, error } = await supabase.functions.invoke("play-data", {
          body: {
            action: "start_session",
            app_id: appId,
            student_name: studentName,
            total_questions: gradableCount,
          },
        });

        if (error) throw error;
        if (data?.session_id) {
          setActiveSessionId(data.session_id);
        }
      } catch (error) {
        console.error("Error creating new session:", error);
      }
    }
    

    
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);
    setShowHint(false);
    setShowLeaderboard(false);
    setQuestionStartTime(Date.now());
  };

  if (!question) {
    if (showLeaderboard && appId) {
      return (
        <Leaderboard
          appId={appId}
          currentSessionId={activeSessionId}
          onBack={() => setShowLeaderboard(false)}
          theme={theme}
        />
      );
    }

    return (
      <ResultsScreen
        score={score}
        totalQuestions={gradableCount}
        config={config}
        sessionId={activeSessionId}
        studentName={studentName}
        onPlayAgain={handlePlayAgain}
        onViewLeaderboard={() => setShowLeaderboard(true)}
        theme={theme}
      />
    );
  }

  const isDarkTheme = !LIGHT_THEMES.includes(themeKey);

  // Show welcome screen before starting quiz
  if (!quizStarted) {
    return (
      <div className={`h-full ${theme.bg} p-4 md:p-6 overflow-y-auto flex items-center justify-center`}>
        <Card className={`${theme.card} p-6 sm:p-8 md:p-12 max-w-lg w-full text-center space-y-4 md:space-y-6`}>
          <div>
            <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-3 md:mb-4 ${theme.text}`}>
              {config.title}
            </h2>
            {studentName && (
              <p className={`text-base md:text-lg ${theme.muted} mb-2`}>
                Welcome, {studentName}!
              </p>
            )}
          </div>
          
          <div className={`space-y-3 ${theme.text}`}>
            <div className="flex items-center justify-center gap-3 text-base md:text-lg">
              <Badge className={theme.button}>
                {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
              </Badge>
            </div>
            
            {(config.timerSeconds || questions.some(q => q.timerSeconds)) && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span className={theme.muted}>Timed questions included</span>
              </div>
            )}
          </div>

          <Button
            onClick={handleStartQuiz}
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full text-base md:text-lg py-4 md:py-6 min-h-12"
            size="lg"
            type="button"
          >
            Start Quiz
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={`h-full ${theme.bg} p-4 md:p-6 overflow-y-auto flex items-center justify-center`}>
      <div className="w-full max-w-2xl space-y-4 md:space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
            {isEditingTitle && isPreviewMode && onConfigUpdate ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editedTitle.trim() && editedTitle !== config.title) {
                        onConfigUpdate({ ...config, title: editedTitle.trim() });
                      }
                      setIsEditingTitle(false);
                    } else if (e.key === 'Escape') {
                      setEditedTitle(config.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  className={`text-2xl font-bold text-center w-96 ${isDarkTheme ? 'bg-white/10 text-white border-white/20' : ''}`}
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (editedTitle.trim() && editedTitle !== config.title) {
                      onConfigUpdate({ ...config, title: editedTitle.trim() });
                    }
                    setIsEditingTitle(false);
                  }}
                  className={isDarkTheme ? 'text-white hover:bg-white/10' : ''}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditedTitle(config.title);
                    setIsEditingTitle(false);
                  }}
                  className={isDarkTheme ? 'text-white hover:bg-white/10' : ''}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <h2
                  className={`text-lg sm:text-xl md:text-2xl font-bold ${theme.text}`}
                >
                  {config.title}
                </h2>
                {isPreviewMode && onConfigUpdate && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsEditingTitle(true)}
                    className={`${isDarkTheme ? 'text-white hover:bg-white/10' : ''}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
            {isPreviewMode && (
              <Badge variant="secondary" className="text-xs">
                Preview Mode
              </Badge>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <p
              className={`text-xs sm:text-sm ${theme.muted}`}
            >
              {getItemLabel()}
            </p>
            {timeRemaining !== null && timeRemaining >= 0 && (
              <div className={`flex items-center gap-2 ${timeRemaining <= 10 ? 'animate-pulse' : ''}`}>
                <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${timeRemaining <= 10 ? 'text-red-500' : theme.text}`} />
                <span className={`font-bold text-base sm:text-lg ${timeRemaining <= 10 ? 'text-red-500' : theme.text}`}>
                  {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
          <Progress value={progress} className="mt-2" />
        </div>

        {/* Question Card */}
          <Card className={`${theme.card} p-4 sm:p-5 md:p-6 border-2 ${theme.border}`}>
          {/* Render different question types */}
          {(!question.questionType || question.questionType === "multiple-choice") && 
           question.questionType !== "fill-blank" && 
           question.questionType !== "short-answer" && 
           question.questionType !== "word-cloud" && 
           question.questionType !== "open-ended" && 
           question.questionType !== "slide" && (
            <>
              <h3
                className={`text-base md:text-lg lg:text-xl font-semibold mb-4 md:mb-6 ${theme.text}`}
              >
                <span dir="auto">{question.q}</span>
              </h3>

              {/* Question Image */}
              {question.image && (
                <div className="mb-4 md:mb-6 flex justify-center">
                  <img
                    src={question.image}
                    alt="Question illustration"
                    className="max-h-48 md:max-h-64 rounded-lg object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Options */}
              <div className="space-y-3" role="group" aria-label="Answer options">
                {question.options.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const isAnswer = option === question.answer;
                  const showAnswerVisually = feedbackMode === 'full';
                  const optionImage = question.optionImages?.[index];
                  let buttonStyle = theme.button;

                  if (showFeedback && feedbackMode !== 'none') {
                    if (isSelected && isCorrect) {
                      buttonStyle = theme.correct;
                    } else if (isSelected && !isCorrect) {
                      buttonStyle = theme.incorrect;
                    } else if (isAnswer && showAnswerVisually) {
                      buttonStyle = theme.correct;
                    }
                  }

                  return (
                    <Button
                      key={index}
                      onClick={() => !showFeedback && handleAnswer(option)}
                      disabled={showFeedback}
                      aria-pressed={isSelected}
                      className={`w-full text-left justify-between h-auto py-3 px-4 md:py-4 md:px-6 rounded-md font-semibold min-h-12 text-sm md:text-base ${buttonStyle} transition-all`}
                      variant="default"
                    >
                      <span className="flex items-center gap-3">
                        <span className="font-bold text-base flex-shrink-0">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        {optionImage && (
                          <img
                            src={optionImage}
                            alt={`Option ${String.fromCharCode(65 + index)}`}
                            className="w-10 h-10 md:w-12 md:h-12 rounded object-cover flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <span dir="auto" className="font-medium whitespace-normal break-words">{option}</span>
                      </span>
                      {showFeedback && isAnswer && (isSelected || showAnswerVisually) && (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      {showFeedback && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5" />
                      )}
                      {!showFeedback && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </Button>
                  );
                })}
              </div>
            </>
          )}

          {question.questionType === "true-false" && (
            <TrueFalseQuestion
              question={question.q}
              questionImage={question.image}
              correctAnswer={question.answer}
              selectedAnswer={selectedAnswer}
              showFeedback={showFeedback}
              onAnswer={handleAnswer}
              theme={theme}
              isDarkTheme={isDarkTheme}
              feedbackMode={feedbackMode}
            />
          )}

          {question.questionType === "short-answer" && (
            <ShortAnswerQuestion
              question={question.q}
              questionImage={question.image}
              correctAnswer={question.answer}
              acceptedAnswers={question.acceptedAnswers}
              selectedAnswer={selectedAnswer}
              showFeedback={showFeedback}
              onAnswer={handleAnswer}
              theme={theme}
              isDarkTheme={isDarkTheme}
              isPreviewMode={isPreviewMode}
            />
          )}

          {question.questionType === "fill-blank" && (
            <FillBlankQuestion
              question={question.q}
              questionImage={question.image}
              correctAnswer={question.answer}
              acceptedAnswers={question.acceptedAnswers}
              selectedAnswer={selectedAnswer}
              showFeedback={showFeedback}
              onAnswer={handleAnswer}
              theme={theme}
              isDarkTheme={isDarkTheme}
              isPreviewMode={isPreviewMode}
            />
          )}

          {question.questionType === "poll" && (
            <PollQuestion
              question={question.q}
              questionImage={question.image}
              options={question.options}
              selectedAnswer={selectedAnswer}
              showFeedback={showFeedback}
              onAnswer={handleAnswer}
              theme={theme}
              isDarkTheme={isDarkTheme}
              isPreviewMode={isPreviewMode}
            />
          )}

          {question.questionType === "word-cloud" && (
            <WordCloudQuestion
              question={question.q}
              selectedAnswer={selectedAnswer}
              showFeedback={showFeedback}
              onAnswer={handleAnswer}
              theme={theme}
              isDarkTheme={isDarkTheme}
              isPreviewMode={isPreviewMode}
            />
          )}

          {question.questionType === "open-ended" && (
            <OpenEndedQuestion
              question={question.q}
              selectedAnswer={selectedAnswer}
              showFeedback={showFeedback}
              onAnswer={handleAnswer}
              theme={theme}
              isDarkTheme={isDarkTheme}
              isPreviewMode={isPreviewMode}
            />
          )}

          {question.questionType === "slide" && (
            <InstructionalSlide
              content={question.content || question.q}
              onContinue={handleNext}
              theme={theme}
              isDarkTheme={isDarkTheme}
              isPreviewMode={isPreviewMode}
            />
          )}

          {/* Hint Section - Available before answering */}
          {question.hint && !showFeedback && question.questionType !== "slide" && (
            <div className="mt-6 space-y-4">
              {showHint && (
                <div
                  className={`p-4 rounded-lg bg-blue-500/20 border-2 border-blue-500`}
                >
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p
                        className={`font-semibold mb-1 ${theme.text}`}
                      >
                        Hint:
                      </p>
                      <p
                        className={`text-sm ${theme.muted}`}
                      >
                        {question.hint}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {!showHint && (
                <Button
                  onClick={() => setShowHint(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-400"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Show Hint
                </Button>
              )}
            </div>
          )}

          {/* Feedback - only show if feedbackMode is not 'none' */}
          {showFeedback && feedbackMode !== 'none' && question.questionType !== "slide" && question.questionType !== "poll" && question.questionType !== "word-cloud" && question.questionType !== "open-ended" && (() => {
            console.log("Rendering feedback section", { showFeedback, isCorrect, currentQuestion, totalQuestions: questions.length, feedbackMode });
            const showAnswer = feedbackMode === 'full';
            
            return (
              <div className="mt-6 space-y-4">
              <div
                  className={`p-4 rounded-lg ${
                    isCorrect
                      ? "bg-green-500/20 border-2 border-green-500"
                      : "bg-red-500/20 border-2 border-red-500"
                  }`}
                >
                 <p
                   className={`font-semibold ${theme.text}`}
                 >
                   {selectedAnswer === "" && timeRemaining === 0
                     ? showAnswer 
                       ? "⏱️ Time's up! The correct answer was: " + question.answer
                       : "⏱️ Time's up!"
                     : isCorrect
                     ? "🎉 Correct! Great job!"
                     : (question.questionType === "fill-blank" || question.questionType === "short-answer")
                     ? showAnswer
                       ? `Not quite right. Correct answer: ${question.answer}`
                       : "Not quite right. Keep trying!"
                     : "Not quite right. Try again next time!"}
                 </p>
              </div>

              {/* Explanation section - only show in full mode */}
              {feedbackMode === 'full' && question.explanation && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <p className={`font-semibold mb-1 ${theme.text}`}>Explanation</p>
                      <p className={`text-sm ${theme.muted}`}>{question.explanation}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {!isPreviewMode && (
                  <Button
                    onClick={handleNext}
                    className={`${theme.button} text-white ml-auto`}
                  >
                    {currentQuestion < questions.length - 1
                      ? "Next Question"
                      : "Finish Quiz"}
                  </Button>
                )}
              </div>
            </div>
          )})()}

          {/* Navigation for non-gradable questions (poll, word-cloud, open-ended) in play mode */}
          {showFeedback && 
           !isPreviewMode && 
           (question.questionType === "poll" || 
            question.questionType === "word-cloud" || 
            question.questionType === "open-ended") && (
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleNext}
                className={`${theme.button} text-white`}
              >
                {currentQuestion < questions.length - 1
                  ? "Next Question"
                  : "Finish Quiz"}
              </Button>
            </div>
          )}

          {/* Preview Mode Navigation */}
          {isPreviewMode && (
            <div className="mt-6 pt-4 border-t border-border/50">
              {/* Question Shortcuts - Always show for quick navigation */}
              {questions.length > 1 && (
                <div className="mb-4 pb-4 border-b border-border/30">
                  <p className={`text-xs mb-2 ${theme.muted}`}>Jump to:</p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {questions.map((q, index) => {
                      const isActive = index === currentQuestion;
                      const typeLabel = getQuestionTypeLabel(q, index);
                      
                      return (
                        <Button
                          key={index}
                          onClick={() => {
                            setCurrentQuestion(index);
                            setSelectedAnswer(null);
                            setShowFeedback(false);
                            setShowHint(false);
                          }}
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          className={`w-8 h-8 p-0 text-xs font-medium ${
                            isActive 
                              ? '' 
                              : 'hover:bg-primary/10'
                          }`}
                          title={`${q?.questionType === 'slide' ? 'Slide' : 'Question'} ${index + 1}`}
                        >
                          {typeLabel}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between gap-4">
                <Button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  variant="outline"
                  className={
                    "disabled:opacity-30"
                  }
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                <span
                  className={`text-sm font-medium ${theme.muted}`}
                >
                  {currentQuestion + 1} / {questions.length}
                </span>

                <Button
                  onClick={handleNext}
                  disabled={currentQuestion === questions.length - 1}
                  variant="outline"
                  className={
                      "disabled:opacity-30"
                  }
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
      
      {/* Background Audio Player */}
      {config.backgroundAudio && (
        <AudioPlayer
          audioUrl={config.backgroundAudio}
          defaultVolume={config.audioVolume}
          shouldPlay={quizStarted}
        />
      )}
    </div>
  );
};

export default QuizPreview;
