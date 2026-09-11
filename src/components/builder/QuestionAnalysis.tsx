import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, X, BookOpen, MessageCircle, ChevronDown, ChevronUp, Clock, ArrowRight, Target } from "lucide-react";
import { useState } from "react";

interface QuestionAnalysisItem {
  questionIndex: number;
  questionText: string;
  questionType: string;
  options: Array<{
    text: string;
    isCorrect: boolean;
    count: number;
    percentage: number;
  }>;
  explanation?: string;
  correctAnswer?: string;
  studentResponses?: Array<{ studentName: string; answer: string }>;
  totalResponses: number;
  // Flashcard-specific
  ratingDistribution?: { hard: number; good: number; easy: number };
  avgTimeSpent?: number;
  // Matching-specific
  successRate?: number;
  totalAttempts?: number;
  failedAttempts?: number;
}

interface QuestionAnalysisProps {
  questions: QuestionAnalysisItem[];
  appType?: string;
}

const QuestionAnalysis = ({ questions, appType }: QuestionAnalysisProps) => {
  // Initialize with all questions expanded by default
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(() => 
    new Set(questions?.map((_, idx) => idx) || [])
  );

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  if (!questions || questions.length === 0) {
    const emptyMessage = appType === "flashcards" 
      ? "No card data available yet. Students need to complete the flashcard deck first."
      : appType === "matching"
      ? "No pair data available yet. Students need to play the matching game first."
      : "No question data available yet. Students need to complete the quiz first.";
    
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Get item label based on app type
  const getItemLabel = () => {
    if (appType === "flashcards") return "Card";
    if (appType === "matching") return "Pair";
    return "Q";
  };

  return (
    <div className="space-y-4">
      {questions.map((question, idx) => {
        const isExpanded = expandedQuestions.has(idx);
        const isFlashcard = question.questionType === 'flashcard';
        const isMatchingPair = question.questionType === 'matching-pair';
        const isGradable = ['multiple-choice', 'true-false', 'short-answer', 'fill-blank'].includes(question.questionType);
        const isOpenEnded = question.questionType === 'open-ended';
        const isPoll = question.questionType === 'poll';
        const isWordCloud = question.questionType === 'word-cloud';
        const isSlide = question.questionType === 'slide';

        // Skip slides
        if (isSlide) return null;

        return (
          <Card key={idx} className="overflow-hidden">
            <CardContent className="p-0">
              {/* Question Header */}
              <button
                onClick={() => toggleExpand(idx)}
                className="w-full p-4 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Question Number Badge */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {question.questionIndex + 1}
                  </div>

                  {/* Question Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        {isMatchingPair ? (
                          <div className="flex items-center gap-2 font-medium text-sm leading-relaxed">
                            <span>{question.questionText}</span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">{question.correctAnswer}</span>
                          </div>
                        ) : (
                          <p className="font-medium text-sm leading-relaxed">{question.questionText}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs capitalize">
                            {isFlashcard ? 'Flashcard' : isMatchingPair ? 'Pair' : question.questionType.replace('-', ' ')}
                          </Badge>
                          {isFlashcard && question.ratingDistribution && (
                            <span className="text-xs text-muted-foreground">
                              {question.ratingDistribution.hard + question.ratingDistribution.good + question.ratingDistribution.easy} reviews
                            </span>
                          )}
                          {isMatchingPair && question.totalAttempts !== undefined && (
                            <>
                              <span className="text-xs text-muted-foreground">
                                {question.totalAttempts} attempts
                              </span>
                              {question.successRate !== undefined && (
                                <Badge variant={question.successRate >= 80 ? "default" : question.successRate >= 50 ? "secondary" : "destructive"} className="text-xs">
                                  {question.successRate}% success
                                </Badge>
                              )}
                            </>
                          )}
                          {!isFlashcard && !isMatchingPair && (
                            <span className="text-xs text-muted-foreground">
                              {question.totalResponses} response{question.totalResponses !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t bg-muted/10">
                  {/* Flashcard Rating Distribution */}
                  {isFlashcard && question.ratingDistribution && (
                    <div className="pt-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                        <Target className="w-4 h-4" />
                        Rating Distribution
                      </div>
                      
                      {/* Hard */}
                      <div className="flex items-center gap-3 p-3 rounded-lg border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                        <span className="text-lg">😓</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Hard</span>
                            <span className="text-sm">{question.ratingDistribution.hard}</span>
                          </div>
                          <Progress 
                            value={question.totalResponses > 0 ? (question.ratingDistribution.hard / question.totalResponses) * 100 : 0} 
                            className="h-2 [&>div]:bg-red-500"
                          />
                        </div>
                      </div>
                      
                      {/* Good */}
                      <div className="flex items-center gap-3 p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                        <span className="text-lg">😊</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Good</span>
                            <span className="text-sm">{question.ratingDistribution.good}</span>
                          </div>
                          <Progress 
                            value={question.totalResponses > 0 ? (question.ratingDistribution.good / question.totalResponses) * 100 : 0} 
                            className="h-2 [&>div]:bg-yellow-500"
                          />
                        </div>
                      </div>
                      
                      {/* Easy */}
                      <div className="flex items-center gap-3 p-3 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                        <span className="text-lg">😄</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Easy</span>
                            <span className="text-sm">{question.ratingDistribution.easy}</span>
                          </div>
                          <Progress 
                            value={question.totalResponses > 0 ? (question.ratingDistribution.easy / question.totalResponses) * 100 : 0} 
                            className="h-2 [&>div]:bg-green-500"
                          />
                        </div>
                      </div>
                      
                      {/* Answer (Back of card) */}
                      {question.correctAnswer && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            Answer (Back of Card)
                          </p>
                          <p className="text-sm">{question.correctAnswer}</p>
                        </div>
                      )}
                      
                      {/* Avg time */}
                      {question.avgTimeSpent !== undefined && question.avgTimeSpent > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                          <Clock className="w-4 h-4" />
                          Avg. time: {question.avgTimeSpent}s
                        </div>
                      )}
                    </div>
                  )}

                  {/* Matching Pair Details */}
                  {isMatchingPair && (
                    <div className="pt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-background p-3 rounded border">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Success Rate</p>
                          <p className="text-lg font-bold text-success">{question.successRate || 0}%</p>
                        </div>
                        <div className="bg-background p-3 rounded border">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Failed Attempts</p>
                          <p className="text-lg font-bold text-destructive">{question.failedAttempts || 0}</p>
                        </div>
                      </div>
                      
                      {question.avgTimeSpent !== undefined && question.avgTimeSpent > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          Avg. time to match: {question.avgTimeSpent}s
                        </div>
                      )}
                    </div>
                  )}

                  {/* Multiple Choice / True-False / Poll Options */}
                  {(isGradable || isPoll) && question.options && question.options.length > 0 && (
                    <div className="pt-4 space-y-2">
                      {question.options.map((option, optIdx) => {
                        const isCorrect = option.isCorrect;
                        const hasResponses = option.count > 0;
                        
                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                              isGradable && isCorrect
                                ? 'bg-success/10 border-success/30'
                                : hasResponses && !isCorrect && isGradable
                                ? 'bg-destructive/5 border-destructive/20'
                                : 'bg-background border-border'
                            }`}
                          >
                            {/* Option Letter */}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                              isGradable && isCorrect
                                ? 'bg-success text-success-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </div>

                            {/* Option Text */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{option.text}</p>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-24 sm:w-32">
                              <Progress 
                                value={option.percentage} 
                                className={`h-2 ${
                                  isGradable && isCorrect ? '[&>div]:bg-success' : 
                                  hasResponses && !isCorrect && isGradable ? '[&>div]:bg-destructive/60' : ''
                                }`}
                              />
                            </div>

                            {/* Count & Percentage */}
                            <div className="flex items-center gap-2 flex-shrink-0 min-w-[80px] justify-end">
                              <span className="text-sm font-medium">
                                {option.count}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({option.percentage}%)
                              </span>
                              {isGradable && (
                                isCorrect ? (
                                  <Check className="w-4 h-4 text-success" />
                                ) : hasResponses ? (
                                  <X className="w-4 h-4 text-destructive/60" />
                                ) : null
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Open-Ended Responses */}
                  {isOpenEnded && question.studentResponses && question.studentResponses.length > 0 && (
                    <div className="pt-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <MessageCircle className="w-4 h-4" />
                        Student Responses
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {question.studentResponses.map((response, rIdx) => (
                          <div key={rIdx} className="p-3 bg-background rounded-lg border">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {response.studentName}
                            </p>
                            <p className="text-sm">{response.answer}</p>
                          </div>
                        ))}
                      </div>
                      
                      {/* Suggested Answer for Open-Ended */}
                      {question.correctAnswer && (
                        <div className="mt-4 p-3 bg-success/10 rounded-lg border border-success/30">
                          <p className="text-xs font-medium text-success mb-1 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Suggested Answer
                          </p>
                          <p className="text-sm">{question.correctAnswer}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Word Cloud Responses */}
                  {isWordCloud && question.studentResponses && question.studentResponses.length > 0 && (
                    <div className="pt-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <MessageCircle className="w-4 h-4" />
                        Word Responses
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {question.studentResponses.slice(0, 30).map((response, rIdx) => (
                          <Badge key={rIdx} variant="secondary" className="text-sm">
                            {response.answer}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  {question.explanation && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        Explanation
                      </p>
                      <p className="text-sm">{question.explanation}</p>
                    </div>
                  )}

                  {/* Correct Answer for Short Answer / Fill Blank */}
                  {(question.questionType === 'short-answer' || question.questionType === 'fill-blank') && question.correctAnswer && (
                    <div className="mt-4 p-3 bg-success/10 rounded-lg border border-success/30">
                      <p className="text-xs font-medium text-success mb-1 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Correct Answer
                      </p>
                      <p className="text-sm font-medium">{question.correctAnswer}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default QuestionAnalysis;
