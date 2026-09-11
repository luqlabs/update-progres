import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Users, TrendingUp, AlertCircle, RefreshCw, Clock, Download, Calendar, Lock, Trash2, ChevronDown, ChevronUp, ArrowUpDown, Award, Target, Zap, Eye, Filter, ListChecks, ArrowUp, ArrowDown, FileText, FileSpreadsheet, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StudentDetailModal from "./StudentDetailModal";
import ConfirmDialog from "./ConfirmDialog";
import QuestionAnalysis from "./QuestionAnalysis";
import AIOverviewCard from "./AIOverviewCard";
import { useFeatures } from "@/hooks/useFeatures";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnalyticsSkeleton } from "./AnalyticsSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AnalyticsPanelProps {
  appId: string;
  appConfig?: any;
}

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
}

interface Analytics {
  total_plays: number;
  avg_score: number;
  completion_rate: number;
  common_mistakes: Array<{
    question: string;
    errorRate: number;
    attempts: number;
  }>;
  poll_results?: Array<{
    question: string;
    votes: Array<{ option: string; count: number }>;
    totalVotes: number;
  }>;
  word_cloud_data?: Array<{
    question: string;
    words: Array<{ text: string; value: number }>;
  }>;
  open_ended_summary?: Array<{
    question: string;
    responseCount: number;
    sampleResponses: string[];
  }>;
  questionAnalysis?: QuestionAnalysisItem[];
}

interface StudentSession {
  id: string;
  student_name: string;
  score: number | null;
  completed_at: string | null;
  started_at: string;
  total_questions: number;
  gradable_count?: number; // Client-side calculated gradable question count
}

