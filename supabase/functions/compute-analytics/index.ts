import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appId } = await req.json();
    
    if (!appId) {
      throw new Error("appId is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch app to get its type
    const { data: app, error: appError } = await supabase
      .from("apps")
      .select("config")
      .eq("id", appId)
      .single();

    if (appError) throw appError;

    const appType = app?.config?.type || "quiz";
    const questions = app?.config?.questions || [];
    const cards = app?.config?.cards || [];
    const pairs = app?.config?.pairs || [];
    console.log("Computing analytics for app type:", appType);
    
    // Create question maps for quick lookup
    const questionTypeMap: Record<number, string> = {};
    const questionTextMap: Record<number, string> = {};
    const questionOptionsMap: Record<number, string[]> = {};
    const questionCorrectAnswerMap: Record<number, string | null> = {};
    const questionExplanationMap: Record<number, string | null> = {};
    
    questions.forEach((q: any, index: number) => {
      questionTypeMap[index] = q.questionType || 'multiple-choice';
      questionTextMap[index] = q.q || q.content || 'Question ' + (index + 1);
      questionOptionsMap[index] = q.options || [];
      questionCorrectAnswerMap[index] = q.answer || q.a || q.correctAnswer || null;
      questionExplanationMap[index] = q.explanation || null;
    });

    // Fetch all sessions for this app
    const { data: sessions, error: sessionsError } = await supabase
      .from("student_sessions")
      .select("*")
      .eq("app_id", appId);

    if (sessionsError) throw sessionsError;

    // Fetch all responses for these sessions with student names
    const sessionIds = sessions?.map(s => s.id) || [];
    
    // Create session id to student name map
    const sessionStudentMap: Record<string, string> = {};
    sessions?.forEach(s => {
      sessionStudentMap[s.id] = s.student_name;
    });
    
    const { data: responses, error: responsesError } = await supabase
      .from("student_responses")
      .select("*")
      .in("session_id", sessionIds);

    if (responsesError) throw responsesError;

    // Calculate metrics
    const totalPlays = sessions?.length || 0;
    const completedSessions = sessions?.filter(s => s.completed_at) || [];
    const completionRate = totalPlays > 0 ? (completedSessions.length / totalPlays) * 100 : 0;
    
    let avgScore = 0;
    let commonMistakes: Array<{ question: string; errorRate: number; attempts: number }> = [];
    
    // Question-by-question analysis for new UI
    let questionAnalysis: Array<{
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
    }> = [];

    // Calculate type-specific analytics
    let pollResults: any[] = [];
    let wordCloudData: any[] = [];
    let openEndedSummary: any[] = [];

    if (appType === "quiz") {
      // Calculate avg score for quiz
      const totalScorePercentage = completedSessions.reduce((sum, s) => {
        const scorePercent = s.total_questions > 0 ? ((s.score || 0) / s.total_questions) * 100 : 0;
        return sum + scorePercent;
      }, 0);
      avgScore = completedSessions.length > 0 ? totalScorePercentage / completedSessions.length : 0;

      // Build question-by-question analysis
      questions.forEach((q: any, qIndex: number) => {
        const qType = questionTypeMap[qIndex];
        const qText = questionTextMap[qIndex];
        const qOptions = questionOptionsMap[qIndex];
        const qCorrectAnswer = questionCorrectAnswerMap[qIndex];
        const qExplanation = questionExplanationMap[qIndex];
        
        // Get all responses for this question
        const questionResponses = responses?.filter(r => r.question_index === qIndex) || [];
        const totalResponses = questionResponses.length;
        
        // Build option distribution for multiple-choice, true-false, poll
        let optionDistribution: Array<{
          text: string;
          isCorrect: boolean;
          count: number;
          percentage: number;
        }> = [];
        
        if (['multiple-choice', 'true-false', 'poll'].includes(qType) && qOptions.length > 0) {
          const optionCounts: Record<string, number> = {};
          qOptions.forEach(opt => { optionCounts[opt] = 0; });
          
          questionResponses.forEach(r => {
            if (r.student_answer && optionCounts.hasOwnProperty(r.student_answer)) {
              optionCounts[r.student_answer]++;
            }
          });
          
          optionDistribution = qOptions.map(opt => ({
            text: opt,
            isCorrect: qCorrectAnswer === opt,
            count: optionCounts[opt] || 0,
            percentage: totalResponses > 0 ? Math.round((optionCounts[opt] / totalResponses) * 100) : 0
          }));
        }
        
        // Collect student responses for open-ended, word-cloud
        let studentResponsesList: Array<{ studentName: string; answer: string }> = [];
        if (['open-ended', 'word-cloud'].includes(qType)) {
          studentResponsesList = questionResponses
            .filter(r => r.student_answer)
            .map(r => ({
              studentName: sessionStudentMap[r.session_id] || 'Unknown',
              answer: r.student_answer
            }));
        }
        
        questionAnalysis.push({
          questionIndex: qIndex,
          questionText: qText,
          questionType: qType,
          options: optionDistribution,
          explanation: qExplanation || undefined,
          correctAnswer: qCorrectAnswer || undefined,
          studentResponses: studentResponsesList.length > 0 ? studentResponsesList : undefined,
          totalResponses
        });
      });
      
      // Find common mistakes (top 5 most missed questions)
      const questionStats: Record<string, { text: string; incorrect: number; total: number }> = {};
      
      responses?.forEach(r => {
        if (r.correct_answer !== null && r.is_correct !== null) {
          if (!questionStats[r.question_text]) {
            questionStats[r.question_text] = { text: r.question_text, incorrect: 0, total: 0 };
          }
          questionStats[r.question_text].total++;
          if (!r.is_correct) {
            questionStats[r.question_text].incorrect++;
          }
        }
      });

      commonMistakes = Object.values(questionStats)
        .sort((a, b) => b.incorrect - a.incorrect)
        .slice(0, 5)
        .map(q => ({
          question: q.text,
          errorRate: q.total > 0 ? Math.round((q.incorrect / q.total) * 100) : 0,
          attempts: q.total,
        }));

      // Calculate poll results from responses
      const pollStats: Record<string, Record<string, number>> = {};
      responses?.forEach(r => {
        if (questionTypeMap[r.question_index] === 'poll' && r.student_answer) {
          const currentQuestionText = questionTextMap[r.question_index];
          if (!pollStats[currentQuestionText]) {
            pollStats[currentQuestionText] = {};
          }
          const answer = r.student_answer;
          pollStats[currentQuestionText][answer] = (pollStats[currentQuestionText][answer] || 0) + 1;
        }
      });

      pollResults = Object.entries(pollStats).map(([question, votes]) => ({
        question,
        votes: Object.entries(votes).map(([option, count]) => ({ option, count })),
        totalVotes: Object.values(votes).reduce((sum: number, count) => sum + (count as number), 0),
      }));

      // Calculate word cloud data
      const wordStats: Record<string, Record<string, number>> = {};
      responses?.forEach(r => {
        if (questionTypeMap[r.question_index] === 'word-cloud' && r.student_answer) {
          const currentQuestionText = questionTextMap[r.question_index];
          if (!wordStats[currentQuestionText]) {
            wordStats[currentQuestionText] = {};
          }
          const words = r.student_answer.toLowerCase().split(/\s+/);
          words.forEach((word: string) => {
            if (word.length > 2) {
              wordStats[currentQuestionText][word] = (wordStats[currentQuestionText][word] || 0) + 1;
            }
          });
        }
      });

      wordCloudData = Object.entries(wordStats).map(([question, words]) => ({
        question,
        words: Object.entries(words)
          .map(([text, value]) => ({ text, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 50),
      }));

      // Calculate open-ended summaries
      const openEndedStats: Record<string, string[]> = {};
      responses?.forEach(r => {
        if (questionTypeMap[r.question_index] === 'open-ended' && r.student_answer) {
          const currentQuestionText = questionTextMap[r.question_index];
          if (!openEndedStats[currentQuestionText]) {
            openEndedStats[currentQuestionText] = [];
          }
          openEndedStats[currentQuestionText].push(r.student_answer);
        }
      });

      openEndedSummary = Object.entries(openEndedStats).map(([question, responses]) => ({
        question,
        responseCount: responses.length,
        sampleResponses: responses.slice(0, 5),
      }));

    } else if (appType === "flashcards") {
      // Calculate mastery level for flashcards
      // Easy = 100%, Good = 66%, Hard = 33%
      const ratingWeights = { easy: 100, good: 66, hard: 33 };
      let totalWeightedScore = 0;
      let totalRatings = 0;
      
      // Card-by-card analysis
      cards.forEach((card: any, cardIndex: number) => {
        const cardResponses = responses?.filter(r => r.question_index === cardIndex) || [];
        const ratingDist = { hard: 0, good: 0, easy: 0 };
        let totalTimeSpent = 0;
        
        cardResponses.forEach(r => {
          const rating = r.student_answer?.toLowerCase() as 'hard' | 'good' | 'easy';
          if (rating && ratingDist.hasOwnProperty(rating)) {
            ratingDist[rating]++;
            totalRatings++;
            totalWeightedScore += ratingWeights[rating];
          }
          totalTimeSpent += r.time_spent_seconds || 0;
        });
        
        const totalCardResponses = ratingDist.hard + ratingDist.good + ratingDist.easy;
        
        questionAnalysis.push({
          questionIndex: cardIndex,
          questionText: card.front,
          questionType: 'flashcard',
          options: [],
          correctAnswer: card.back,
          totalResponses: totalCardResponses,
          ratingDistribution: ratingDist,
          avgTimeSpent: totalCardResponses > 0 ? Math.round(totalTimeSpent / totalCardResponses) : 0
        });
      });
      
      // Calculate mastery level (weighted average)
      avgScore = totalRatings > 0 ? totalWeightedScore / totalRatings : 0;
      
      // Self-rating distribution for commonMistakes (for backward compatibility with charts)
      const overallRatingStats: Record<string, { rating: string; count: number }> = {
        hard: { rating: "Hard", count: 0 },
        good: { rating: "Good", count: 0 },
        easy: { rating: "Easy", count: 0 },
      };
      
      responses?.forEach(r => {
        const rating = r.student_answer?.toLowerCase();
        if (rating && overallRatingStats[rating]) {
          overallRatingStats[rating].count++;
        }
      });

      const totalOverallRatings = Object.values(overallRatingStats).reduce((sum, s) => sum + s.count, 0);
      
      // For "Needs Review" tab, show cards with high "Hard" ratings
      const needsReviewCards = questionAnalysis
        .filter(card => {
          const dist = card.ratingDistribution;
          if (!dist) return false;
          const total = dist.hard + dist.good + dist.easy;
          const hardRate = total > 0 ? (dist.hard / total) * 100 : 0;
          return hardRate >= 30; // Cards with 30%+ hard ratings
        })
        .sort((a, b) => {
          const aTotal = (a.ratingDistribution?.hard || 0) + (a.ratingDistribution?.good || 0) + (a.ratingDistribution?.easy || 0);
          const bTotal = (b.ratingDistribution?.hard || 0) + (b.ratingDistribution?.good || 0) + (b.ratingDistribution?.easy || 0);
          const aHardRate = aTotal > 0 ? ((a.ratingDistribution?.hard || 0) / aTotal) * 100 : 0;
          const bHardRate = bTotal > 0 ? ((b.ratingDistribution?.hard || 0) / bTotal) * 100 : 0;
          return bHardRate - aHardRate;
        });

      commonMistakes = needsReviewCards.slice(0, 5).map(card => {
        const total = (card.ratingDistribution?.hard || 0) + (card.ratingDistribution?.good || 0) + (card.ratingDistribution?.easy || 0);
        const hardRate = total > 0 ? Math.round(((card.ratingDistribution?.hard || 0) / total) * 100) : 0;
        return {
          question: card.questionText,
          errorRate: hardRate,
          attempts: total,
        };
      });

      // Also store overall rating distribution in a format the chart can use
      if (commonMistakes.length === 0) {
        commonMistakes = Object.values(overallRatingStats)
          .filter(r => r.count > 0)
          .map(r => ({
            question: r.rating,
            errorRate: totalOverallRatings > 0 ? Math.round((r.count / totalOverallRatings) * 100) : 0,
            attempts: r.count,
          }));
      }

    } else if (appType === "matching") {
      // Pair-by-pair analysis for matching games
      const pairStats: Record<number, { 
        prompt: string; 
        answer: string; 
        correct: number; 
        incorrect: number; 
        totalTime: number;
      }> = {};
      
      pairs.forEach((pair: any, pairIndex: number) => {
        pairStats[pairIndex] = {
          prompt: pair.prompt,
          answer: pair.answer,
          correct: 0,
          incorrect: 0,
          totalTime: 0
        };
      });
      
      // Process all responses
      responses?.forEach(r => {
        const pairIndex = r.question_index;
        if (pairStats[pairIndex]) {
          if (r.is_correct === true) {
            pairStats[pairIndex].correct++;
          } else if (r.is_correct === false) {
            pairStats[pairIndex].incorrect++;
          }
          pairStats[pairIndex].totalTime += r.time_spent_seconds || 0;
        }
      });
      
      // Build question analysis for pairs
      Object.entries(pairStats).forEach(([indexStr, stats]) => {
        const pairIndex = parseInt(indexStr);
        const totalAttempts = stats.correct + stats.incorrect;
        const successRate = totalAttempts > 0 ? Math.round((stats.correct / totalAttempts) * 100) : 100;
        
        questionAnalysis.push({
          questionIndex: pairIndex,
          questionText: stats.prompt,
          questionType: 'matching-pair',
          options: [],
          correctAnswer: stats.answer,
          totalResponses: totalAttempts,
          successRate,
          totalAttempts,
          failedAttempts: stats.incorrect,
          avgTimeSpent: totalAttempts > 0 ? Math.round(stats.totalTime / totalAttempts) : 0
        });
      });
      
      // Calculate average accuracy
      const totalCorrect = Object.values(pairStats).reduce((sum, s) => sum + s.correct, 0);
      const totalAttempts = Object.values(pairStats).reduce((sum, s) => sum + s.correct + s.incorrect, 0);
      avgScore = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
      
      // Challenging pairs (sorted by error rate)
      commonMistakes = questionAnalysis
        .filter(p => p.totalAttempts && p.totalAttempts > 0 && p.successRate !== undefined && p.successRate < 100)
        .sort((a, b) => (a.successRate || 0) - (b.successRate || 0))
        .slice(0, 5)
        .map(p => ({
          question: `${p.questionText} → ${p.correctAnswer}`,
          errorRate: 100 - (p.successRate || 0),
          attempts: p.totalAttempts || 0,
        }));
    }

    // Upsert analytics summary
    const { error: upsertError } = await supabase
      .from("analytics_summary")
      .upsert({
        app_id: appId,
        total_plays: totalPlays,
        avg_score: Number(avgScore.toFixed(2)),
        completion_rate: Number(completionRate.toFixed(2)),
        common_mistakes: commonMistakes,
        poll_results: pollResults,
        word_cloud_data: wordCloudData,
        open_ended_summary: openEndedSummary,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: "app_id"
      });

    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({
        success: true,
        analytics: {
          totalPlays,
          avgScore: Number(avgScore.toFixed(2)),
          completionRate: Number(completionRate.toFixed(2)),
          commonMistakes,
          pollResults,
          wordCloudData,
          openEndedSummary,
          questionAnalysis,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error computing analytics:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
