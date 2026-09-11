import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { AppConfig } from "@/pages/Builder";
import { supabase } from "@/integrations/supabase/client";

interface FlashcardsPreviewProps {
  config: AppConfig;
  sessionId?: string | null;
  studentName?: string;
}

const themeStyles = {
  indigo: {
    bg: "bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900",
    card: "bg-indigo-950/90 backdrop-blur-sm border-indigo-400/60 shadow-[0_8px_32px_rgba(40,0,80,0.25)]",
    button: "bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400 text-white",
    text: "text-white",
  },
  emerald: {
    bg: "bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900",
    card: "bg-emerald-950/90 backdrop-blur-sm border-emerald-400/60 shadow-[0_8px_32px_rgba(0,80,60,0.25)]",
    button: "bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-teal-300 text-white",
    text: "text-white",
  },
  slate: {
    bg: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
    card: "bg-slate-900/90 backdrop-blur-sm border-slate-500/50 shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
    button: "bg-slate-200 hover:bg-white focus:ring-2 focus:ring-slate-400 text-slate-900",
    text: "text-white",
  },
  blue: {
    bg: "bg-gradient-to-br from-blue-950 via-blue-900 to-cyan-900",
    card: "bg-blue-950/90 backdrop-blur-sm border-cyan-400/60 shadow-[0_8px_32px_rgba(0,80,120,0.25)]",
    button: "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 text-white",
    text: "text-white",
  },
  amber: {
    bg: "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50",
    card: "bg-white border-amber-200 shadow-[0_2px_8px_rgba(255,150,50,0.10)]",
    button: "bg-amber-600 hover:bg-amber-700 focus:ring-2 focus:ring-amber-400 text-white",
    text: "text-gray-900",
  },
  sky: {
    bg: "bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-50",
    card: "bg-white border-sky-200 shadow-[0_2px_8px_rgba(0,150,200,0.08)]",
    button: "bg-sky-700 hover:bg-sky-800 focus:ring-2 focus:ring-sky-500 text-white",
    text: "text-gray-900",
  },
};

const LIGHT_THEMES = ["amber", "sky"];