const AnalyticsPanel = ({ appId, appConfig }: AnalyticsPanelProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasFeature, isLoading: featuresLoading } = useFeatures();
  const hasAdvancedAnalytics = hasFeature('advanced_analytics');
  const [dateRange, setDateRange] = useState<string>("0");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [expandedMistakes, setExpandedMistakes] = useState<Set<number>>(new Set());
  const [mistakeSortBy, setMistakeSortBy] = useState<'errorRate' | 'attempts'>('errorRate');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'completed' | 'in-progress'>('all');
  const [sortColumn, setSortColumn] = useState<'name' | 'submission' | 'duration' | 'score'>('submission');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'questions' | 'mistakes' | 'participants'>('questions');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; sessionId: string; studentName: string }>({ open: false, sessionId: '', studentName: '' });

  // Helper to calculate gradable question count from responses
  const calculateGradableCount = async (sessionId: string): Promise<number> => {
    const { data: responses } = await supabase
      .from('student_responses')
      .select('correct_answer, is_correct')
      .eq('session_id', sessionId);
    
    if (!responses) return 0;
    return responses.filter(r => r.correct_answer !== null && r.is_correct !== null).length;
  };

  // React Query for analytics data with caching
  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['analytics-panel-data', appId, dateRange],
    queryFn: async () => {
      // Compute analytics to ensure fresh data and get questionAnalysis
      const computeResult = await supabase.functions.invoke('compute-analytics', { body: { appId } });
      const questionAnalysis = computeResult.data?.analytics?.questionAnalysis || [];
      
      // Build sessions query - apply date filter only if not "All Time"
      let sessionsQuery = supabase
        .from("student_sessions")
        .select("*")
        .eq("app_id", appId)
        .order("started_at", { ascending: false })
        .limit(100);
      
      if (dateRange !== "0") {
        const daysAgo = parseInt(dateRange);
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
        sessionsQuery = sessionsQuery.gte("started_at", dateThreshold.toISOString());
      }
      
      // Fetch analytics summary and sessions in parallel
      const [analyticsResult, sessionsResult] = await Promise.all([
        supabase
          .from("analytics_summary")
          .select("*")
          .eq("app_id", appId)
          .single(),
        sessionsQuery
      ]);

      const { data: analyticsDbData, error: analyticsError } = analyticsResult;
      const { data: sessionsData, error: sessionsError } = sessionsResult;

      if (analyticsError && analyticsError.code !== "PGRST116") throw analyticsError;
      if (sessionsError) throw sessionsError;

      const sessions = sessionsData || [];
      
      // Early return if no sessions exist
      if (sessions.length === 0) {
        return { analytics: null, recentSessions: [], scoreDistribution: [], activityData: [], avgCompletionTime: 0, flashcardRatingData: [], questionAnalysis };
      }

      // Calculate gradable count for each session
      const sessionsWithGradableCount = await Promise.all(
        sessions.map(async (session) => {
          const gradableCount = await calculateGradableCount(session.id);
          return { ...session, gradable_count: gradableCount };
        })
      );

      let analytics: Analytics | null = null;
      if (analyticsDbData) {
        analytics = {
          ...analyticsDbData,
          common_mistakes: analyticsDbData.common_mistakes as Array<{ question: string; errorRate: number; attempts: number }>,
          poll_results: analyticsDbData.poll_results as Array<{ question: string; votes: Array<{ option: string; count: number }>; totalVotes: number }> | undefined,
          word_cloud_data: analyticsDbData.word_cloud_data as Array<{ question: string; words: Array<{ text: string; value: number }> }> | undefined,
          open_ended_summary: analyticsDbData.open_ended_summary as Array<{ question: string; responseCount: number; sampleResponses: string[] }> | undefined,
        } as Analytics;
      }

      // Calculate score distribution
      const distribution = [
        { range: "0-20%", count: 0 },
        { range: "21-40%", count: 0 },
        { range: "41-60%", count: 0 },
        { range: "61-80%", count: 0 },
        { range: "81-100%", count: 0 },
      ];

      sessionsWithGradableCount.forEach((session) => {
        const gradableCount = session.gradable_count || session.total_questions;
        if (session.score === null || gradableCount === 0) return;
        const scorePercentage = (session.score / gradableCount) * 100;
        
        if (scorePercentage <= 20) distribution[0].count++;
        else if (scorePercentage <= 40) distribution[1].count++;
        else if (scorePercentage <= 60) distribution[2].count++;
        else if (scorePercentage <= 80) distribution[3].count++;
        else distribution[4].count++;
      });

      // Transform flashcard rating data for chart
      let flashcardRatingData: any[] = [];
      if (appConfig?.type === "flashcards" && analyticsDbData?.common_mistakes) {
        const mistakes = analyticsDbData.common_mistakes as Array<{ question: string; errorRate: number; attempts: number }>;
        if (Array.isArray(mistakes)) {
          flashcardRatingData = mistakes.map((item) => ({
            rating: item.question,
            count: item.attempts,
            percentage: item.errorRate,
            fill: item.question === "Easy" 
              ? "hsl(var(--success-light))" 
              : item.question === "Good" 
              ? "hsl(var(--peach-light))" 
              : "hsl(var(--destructive))"
          }));
        }
      }

      // Calculate activity over time
      const activityMap = new Map<string, number>();
      sessionsWithGradableCount.forEach((session) => {
        const date = new Date(session.started_at).toLocaleDateString();
        activityMap.set(date, (activityMap.get(date) || 0) + 1);
      });

      const activityData = Array.from(activityMap.entries())
        .map(([date, plays]) => ({ date, plays }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7);

      // Calculate average completion time
      let avgCompletionTime = 0;
      const completedSessions = sessionsWithGradableCount.filter(s => s.completed_at && s.started_at);
      if (completedSessions.length > 0) {
        const totalTime = completedSessions.reduce((sum, session) => {
          const start = new Date(session.started_at).getTime();
          const end = new Date(session.completed_at!).getTime();
          return sum + (end - start);
        }, 0);
        avgCompletionTime = Math.floor(totalTime / completedSessions.length / 1000);
      }

      return {
        analytics,
        recentSessions: sessionsWithGradableCount,
        scoreDistribution: distribution,
        activityData,
        avgCompletionTime,
        flashcardRatingData,
        questionAnalysis
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - data considered fresh
    gcTime: 10 * 60 * 1000,   // 10 minutes - keep in cache
    refetchOnWindowFocus: false,
  });

  // Extract data from query result
  const analytics = analyticsData?.analytics ?? null;
  const recentSessions = analyticsData?.recentSessions ?? [];
  const scoreDistribution = analyticsData?.scoreDistribution ?? [];
  const activityData = analyticsData?.activityData ?? [];
  const avgCompletionTime = analyticsData?.avgCompletionTime ?? 0;
  const flashcardRatingData = analyticsData?.flashcardRatingData ?? [];
  const questionAnalysis = analyticsData?.questionAnalysis ?? [];

  // Helper functions for Recent Activity section
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'secondary';
    if (percentage >= 40) return 'outline';
    return 'destructive';
  };

  const getPerformanceEmoji = (percentage: number) => {
    if (percentage >= 90) return '🏆';
    if (percentage >= 80) return '🌟';
    if (percentage >= 70) return '👍';
    if (percentage >= 60) return '📈';
    return '💪';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTimeTaken = (session: StudentSession) => {
    if (!session.completed_at) return null;
    const start = new Date(session.started_at).getTime();
    const end = new Date(session.completed_at).getTime();
    const diffSec = Math.floor((end - start) / 1000);
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const getTimeTakenSeconds = (session: StudentSession) => {
    if (!session.completed_at) return Infinity;
    const start = new Date(session.started_at).getTime();
    const end = new Date(session.completed_at).getTime();
    return Math.floor((end - start) / 1000);
  };

  const formatSubmissionTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-GB', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${day} ${month} ${year}, ${time}`;
  };

  const handleColumnSort = (column: 'name' | 'submission' | 'duration' | 'score') => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'submission' ? 'desc' : 'asc');
    }
  };

  const SortableHeader = ({ column, children }: { column: 'name' | 'submission' | 'duration' | 'score'; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 transition-colors select-none"
      onClick={() => handleColumnSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortColumn === column ? (
          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
        )}
      </div>
    </TableHead>
  );

  // Filter and sort sessions
  const getFilteredAndSortedSessions = () => {
    let filtered = recentSessions;
    
    // Apply filter
    if (sessionFilter === 'completed') {
      filtered = filtered.filter(s => s.completed_at !== null);
    } else if (sessionFilter === 'in-progress') {
      filtered = filtered.filter(s => s.completed_at === null);
    }
    
    // Apply column-based sort
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case 'name':
          comparison = a.student_name.localeCompare(b.student_name);
          break;
        case 'submission':
          comparison = new Date(a.completed_at || a.started_at).getTime() - new Date(b.completed_at || b.started_at).getTime();
          break;
        case 'duration':
          comparison = getTimeTakenSeconds(a) - getTimeTakenSeconds(b);
          break;
        case 'score':
          const isFlashcards = appConfig?.type === 'flashcards';
          const gradableA = isFlashcards ? a.total_questions * 3 : (a.gradable_count || a.total_questions);
          const gradableB = isFlashcards ? b.total_questions * 3 : (b.gradable_count || b.total_questions);
          const scoreA = a.score !== null && gradableA > 0 ? (a.score / gradableA) * 100 : -1;
          const scoreB = b.score !== null && gradableB > 0 ? (b.score / gradableB) * 100 : -1;
          comparison = scoreA - scoreB;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  };

  // Group sessions by student
  const getSessionsByStudent = () => {
    const grouped = new Map<string, StudentSession[]>();
    recentSessions.forEach(session => {
      const existing = grouped.get(session.student_name) || [];
      grouped.set(session.student_name, [...existing, session]);
    });
    return grouped;
  };

  const sessionsByStudent = getSessionsByStudent();
  const filteredSortedSessions = getFilteredAndSortedSessions();

  const handleDeleteSession = async (sessionId: string, studentName: string) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('student_sessions')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;
      
      // Invalidate cache to refetch
      queryClient.invalidateQueries({ queryKey: ['analytics-panel-data', appId] });
      
      toast.success('Session deleted successfully');
    } catch (error: any) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const getFilePrefix = () => {
    const appTitle = appConfig?.title || 'Quiz';
    return `${appTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-report-${new Date().toISOString().split('T')[0]}`;
  };

  const downloadTXT = () => {
    const appTitle = appConfig?.title || 'Quiz';
    const reportDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    
    let report = '';
    
    report += '═'.repeat(60) + '\n';
    report += `ANALYTICS REPORT: ${appTitle.toUpperCase()}\n`;
    report += `Generated: ${reportDate}\n`;
    report += '═'.repeat(60) + '\n\n';
    
    report += '📊 EXECUTIVE SUMMARY\n';
    report += '─'.repeat(40) + '\n';
    report += `Total Plays: ${analytics?.total_plays || 0}\n`;
    report += `Average Score: ${analytics?.avg_score !== null ? `${Math.round(analytics.avg_score)}%` : 'N/A'}\n`;
    report += `Completion Rate: ${analytics?.completion_rate !== null ? `${Math.round(analytics.completion_rate)}%` : 'N/A'}\n`;
    report += `Average Completion Time: ${avgCompletionTime > 0 ? `${Math.floor(avgCompletionTime / 60)}m ${avgCompletionTime % 60}s` : 'N/A'}\n`;
    report += `Unique Participants: ${sessionsByStudent.size}\n`;
    report += `Total Sessions: ${recentSessions.length}\n`;
    report += `Completed Sessions: ${recentSessions.filter(s => s.completed_at).length}\n`;
    report += `In Progress: ${recentSessions.filter(s => !s.completed_at).length}\n\n`;
    
    if (scoreDistribution.some(d => d.count > 0)) {
      report += '📈 SCORE DISTRIBUTION\n';
      report += '─'.repeat(40) + '\n';
      scoreDistribution.forEach(d => {
        const bar = '█'.repeat(Math.min(d.count * 2, 20));
        report += `${d.range.padEnd(10)} ${bar} (${d.count})\n`;
      });
      report += '\n';
    }
    
    if (questionAnalysis.length > 0) {
      report += '📝 QUESTION-BY-QUESTION ANALYSIS\n';
      report += '─'.repeat(40) + '\n';
      questionAnalysis.forEach((q, idx) => {
        if (q.questionType === 'slide') return;
        report += `\nQ${q.questionIndex + 1}: ${q.questionText}\n`;
        report += `   Type: ${q.questionType.replace('-', ' ')}\n`;
        report += `   Responses: ${q.totalResponses}\n`;
        
        if (q.options && q.options.length > 0) {
          q.options.forEach((opt, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx);
            const correctMark = opt.isCorrect ? ' ✓' : '';
            report += `   ${letter}. ${opt.text}: ${opt.count} (${opt.percentage}%)${correctMark}\n`;
          });
        }
        
        if (q.correctAnswer) {
          report += `   Correct Answer: ${q.correctAnswer}\n`;
        }
        
        if (q.explanation) {
          report += `   Explanation: ${q.explanation}\n`;
        }
      });
      report += '\n';
    }
    
    if (analytics?.common_mistakes && analytics.common_mistakes.length > 0) {
      report += '⚠️ COMMON MISTAKES / CHALLENGING AREAS\n';
      report += '─'.repeat(40) + '\n';
      analytics.common_mistakes
        .sort((a, b) => b.errorRate - a.errorRate)
        .forEach((mistake, idx) => {
          const severity = mistake.errorRate >= 70 ? 'HIGH' : mistake.errorRate >= 40 ? 'MEDIUM' : 'LOW';
          report += `${idx + 1}. ${mistake.question}\n`;
          report += `   Error Rate: ${mistake.errorRate}% | Attempts: ${mistake.attempts} | Priority: ${severity}\n`;
        });
      report += '\n';
    }
    
    report += '👥 PARTICIPANT DETAILS\n';
    report += '─'.repeat(40) + '\n';
    report += 'No | Name | Submission Time | Duration | Score\n';
    report += '─'.repeat(60) + '\n';
    
    const isFlashcardsReport = appConfig?.type === 'flashcards';
    filteredSortedSessions.forEach((session, idx) => {
      const gradableCount = isFlashcardsReport ? session.total_questions * 3 : (session.gradable_count || session.total_questions);
      const percentage = session.score !== null && gradableCount > 0
        ? Math.round((session.score / gradableCount) * 100)
        : null;
      const timeTaken = getTimeTaken(session);
      const submissionTime = session.completed_at 
        ? formatSubmissionTime(session.completed_at)
        : 'In progress';
      
      report += `${String(idx + 1).padEnd(3)} | `;
      report += `${session.student_name.padEnd(15).slice(0, 15)} | `;
      report += `${submissionTime.padEnd(22)} | `;
      report += `${(timeTaken || '-').padEnd(8)} | `;
      report += percentage !== null ? `${percentage}%${isFlashcardsReport ? ' Mastery' : ` (${session.score}/${session.gradable_count || session.total_questions})`}` : 'In progress';
      report += '\n';
    });
    report += '\n';
    
    if (activityData.length > 0) {
      report += '📅 ACTIVITY OVER TIME\n';
      report += '─'.repeat(40) + '\n';
      activityData.forEach(d => {
        const bar = '█'.repeat(Math.min(d.plays * 3, 30));
        report += `${d.date.padEnd(12)} ${bar} (${d.plays} plays)\n`;
      });
      report += '\n';
    }
    
    report += '═'.repeat(60) + '\n';
    report += 'Report generated by Quizabl Analytics\n';
    report += '═'.repeat(60) + '\n';
    
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getFilePrefix()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('TXT report downloaded successfully');
  };

  const downloadExcel = () => {
    const isFlashcardsXL = appConfig?.type === 'flashcards';
    const wb = XLSX.utils.book_new();

    // 1. Summary sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Plays', analytics?.total_plays || 0],
      ['Average Score', analytics?.avg_score !== null ? `${Math.round(analytics!.avg_score)}%` : 'N/A'],
      ['Completion Rate', analytics?.completion_rate !== null ? `${Math.round(analytics!.completion_rate)}%` : 'N/A'],
      ['Average Completion Time', avgCompletionTime > 0 ? `${Math.floor(avgCompletionTime / 60)}m ${avgCompletionTime % 60}s` : 'N/A'],
      ['Unique Participants', sessionsByStudent.size],
      ['Completed Sessions', recentSessions.filter(s => s.completed_at).length],
      ['In Progress', recentSessions.filter(s => !s.completed_at).length],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // 2. Score Distribution sheet
    if (scoreDistribution.some(d => d.count > 0)) {
      const distData = [['Range', 'Count'], ...scoreDistribution.filter(d => d.count > 0).map(d => [d.range, d.count])];
      const wsDist = XLSX.utils.aoa_to_sheet(distData);
      wsDist['!cols'] = [{ wch: 15 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsDist, 'Score Distribution');
    }

    // 3. Question Analysis sheet
    if (questionAnalysis.length > 0) {
      const qaRows: any[][] = [['#', 'Question', 'Type', 'Responses', 'Correct Answer', 'Explanation']];
      questionAnalysis.forEach(q => {
        if (q.questionType === 'slide') return;
        qaRows.push([
          q.questionIndex + 1,
          q.questionText,
          q.questionType.replace('-', ' '),
          q.totalResponses,
          q.correctAnswer || '',
          q.explanation || '',
        ]);
        if (q.options && q.options.length > 0) {
          qaRows.push(['', 'Option', 'Count', 'Percentage', 'Is Correct', '']);
          q.options.forEach(opt => {
            qaRows.push(['', opt.text, opt.count, `${opt.percentage}%`, opt.isCorrect ? 'Yes' : 'No', '']);
          });
        }
        if (q.ratingDistribution) {
          const rd = q.ratingDistribution;
          qaRows.push(['', `Rating: Hard ${rd.hard}, Good ${rd.good}, Easy ${rd.easy}`, '', '', '', '']);
        }
        if (q.successRate !== undefined) {
          qaRows.push(['', `Success Rate: ${q.successRate}%`, `Failed: ${q.failedAttempts || 0}`, '', '', '']);
        }
        if (q.studentResponses && q.studentResponses.length > 0) {
          qaRows.push(['', 'Student', 'Answer', '', '', '']);
          q.studentResponses.forEach(sr => qaRows.push(['', sr.studentName, sr.answer, '', '', '']));
        }
      });
      const wsQA = XLSX.utils.aoa_to_sheet(qaRows);
      wsQA['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, wsQA, 'Question Analysis');
    }

    // 4. Common Mistakes sheet
    if (analytics?.common_mistakes && analytics.common_mistakes.length > 0) {
      const cmData: any[][] = [['Question', 'Error Rate', 'Attempts', 'Priority']];
      analytics.common_mistakes
        .sort((a, b) => b.errorRate - a.errorRate)
        .forEach(m => {
          const severity = m.errorRate >= 70 ? 'HIGH' : m.errorRate >= 40 ? 'MEDIUM' : 'LOW';
          cmData.push([m.question, `${m.errorRate}%`, m.attempts, severity]);
        });
      const wsCM = XLSX.utils.aoa_to_sheet(cmData);
      wsCM['!cols'] = [{ wch: 40 }, { wch: 12 }, { wch: 10 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsCM, 'Common Mistakes');
    }

    // 5. Participants sheet
    const partRows: any[][] = [['#', 'Name', 'Submission Time', 'Duration', 'Score', 'Percentage', 'Status']];
    filteredSortedSessions.forEach((session, idx) => {
      const gradableCount = isFlashcardsXL ? session.total_questions * 3 : (session.gradable_count || session.total_questions);
      const percentage = session.score !== null && gradableCount > 0
        ? Math.round((session.score / gradableCount) * 100)
        : null;
      const timeTaken = getTimeTaken(session) || '';
      const submissionTime = session.completed_at
        ? formatSubmissionTime(session.completed_at)
        : '';
      const scoreStr = session.score !== null
        ? `${session.score}/${gradableCount}`
        : '';
      partRows.push([
        idx + 1,
        session.student_name,
        submissionTime,
        timeTaken,
        scoreStr,
        percentage !== null ? `${percentage}%` : '',
        session.completed_at ? 'Completed' : 'In Progress',
      ]);
    });
    const wsPart = XLSX.utils.aoa_to_sheet(partRows);
    wsPart['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsPart, 'Participants');

    // 6. Activity Over Time sheet
    if (activityData.length > 0) {
      const actRows = [['Date', 'Plays'], ...activityData.map(d => [d.date, d.plays])];
      const wsAct = XLSX.utils.aoa_to_sheet(actRows);
      wsAct['!cols'] = [{ wch: 15 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsAct, 'Activity Over Time');
    }

    XLSX.writeFile(wb, `${getFilePrefix()}.xlsx`);
    toast.success('Excel report downloaded successfully');
  };

  const downloadPDF = () => {
    const appTitle = appConfig?.title || 'Quiz';
    const reportDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const isFlashcardsPDF = appConfig?.type === 'flashcards';

    let participantRows = '';
    filteredSortedSessions.forEach((session, idx) => {
      const gradableCount = isFlashcardsPDF ? session.total_questions * 3 : (session.gradable_count || session.total_questions);
      const percentage = session.score !== null && gradableCount > 0
        ? Math.round((session.score / gradableCount) * 100)
        : null;
      const timeTaken = getTimeTaken(session) || '-';
      const submissionTime = session.completed_at 
        ? formatSubmissionTime(session.completed_at)
        : 'In progress';
      const scoreStr = percentage !== null 
        ? `${percentage}%` 
        : 'In progress';
      const bgColor = idx % 2 === 0 ? '#f9fafb' : '#ffffff';
      participantRows += `<tr style="background:${bgColor}">
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${idx + 1}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${session.student_name}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${submissionTime}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${timeTaken}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${scoreStr}</td>
      </tr>`;
    });

    let questionRows = '';
    questionAnalysis.forEach((q) => {
      if (q.questionType === 'slide') return;
      const accuracy = q.options?.length > 0 
        ? q.options.find(o => o.isCorrect)?.percentage ?? '-'
        : '-';
      questionRows += `<tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">Q${q.questionIndex + 1}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${q.questionText}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${q.totalResponses}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${q.correctAnswer || '-'}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${accuracy !== '-' ? `${accuracy}%` : '-'}</td>
      </tr>`;
    });

    let scoreDistRows = '';
    scoreDistribution.forEach(d => {
      if (d.count > 0) {
        scoreDistRows += `<tr>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${d.range}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${d.count}</td>
        </tr>`;
      }
    });

    const html = `<!DOCTYPE html>
<html><head><title>Analytics Report - ${appTitle}</title>
<style>
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px 24px; font-size: 13px; line-height: 1.5; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  h2 { font-size: 16px; margin-top: 28px; margin-bottom: 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
  .subtitle { color: #6b7280; margin-bottom: 24px; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat { background: #f3f4f6; border-radius: 8px; padding: 14px; text-align: center; }
  .stat-value { font-size: 22px; font-weight: 700; }
  .stat-label { font-size: 11px; color: #6b7280; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
  th { background: #f3f4f6; text-align: left; padding: 8px; border-bottom: 2px solid #d1d5db; font-weight: 600; }
  td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 11px; text-align: center; }
</style></head><body>
<h1>📊 Analytics Report: ${appTitle}</h1>
<p class="subtitle">Generated on ${reportDate}</p>

<div class="stats">
  <div class="stat"><div class="stat-value">${analytics?.total_plays || 0}</div><div class="stat-label">Total Plays</div></div>
  <div class="stat"><div class="stat-value">${analytics?.avg_score !== null ? `${Math.round(analytics.avg_score)}%` : 'N/A'}</div><div class="stat-label">Avg Score</div></div>
  <div class="stat"><div class="stat-value">${analytics?.completion_rate !== null ? `${Math.round(analytics.completion_rate)}%` : 'N/A'}</div><div class="stat-label">Completion Rate</div></div>
  <div class="stat"><div class="stat-value">${avgCompletionTime > 0 ? `${Math.floor(avgCompletionTime / 60)}m ${avgCompletionTime % 60}s` : 'N/A'}</div><div class="stat-label">Avg Time</div></div>
</div>

${scoreDistRows ? `<h2>Score Distribution</h2><table><thead><tr><th>Range</th><th>Count</th></tr></thead><tbody>${scoreDistRows}</tbody></table>` : ''}

${questionRows ? `<h2>Question Analysis</h2><table><thead><tr><th>#</th><th>Question</th><th>Responses</th><th>Correct Answer</th><th>Accuracy</th></tr></thead><tbody>${questionRows}</tbody></table>` : ''}

<h2>Participants (${filteredSortedSessions.length})</h2>
<table><thead><tr><th>#</th><th>Name</th><th>Submission Time</th><th>Duration</th><th>Score</th></tr></thead><tbody>${participantRows}</tbody></table>

<div class="footer">Report generated by Quizabl Analytics</div>
</body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 500);
    }
    toast.success('PDF report ready — use your browser\'s print dialog to save');
  };

  useEffect(() => {
    // Real-time updates - invalidate query when data changes
    const channel = supabase
      .channel('student-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_sessions',
          filter: `app_id=eq.${appId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['analytics-panel-data', appId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appId, queryClient]);

  if (isLoading || featuresLoading) {
    return <AnalyticsSkeleton />;
  }

  if (!analytics) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">No analytics data yet. Share your app with students to start collecting data!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
          Analytics Dashboard
        </h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {hasAdvancedAnalytics && (
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Time</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          )}
          <div className="flex gap-2">
            {hasAdvancedAnalytics && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
                    <Download className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Download Report</span>
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={downloadExcel}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Download as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadPDF}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Download as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadTXT}>
                    <FileText className="w-4 h-4 mr-2" />
                    Download as TXT
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button onClick={() => refetch()} variant="outline" size="sm" className="flex-1 sm:flex-initial">
              <RefreshCw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              Total Plays
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-2xl sm:text-3xl font-bold">{analytics.total_plays}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">
                {appConfig?.type === "flashcards" 
                  ? "Mastery Level"
                  : appConfig?.type === "matching"
                  ? "Match Accuracy"
                  : "Avg. Score"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-2xl sm:text-3xl font-bold">
              {`${analytics.avg_score.toFixed(1)}%`}
            </p>
            {appConfig?.type === "flashcards" && (
              <p className="text-xs text-muted-foreground">Easy=100%, Good=66%, Hard=33%</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">Completion</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-2xl sm:text-3xl font-bold">{analytics.completion_rate.toFixed(1)}%</p>
          </CardContent>
        </Card>

        {hasAdvancedAnalytics ? (
          <Card>
            <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                Avg. Time
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <p className="text-2xl sm:text-3xl font-bold">{Math.floor(avgCompletionTime / 60)}m</p>
              <p className="text-xs text-muted-foreground">{avgCompletionTime % 60}s</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
            </div>
            <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                Avg. Time
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <p className="text-2xl sm:text-3xl font-bold">--</p>
              <p className="text-xs text-muted-foreground">Pro feature</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Overview */}
      <AIOverviewCard
        appId={appId}
        hasAdvancedAnalytics={hasAdvancedAnalytics}
        analyticsData={{
          appType: appConfig?.type,
          totalPlays: analytics.total_plays,
          avgScore: analytics.avg_score,
          completionRate: analytics.completion_rate,
          avgCompletionTime,
          scoreDistribution,
          commonMistakes: analytics.common_mistakes || [],
          questionAnalysis: questionAnalysis || [],
        }}
      />

      {/* Charts */}
      {hasAdvancedAnalytics ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Score/Rating Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>
                {appConfig?.type === "flashcards" 
                  ? "Self-Rating Distribution"
                  : "Score Distribution"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appConfig?.type === "flashcards" && flashcardRatingData.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={flashcardRatingData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" />
                      <YAxis />
                      <ChartTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-none">
                                <p className="font-semibold">{payload[0].payload.rating}</p>
                                <p className="text-sm text-muted-foreground">
                                  {payload[0].payload.count} ratings ({payload[0].payload.percentage}%)
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-center text-muted-foreground">
                    Based on {flashcardRatingData.reduce((sum, d) => sum + d.count, 0)} total ratings
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <ChartTooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="plays" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
            <Lock className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Unlock detailed charts, score distribution, activity timeline, and more insights
            </p>
            <Button onClick={() => navigate("/settings/billing")}>
              Upgrade to Pro
            </Button>
          </div>
          <CardContent className="h-[300px] opacity-30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
              <div className="bg-muted rounded" />
              <div className="bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions & Participants Tabs */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <TabsList className="grid w-full sm:w-auto grid-cols-3">
                <TabsTrigger value="questions" className="gap-2">
                  <ListChecks className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {appConfig?.type === "flashcards" ? "Cards" : appConfig?.type === "matching" ? "Pairs" : "Questions"}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="mistakes" className="gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {appConfig?.type === "flashcards" ? "Needs Review" : appConfig?.type === "matching" ? "Challenging" : "Mistakes"}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="participants" className="gap-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Participants</span>
                </TabsTrigger>
              </TabsList>
              
              {activeTab === 'mistakes' && analytics.common_mistakes && analytics.common_mistakes.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setMistakeSortBy(mistakeSortBy === 'errorRate' ? 'attempts' : 'errorRate')}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sort by {mistakeSortBy === 'errorRate' ? 'Error Rate' : 'Attempts'}</span>
                  <span className="sm:hidden ml-2">Sort</span>
                </Button>
              )}

              {activeTab === 'participants' && (
                <Select value={sessionFilter} onValueChange={(v: any) => setSessionFilter(v)}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sessions</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            
            {/* Questions Tab Content */}
            <TabsContent value="questions" className="mt-4">
              <QuestionAnalysis questions={questionAnalysis} appType={appConfig?.type} />
            </TabsContent>

            {/* Mistakes Tab Content */}
            <TabsContent value="mistakes" className="mt-4">
              {!hasAdvancedAnalytics ? (
                <div className="text-center py-12">
                  <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Common Mistakes Analysis</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                    Unlock detailed mistake analysis to identify where students struggle most
                  </p>
                  <Button onClick={() => navigate("/settings/billing")}>
                    Upgrade to Pro
                  </Button>
                </div>
              ) : analytics.common_mistakes && analytics.common_mistakes.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {[...analytics.common_mistakes]
                    .sort((a, b) => b[mistakeSortBy] - a[mistakeSortBy])
                    .map((mistake, index) => {
                    const isExpanded = expandedMistakes.has(index);
                    const severity = mistake.errorRate >= 70 ? 'high' : mistake.errorRate >= 40 ? 'medium' : 'low';
                    const severityColors = {
                      high: 'bg-destructive/10 border-destructive/30',
                      medium: 'bg-yellow-500/10 border-yellow-500/30',
                      low: 'bg-green-500/10 border-green-500/30'
                    };
                    
                    return (
                      <div 
                        key={index} 
                        className={`border rounded-lg overflow-hidden transition-all ${severityColors[severity]}`}
                      >
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedMistakes);
                            if (isExpanded) {
                              newExpanded.delete(index);
                            } else {
                              newExpanded.add(index);
                            }
                            setExpandedMistakes(newExpanded);
                          }}
                          className="w-full p-3 sm:p-4 text-left hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                            <div className="flex-shrink-0">
                              <Badge variant="outline" className="font-bold text-xs">
                                #{index + 1}
                              </Badge>
                            </div>
                            
                            <div className="flex-1 space-y-2 min-w-0">
                              <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-3">
                                <h4 className="font-semibold text-xs sm:text-sm leading-snug break-words">{mistake.question}</h4>
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">
                                      {appConfig?.type === "flashcards" ? "Rating" : "Error Rate"}
                                    </span>
                                    <span className="text-sm font-bold">
                                      {mistake.errorRate}%
                                    </span>
                                  </div>
                                  <Progress value={mistake.errorRate} className="h-2" />
                                </div>
                                
                                <div className="flex-shrink-0">
                                  <Badge variant="secondary">
                                    {mistake.attempts} {appConfig?.type === "flashcards" ? "ratings" : "attempts"}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={severity === 'high' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {severity === 'high' ? 'High Priority' : severity === 'medium' ? 'Medium Priority' : 'Low Priority'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 bg-background/50 border-t">
                            <div className="space-y-3 text-sm">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Analysis</p>
                                <p className="text-muted-foreground">
                                  {appConfig?.type === "flashcards" 
                                    ? `This card received a ${mistake.errorRate}% average rating across ${mistake.attempts} student reviews. ${severity === 'high' ? 'Students found this particularly challenging.' : 'Students generally understood this well.'}`
                                    : appConfig?.type === "matching"
                                    ? `This pair was matched incorrectly ${mistake.errorRate}% of the time across ${mistake.attempts} attempts. ${severity === 'high' ? 'Consider reviewing the similarity to other pairs.' : 'Students are performing well on this pair.'}`
                                    : `Students answered this incorrectly ${mistake.errorRate}% of the time across ${mistake.attempts} attempts. ${severity === 'high' ? 'This topic may need additional review or clarification.' : 'Students are performing well on this question.'}`
                                  }
                                </p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="bg-background p-3 rounded border">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Success Rate</p>
                                  <p className="text-lg font-bold">{(100 - mistake.errorRate).toFixed(0)}%</p>
                                </div>
                                <div className="bg-background p-3 rounded border">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Total Attempts</p>
                                  <p className="text-lg font-bold">{mistake.attempts}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {appConfig?.type === "matching"
                      ? "Challenging pairs will appear once students complete matching activities."
                      : "Common mistakes will appear once students start answering questions."}
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="participants" className="mt-4">
              {filteredSortedSessions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {sessionFilter === 'all' 
                      ? "Share your app to start collecting activity data and track progress!"
                      : `No ${sessionFilter === 'completed' ? 'completed' : 'in-progress'} sessions found. Try changing the filter.`
                    }
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Card Layout */}
                  <div className="sm:hidden space-y-3">
                    {filteredSortedSessions.map((session, index) => {
                      const isFlashcardsMobile = appConfig?.type === 'flashcards';
                      const gradableCount = isFlashcardsMobile ? session.total_questions * 3 : (session.gradable_count || session.total_questions);
                      const percentage = session.score !== null && gradableCount > 0
                        ? Math.round((session.score / gradableCount) * 100)
                        : 0;
                      const timeTaken = getTimeTaken(session);
                      
                      return (
                        <Card key={session.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-primary">#{index + 1}</span>
                                <span className="font-semibold truncate">{session.student_name}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {session.completed_at ? formatSubmissionTime(session.completed_at) : 'In progress'}
                              </p>
                              <div className="flex items-center gap-3 text-sm">
                                {timeTaken && (
                                  <span className="text-muted-foreground">{timeTaken}</span>
                                )}
                                {session.completed_at ? (
                                  <span className={percentage >= 70 ? 'text-success-light font-medium' : percentage >= 40 ? 'text-peach-light font-medium' : 'text-destructive font-medium'}>
                                    {percentage}%{isFlashcardsMobile ? ' Mastery' : ` (${session.score}/${session.gradable_count || session.total_questions})`}
                                  </span>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    <Target className="w-3 h-3 mr-1" />
                                    In Progress
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (!hasAdvancedAnalytics) {
                                          toast.error("Detailed analytics are a Pro feature. Upgrade to unlock!");
                                          navigate("/settings/billing");
                                          return;
                                        }
                                        setSelectedSessionId(session.id);
                                      }}
                                      disabled={!hasAdvancedAnalytics}
                                      className="h-8 w-8 p-0"
                                    >
                                      {hasAdvancedAnalytics ? (
                                        <Eye className="w-4 h-4" />
                                      ) : (
                                        <Lock className="w-4 h-4 opacity-50" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  {!hasAdvancedAnalytics && (
                                    <TooltipContent>
                                      <p>Upgrade to Pro</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSession(session.id, session.student_name)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Desktop Table Layout */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">No</TableHead>
                          <SortableHeader column="name">Name</SortableHeader>
                          <SortableHeader column="submission">Submission Time</SortableHeader>
                          <SortableHeader column="duration">Duration</SortableHeader>
                          <SortableHeader column="score">Score</SortableHeader>
                          <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSortedSessions.map((session, index) => {
                          const isFlashcardsDesktop = appConfig?.type === 'flashcards';
                          const gradableCount = isFlashcardsDesktop ? session.total_questions * 3 : (session.gradable_count || session.total_questions);
                          const percentage = session.score !== null && gradableCount > 0
                            ? Math.round((session.score / gradableCount) * 100)
                            : 0;
                          const timeTaken = getTimeTaken(session);
                          
                          return (
                            <TableRow key={session.id}>
                              <TableCell>
                                <span className="text-primary font-medium cursor-pointer hover:underline" onClick={() => {
                                  if (!hasAdvancedAnalytics) {
                                    toast.error("Detailed analytics are a Pro feature. Upgrade to unlock!");
                                    navigate("/settings/billing");
                                    return;
                                  }
                                  setSelectedSessionId(session.id);
                                }}>
                                  {index + 1}
                                </span>
                              </TableCell>
                              <TableCell className="font-medium">{session.student_name}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {session.completed_at ? formatSubmissionTime(session.completed_at) : (
                                  <Badge variant="outline" className="text-xs">
                                    <Target className="w-3 h-3 mr-1" />
                                    In Progress
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {timeTaken || '-'}
                              </TableCell>
                              <TableCell>
                                {session.completed_at ? (
                                  <span className={percentage >= 70 ? 'text-success-light font-medium' : percentage >= 40 ? 'text-peach-light font-medium' : 'text-destructive font-medium'}>
                                    {percentage}%{isFlashcardsDesktop ? ' Mastery' : ` (${session.score}/${session.gradable_count || session.total_questions})`}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            if (!hasAdvancedAnalytics) {
                                              toast.error("Detailed analytics are a Pro feature. Upgrade to unlock!");
                                              navigate("/settings/billing");
                                              return;
                                            }
                                            setSelectedSessionId(session.id);
                                          }}
                                          disabled={!hasAdvancedAnalytics}
                                          className="h-8 w-8 p-0"
                                        >
                                          {hasAdvancedAnalytics ? (
                                            <Eye className="w-4 h-4" />
                                          ) : (
                                            <Lock className="w-4 h-4 opacity-50" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      {!hasAdvancedAnalytics && (
                                        <TooltipContent>
                                          <p>Upgrade to Pro</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </TooltipProvider>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteConfirm({ open: true, sessionId: session.id, studentName: session.student_name })}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>


      {/* Poll Results Analytics */}
      {analytics.poll_results && analytics.poll_results.length > 0 && hasAdvancedAnalytics && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              Poll Results
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-6">
            {analytics.poll_results.map((poll, index) => (
              <div key={index} className="space-y-3">
                <h4 className="font-semibold text-sm">{poll.question}</h4>
                <p className="text-xs text-muted-foreground">Total Votes: {poll.totalVotes}</p>
                <div className="space-y-2">
                  {poll.votes.map((vote, vIdx) => {
                    const percentage = poll.totalVotes > 0 
                      ? Math.round((vote.count / poll.totalVotes) * 100) 
                      : 0;
                    return (
                      <div key={vIdx} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{vote.option}</span>
                          <span className="text-muted-foreground">
                            {vote.count} ({percentage}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
                {index < analytics.poll_results.length - 1 && (
                  <div className="border-b mt-4" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Word Cloud Analytics */}
      {analytics.word_cloud_data && analytics.word_cloud_data.length > 0 && hasAdvancedAnalytics && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              Word Cloud Responses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-6">
            {analytics.word_cloud_data.map((wordCloud, index) => (
              <div key={index} className="space-y-3">
                <h4 className="font-semibold text-sm">{wordCloud.question}</h4>
                <div className="flex flex-wrap gap-2">
                  {wordCloud.words.slice(0, 20).map((word, wIdx) => {
                    const maxValue = Math.max(...wordCloud.words.map(w => w.value));
                    const size = Math.max(12, Math.min(24, 12 + (word.value / maxValue) * 12));
                    return (
                      <Badge 
                        key={wIdx} 
                        variant="secondary"
                        style={{ fontSize: `${size}px` }}
                        className="px-2 py-1"
                      >
                        {word.text} ({word.value})
                      </Badge>
                    );
                  })}
                </div>
                {index < analytics.word_cloud_data.length - 1 && (
                  <div className="border-b mt-4" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Open-Ended Response Summaries */}
      {analytics.open_ended_summary && analytics.open_ended_summary.length > 0 && hasAdvancedAnalytics && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              Open-Ended Responses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-6">
            {analytics.open_ended_summary.map((summary, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm flex-1">{summary.question}</h4>
                  <Badge variant="secondary">
                    {summary.responseCount} responses
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Sample Responses:</p>
                  {summary.sampleResponses.map((response, rIdx) => (
                    <div 
                      key={rIdx} 
                      className="p-3 bg-muted/30 rounded-lg border text-sm"
                    >
                      <p className="text-muted-foreground italic">"{response}"</p>
                    </div>
                  ))}
                </div>
                {index < analytics.open_ended_summary.length - 1 && (
                  <div className="border-b mt-4" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {selectedSessionId && (
        <StudentDetailModal
          sessionId={selectedSessionId} 
          onClose={() => setSelectedSessionId(null)}
          appType={appConfig?.type}
        />
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        title="Delete Session"
        description={`Are you sure you want to delete ${deleteConfirm.studentName}'s session? This action cannot be undone.`}
        onConfirm={() => {
          handleDeleteSession(deleteConfirm.sessionId, deleteConfirm.studentName);
          setDeleteConfirm({ open: false, sessionId: '', studentName: '' });
        }}
      />
    </div>
  );
};

export default AnalyticsPanel;
