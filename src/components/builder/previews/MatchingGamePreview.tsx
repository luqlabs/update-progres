import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppConfig } from "@/pages/Builder";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

interface MatchingGamePreviewProps {
  config: AppConfig;
  sessionId?: string | null;
  studentName?: string;
}

const themeStyles = {
  indigo: {
    bg: "bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900",
    card: "bg-indigo-950/90 backdrop-blur-sm border-indigo-400/60",
    button: "bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400 text-white",
    selected: "bg-indigo-600/80 border-indigo-400 ring-2 ring-indigo-400",
    matched: "bg-green-600 border-green-500 ring-2 ring-green-400",
    text: "text-white",
  },
  emerald: {
    bg: "bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900",
    card: "bg-emerald-950/90 backdrop-blur-sm border-emerald-400/60",
    button: "bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-teal-300 text-white",
    selected: "bg-emerald-600/80 border-teal-400 ring-2 ring-teal-400",
    matched: "bg-lime-500 border-lime-400 ring-2 ring-lime-400",
    text: "text-white",
  },
  slate: {
    bg: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
    card: "bg-slate-900/90 backdrop-blur-sm border-slate-500/50",
    button: "bg-slate-200 hover:bg-white focus:ring-2 focus:ring-slate-400 text-slate-900",
    selected: "bg-slate-700/80 border-slate-300 ring-2 ring-slate-300",
    matched: "bg-emerald-600 border-emerald-500 ring-2 ring-emerald-400",
    text: "text-white",
  },
  blue: {
    bg: "bg-gradient-to-br from-blue-950 via-blue-900 to-cyan-900",
    card: "bg-blue-950/90 backdrop-blur-sm border-cyan-400/60",
    button: "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 text-white",
    selected: "bg-blue-600/80 border-cyan-400 ring-2 ring-cyan-400",
    matched: "bg-emerald-600 border-emerald-500 ring-2 ring-emerald-400",
    text: "text-white",
  },
  amber: {
    bg: "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50",
    card: "bg-white border-amber-200",
    button: "bg-amber-600 hover:bg-amber-700 focus:ring-2 focus:ring-amber-400 text-white",
    selected: "bg-amber-100 border-amber-600 ring-2 ring-amber-400",
    matched: "bg-green-100 border-green-600 ring-2 ring-green-400",
    text: "text-gray-900",
  },
  sky: {
    bg: "bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-50",
    card: "bg-white border-sky-200",
    button: "bg-sky-700 hover:bg-sky-800 focus:ring-2 focus:ring-sky-500 text-white",
    selected: "bg-sky-100 border-sky-700 ring-2 ring-sky-500",
    matched: "bg-teal-100 border-teal-600 ring-2 ring-teal-400",
    text: "text-gray-900",
  },
};

const LIGHT_THEMES = ["amber", "sky"];