const FlashcardsPreview = ({ config, sessionId, studentName }: FlashcardsPreviewProps) => {
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardRatings, setCardRatings] = useState<Record<number, "hard" | "good" | "easy">>({});
  const [showRating, setShowRating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const cardStartTimeRef = useRef<number>(Date.now());

  const cards = config.cards || [];
  const card = cards[currentCard];
  const theme = themeStyles[config.theme] || themeStyles.indigo;
  const isDarkTheme = !LIGHT_THEMES.includes(config.theme);

  // Keep position valid when cards are added/removed while editing
  useEffect(() => {
    if (cards.length > 0 && currentCard > cards.length) {
      setCurrentCard(0);
      setIsFlipped(false);
      setShowRating(false);
      setShowResults(false);
    }
  }, [cards.length, currentCard]);

  // Reset timer when card changes
  useEffect(() => {
    cardStartTimeRef.current = Date.now();
  }, [currentCard]);


  const handleRating = async (rating: "hard" | "good" | "easy") => {
    const timeSpent = Math.floor((Date.now() - cardStartTimeRef.current) / 1000);
    setCardRatings({ ...cardRatings, [currentCard]: rating });
    setShowRating(false);

    // Save rating to database if session exists
    if (sessionId && card) {
      try {
        await supabase.functions.invoke("play-data", {
          body: {
            action: "submit_response",
            session_id: sessionId,
            question_index: currentCard,
            question_text: card.front,
            student_answer: rating,
            correct_answer: card.back,
            is_correct: null, // Flashcards are not graded
            time_spent_seconds: timeSpent,
          },
        });
      } catch (error) {
        console.error("Error saving rating:", error);
      }

    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      setShowRating(true);
    }
  };

  useEffect(() => {
    const completeSession = async () => {
      if (currentCard === cards.length && sessionId && cards.length > 0) {
        try {
          // Calculate mastery score: Easy=3, Good=2, Hard=1
          const score = Object.entries(cardRatings).reduce((sum, [_, rating]) => {
            const points = rating === "easy" ? 3 : rating === "good" ? 2 : 1;
            return sum + points;
          }, 0);
          
          await supabase.functions.invoke("play-data", {
            body: { action: "complete_session", session_id: sessionId, score },
          });

        } catch (error) {
          console.error("Error completing session:", error);
        }
      }
    };
    completeSession();
  }, [currentCard, cards.length, sessionId, cardRatings]);

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setIsFlipped(false);
      setShowRating(false);
    }
  };

  const handleNext = () => {
    if (currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1);
      setIsFlipped(false);
      setShowRating(false);
    }
  };

  const handleFinish = async () => {
    if (sessionId) {
      try {
        const score = Object.entries(cardRatings).reduce((sum, [_, rating]) => {
          const points = rating === "easy" ? 3 : rating === "good" ? 2 : 1;
          return sum + points;
        }, 0);

        await supabase.functions.invoke("play-data", {
          body: { action: "complete_session", session_id: sessionId, score },
        });

      } catch (error) {
        console.error("Error completing session:", error);
      }
    }
    setShowResults(true);
  };

  if (showResults) {
    const totalScore = Object.entries(cardRatings).reduce((sum, [_, rating]) => {
      const points = rating === "easy" ? 3 : rating === "good" ? 2 : 1;
      return sum + points;
    }, 0);
    const maxScore = cards.length * 3;
    const percentage = Math.round((totalScore / maxScore) * 100);

    // Calculate mastery breakdown
    const masteryBreakdown = {
      easy: Object.values(cardRatings).filter(r => r === 'easy').length,
      good: Object.values(cardRatings).filter(r => r === 'good').length,
      hard: Object.values(cardRatings).filter(r => r === 'hard').length,
    };

    return (
      <div className={`h-full ${theme.bg} flex items-center justify-center p-8`}>
        <Card className={`${theme.card} p-8 max-w-lg w-full text-center`}>
          <h2 className={`text-3xl font-bold mb-4 ${isDarkTheme ? "text-white" : "text-foreground"}`}>
            Great Job! 🎉
          </h2>
          <div className={`text-6xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-foreground"}`}>
            {percentage}%
          </div>
          <p className={`text-lg mb-4 ${isDarkTheme ? "text-white/70" : "text-muted-foreground"}`}>
            Mastery Level
          </p>
          <div className={`mb-6 space-y-2 ${isDarkTheme ? "text-white/80" : "text-foreground"}`}>
            <div className="flex justify-between items-center px-4">
              <span className="text-green-500">😄 Easy</span>
              <span className="font-medium">{masteryBreakdown.easy} cards</span>
            </div>
            <div className="flex justify-between items-center px-4">
              <span className="text-yellow-500">😊 Good</span>
              <span className="font-medium">{masteryBreakdown.good} cards</span>
            </div>
            <div className="flex justify-between items-center px-4">
              <span className="text-red-500">😓 Hard</span>
              <span className="font-medium">{masteryBreakdown.hard} cards</span>
            </div>
          </div>
          <div className={`mb-8 ${isDarkTheme ? "text-white/60" : "text-muted-foreground"}`}>
            <p className="mb-2">Cards reviewed: {Object.keys(cardRatings).length} / {cards.length}</p>
          </div>
          <Button
            onClick={() => {
              setCurrentCard(0);
              setCardRatings({});
              setIsFlipped(false);
              setShowRating(false);
              setShowResults(false);
            }}
            className={`${theme.button} text-white w-full`}
          >
            Review Again
          </Button>
        </Card>
      </div>
    );
  }

  if (!card) {
    return (
      <div className={`h-full ${theme.bg} flex items-center justify-center p-8`}>
        <p className="text-white text-lg">No flashcards available</p>
      </div>
    );
  }

  return (
    <div className={`h-full ${theme.bg} p-4 md:p-6 flex flex-col`}>
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-4 md:mb-6">
          <h2
            className={`text-xl md:text-2xl font-bold mb-2 ${
              isDarkTheme ? "text-white" : "text-foreground"
            }`}
          >
            {config.title}
          </h2>
          <p
            className={`text-sm ${
              isDarkTheme ? "text-white/70" : "text-muted-foreground"
            }`}
          >
            Card {currentCard + 1} of {cards.length}
          </p>
        </div>

        {/* Flashcard */}
        <div className="flex-1 flex items-center justify-center perspective-1000">
          <Card
            onClick={handleFlip}
            role="button"
            aria-label={isFlipped ? "Flip card to see question" : "Flip card to see answer"}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleFlip(); } }}
            className={`${theme.card} border-2 cursor-pointer transition-all duration-500 w-full max-w-lg h-64 sm:h-80 md:h-96 flex items-center justify-center p-4 md:p-8 hover:scale-105 ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            <div
              className="text-center"
              aria-live="polite"
              style={{
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              <p
                className={`text-sm uppercase tracking-wide mb-4 ${
                  isDarkTheme ? "text-white/60" : "text-muted-foreground"
                }`}
              >
                {isFlipped ? "Answer" : "Question"}
              </p>
              <p
                className={`text-lg sm:text-xl md:text-2xl font-bold ${
                  isDarkTheme ? "text-white" : "text-foreground"
                }`}
              >
                {isFlipped ? card.back : card.front}
              </p>
              <p
                className={`text-sm mt-6 ${
                  isDarkTheme ? "text-white/60" : "text-muted-foreground"
                }`}
              >
                <RotateCcw className="w-4 h-4 inline mr-1" />
                Click to flip
              </p>
            </div>
          </Card>
        </div>

        {/* Self-Rating Buttons */}
        {showRating && isFlipped && (
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-3 mt-4 md:mt-6">
            <Button
              onClick={() => handleRating("hard")}
              className="bg-red-600 hover:bg-red-700 text-white min-h-12 text-sm md:text-base flex-1 sm:flex-initial"
            >
              😓 Hard
            </Button>
            <Button
              onClick={() => handleRating("good")}
              className="bg-yellow-600 hover:bg-yellow-700 text-white min-h-12 text-sm md:text-base flex-1 sm:flex-initial"
            >
              😊 Good
            </Button>
            <Button
              onClick={() => handleRating("easy")}
              className="bg-green-600 hover:bg-green-700 text-white min-h-12 text-sm md:text-base flex-1 sm:flex-initial"
            >
              😄 Easy
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            onClick={handlePrevious}
            disabled={currentCard === 0}
            className={`${theme.button} text-white`}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Previous
          </Button>

          <span
            className={`px-4 ${
              isDarkTheme ? "text-white" : "text-foreground"
            }`}
          >
            {currentCard + 1} / {cards.length}
          </span>

          {currentCard === cards.length - 1 ? (
            <Button
              onClick={handleFinish}
              className={`${theme.button} text-white`}
            >
              Finish
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className={`${theme.button} text-white`}
            >
              Next
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashcardsPreview;