const MatchingGamePreview = ({ config, sessionId, studentName }: MatchingGamePreviewProps) => {
  const [selectedPrompt, setSelectedPrompt] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());
  const [gameComplete, setGameComplete] = useState(false);
  const pairStartTimeRef = useRef<number>(Date.now());

  const pairs = config.pairs || [];
  const theme = themeStyles[config.theme] || themeStyles.indigo;
  const isDarkTheme = !LIGHT_THEMES.includes(config.theme);

  // Signature of the current pairs so edits in the builder flow through immediately
  const pairsSignature = JSON.stringify(pairs.map((p) => [p.prompt, p.answer]));

  // Shuffle answers (recomputed whenever the pairs actually change)
  const shuffledAnswers = useMemo(() => {
    const answers = pairs.map((p, i) => ({ text: p.answer, index: i }));
    return answers.sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairsSignature]);

  // Reset in-progress game state when the pairs are edited
  const isFirstRunRef = useRef(true);
  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }
    setSelectedPrompt(null);
    setSelectedAnswer(null);
    setMatchedPairs(new Set());
    setScore(0);
    setGameComplete(false);
  }, [pairsSignature]);

  useEffect(() => {
    if (matchedPairs.size === pairs.length && pairs.length > 0 && !gameComplete) {
      setGameComplete(true);
      handleGameComplete();
    }
  }, [matchedPairs, pairs.length]);


  const handleGameComplete = async () => {
    if (!sessionId) return;

    try {
      // Update session with final score
      await supabase.functions.invoke("play-data", {
        body: { action: "complete_session", session_id: sessionId, score },
      });
    } catch (error) {
      console.error("Error saving game results:", error);
    }
  };

  const saveAttempt = async (pairIndex: number, isCorrect: boolean, wrongAnswer?: string) => {
    if (!sessionId) return;
    
    const timeSpent = Math.floor((Date.now() - pairStartTimeRef.current) / 1000);
    const pair = pairs[pairIndex];
    
    try {
      await supabase.functions.invoke("play-data", {
        body: {
          action: "submit_response",
          session_id: sessionId,
          question_index: pairIndex,
          question_text: pair.prompt,
          student_answer: isCorrect ? pair.answer : (wrongAnswer || 'wrong'),
          correct_answer: pair.answer,
          is_correct: isCorrect,
          time_spent_seconds: timeSpent,
        },
      });
    } catch (error) {
      console.error("Error saving attempt:", error);
    }
  };


  const handlePromptClick = (index: number) => {
    if (matchedPairs.has(index)) return;
    
    // Start timing when first item is selected
    if (selectedPrompt === null && selectedAnswer === null) {
      pairStartTimeRef.current = Date.now();
    }
    
    setSelectedPrompt(selectedPrompt === index ? null : index);
    
    if (selectedAnswer !== null) {
      checkMatch(index, selectedAnswer);
    }
  };

  const handleAnswerClick = (index: number) => {
    if (matchedPairs.has(shuffledAnswers[index].index)) return;
    
    // Start timing when first item is selected
    if (selectedPrompt === null && selectedAnswer === null) {
      pairStartTimeRef.current = Date.now();
    }
    
    setSelectedAnswer(selectedAnswer === index ? null : index);
    
    if (selectedPrompt !== null) {
      checkMatch(selectedPrompt, index);
    }
  };

  const checkMatch = async (promptIndex: number, answerIndex: number) => {
    const answerOriginalIndex = shuffledAnswers[answerIndex].index;
    
    if (promptIndex === answerOriginalIndex) {
      // Correct match
      await saveAttempt(promptIndex, true);
      setMatchedPairs(new Set([...matchedPairs, promptIndex]));
      setScore(score + 1);
      setSelectedPrompt(null);
      setSelectedAnswer(null);
    } else {
      // Wrong match - save the failed attempt
      const wrongAnswerText = shuffledAnswers[answerIndex].text;
      await saveAttempt(promptIndex, false, wrongAnswerText);
      
      setTimeout(() => {
        setSelectedPrompt(null);
        setSelectedAnswer(null);
      }, 1000);
    }
  };

  if (gameComplete) {
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    const accuracy = pairs.length > 0 ? Math.round((score / pairs.length) * 100) : 0;
    
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center p-8`}>
        <Card className={`${theme.card} p-8 text-center max-w-md border-2`}>
          <Sparkles className={`w-16 h-16 mx-auto mb-4 ${isDarkTheme ? "text-yellow-400" : "text-orange-500"}`} />
          <h3 className={`text-3xl font-bold mb-4 ${isDarkTheme ? "text-white" : "text-foreground"}`}>
            Great Job! 🎉
          </h3>
          <div className={`text-6xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-foreground"}`}>
            {accuracy}%
          </div>
          <p className={`text-lg mb-4 ${isDarkTheme ? "text-white/70" : "text-muted-foreground"}`}>
            Match Accuracy
          </p>
          <p className={`text-xl mb-2 ${isDarkTheme ? "text-white/90" : "text-foreground"}`}>
            You matched {score} out of {pairs.length} pairs!
          </p>
          <p className={`${isDarkTheme ? "text-white/70" : "text-muted-foreground"}`}>
            Time: {totalTime} seconds
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} p-4 md:p-6`}>
      <div className="max-w-5xl mx-auto">
      <div className="text-center mb-6 md:mb-8">
          <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-foreground"}`}>
            {config.title}
          </h2>
          <p className={`text-base md:text-lg ${isDarkTheme ? "text-white/70" : "text-muted-foreground"}`}>
            Match {matchedPairs.size} / {pairs.length} pairs
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4 md:gap-6">
          {/* Prompts Column */}
          <div className="space-y-2 md:space-y-3 min-w-0" role="listbox" aria-label="Questions">
            <h3 className={`text-sm sm:text-base md:text-lg font-semibold mb-2 md:mb-4 ${isDarkTheme ? "text-white" : "text-foreground"}`}>
              Questions
            </h3>
            {pairs.map((pair, index) => (
              <Button
                key={index}
                role="option"
                aria-selected={selectedPrompt === index}
                onClick={() => handlePromptClick(index)}
                disabled={matchedPairs.has(index)}
                className={`w-full h-auto py-2.5 px-2.5 sm:py-3 sm:px-4 md:py-4 md:px-6 text-left justify-start whitespace-normal break-words leading-snug text-xs sm:text-sm md:text-base ${
                  matchedPairs.has(index)
                    ? theme.matched
                    : selectedPrompt === index
                    ? theme.selected
                    : theme.button
                } text-white border-2 transition-all min-h-12`}
              >
                <span dir="auto" className="whitespace-normal break-words">{pair.prompt}</span>
              </Button>
            ))}
          </div>

          {/* Answers Column */}
          <div className="space-y-2 md:space-y-3 min-w-0" role="listbox" aria-label="Answers">
            <h3 className={`text-sm sm:text-base md:text-lg font-semibold mb-2 md:mb-4 ${isDarkTheme ? "text-white" : "text-foreground"}`}>
              Answers
            </h3>
            {shuffledAnswers.map((item, index) => (
              <Button
                key={index}
                role="option"
                aria-selected={selectedAnswer === index}
                onClick={() => handleAnswerClick(index)}
                disabled={matchedPairs.has(item.index)}
                className={`w-full h-auto py-2.5 px-2.5 sm:py-3 sm:px-4 md:py-4 md:px-6 text-left justify-start whitespace-normal break-words leading-snug text-xs sm:text-sm md:text-base ${
                  matchedPairs.has(item.index)
                    ? theme.matched
                    : selectedAnswer === index
                    ? theme.selected
                    : theme.button
                } text-white border-2 transition-all min-h-12`}
              >
                <span dir="auto" className="whitespace-normal break-words">{item.text}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchingGamePreview;
