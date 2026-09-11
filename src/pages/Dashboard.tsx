import { useEffect, useState, useMemo } from "react";
import { CohortSignal, LowestScoringApp } from "@/components/dashboard/CohortSignal";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { AppConfig } from "@/pages/Builder";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeatures } from "@/hooks/useFeatures";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Logo } from "@/components/ui/logo";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import AppCard from "@/components/dashboard/AppCard";
import AppListItem from "@/components/dashboard/AppListItem";
import AppTable from "@/components/dashboard/AppTable";
import { useCohortMetrics, type AppMetrics } from "@/hooks/useCohortMetrics";
import { ReadinessChart, type ScoreBand } from "@/components/dashboard/ReadinessChart";
import { NeedsAttention } from "@/components/dashboard/NeedsAttention";
import { DraftsGroup } from "@/components/dashboard/DraftsGroup";

import DeleteConfirmDialog from "@/components/dashboard/DeleteConfirmDialog";
import BulkActionBar from "@/components/dashboard/BulkActionBar";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { PromotionalBanner } from "@/components/dashboard/PromotionalBanner";
import { format } from "date-fns";
import { useCrisp } from "@/hooks/useCrisp";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useSubscription } from "@/hooks/useSubscription";
import { useCredits } from "@/hooks/useCredits";
import { CreateActivityDialog, ManualAppType } from "@/components/dashboard/CreateActivityDialog";

interface App {
  id: string;
  title: string;
  app_type: string;
  theme: string;
  share_code: string;
  created_at: string;
  updated_at: string;
  is_starred?: boolean;
  folder_id?: string | null;
}
const Dashboard = () => {
  const navigate = useNavigate();
  useCrisp();
  const [session, setSession] = useState<Session | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [lowestScoringApp, setLowestScoringApp] = useState<LowestScoringApp | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<App | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canCreate, setCanCreate] = useState(true);
  const [remainingApps, setRemainingApps] = useState<number | 'unlimited'>(0);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedView, setSelectedView] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("table");
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isCreatingApp, setIsCreatingApp] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const {
    canCreateApp,
    getRemainingApps,
    getNumberFeature,
    isLoading: featuresLoading
  } = useFeatures();
  const {
    subscription,
    isFree,
    isLoading: subscriptionLoading
  } = useSubscription();
  
  // This hook triggers the monthly credit reset check on dashboard load
  useCredits();

  // Derived signals for the Cohort Signal hero
  const firstName = useMemo(() => {
    const meta = (session?.user?.user_metadata || {}) as Record<string, any>;
    const raw =
      meta.first_name ||
      meta.full_name ||
      meta.name ||
      session?.user?.email?.split("@")[0] ||
      "there";
    return String(raw).split(" ")[0].split(".")[0].replace(/^\w/, c => c.toUpperCase());
  }, [session]);

  const newThisMonth = useMemo(() => {
    const now = new Date();
    return apps.filter(a => {
      const d = new Date(a.created_at);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }, [apps]);

  const studentsReached = useMemo(
    () => Object.values(participantCounts).reduce((s, n) => s + n, 0),
    [participantCounts]
  );

  const cohortsCount = useMemo(
    () => Object.values(participantCounts).filter(n => n > 0).length,
    [participantCounts]
  );

  const appIds = useMemo(() => apps.map(a => a.id), [apps]);
  const cohort = useCohortMetrics(appIds);
  const [activeBand, setActiveBand] = useState<ScoreBand | null>(null);

  const avgScores = useMemo(() => {
    const map: Record<string, number | null> = {};
    (Object.values(cohort.byApp) as AppMetrics[]).forEach(m => {
      map[m.appId] = m.avgScore;
    });
    return map;
  }, [cohort.byApp]);

  const isDraft = (a: any) =>
    (participantCounts[a.id] || 0) === 0 &&
    (!a.title || /^untitled/i.test(a.title) ||
      !((a.config as any)?.questions?.length || (a.config as any)?.pairs?.length || (a.config as any)?.cards?.length));

  const draftApps = useMemo(() => apps.filter(isDraft), [apps, participantCounts]);

  const attentionItems = useMemo(() => {
    const items: { id: string; eyebrow: string; title: string; action: string; onClick: () => void }[] = [];
    apps.forEach(a => {
      const m = cohort.byApp[a.id];
      if (m && m.recentResponses > 0) {
        items.push({
          id: `new-${a.id}`,
          eyebrow: `${m.recentResponses} new ${m.recentResponses === 1 ? "response" : "responses"} this week`,
          title: a.title || "Untitled activity",
          action: "Review results",
          onClick: () => navigate(`/analytics/${a.id}`),
        });
      }
    });
    apps.forEach(a => {
      if (items.length >= 4) return;
      const m = cohort.byApp[a.id];
      const idleDays = (Date.now() - new Date(a.updated_at).getTime()) / 86400000;
      if (!m && !isDraft(a) && idleDays > 14) {
        items.push({
          id: `idle-${a.id}`,
          eyebrow: "Shared but no responses yet",
          title: a.title || "Untitled activity",
          action: "Share again",
          onClick: () => handleShare(a.share_code),
        });
      }
    });
    return items.slice(0, 4);
  }, [apps, cohort.byApp, participantCounts]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({
      data: {
        session
      }
    }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setSession(session);
        fetchApps(session.user.id);
        fetchFolders(session.user.id);
        fetchParticipantCounts(session.user.id);
        fetchLowestScoringApp(session.user.id);
        checkAppLimits();

        // Check admin status
        const {
          data: adminStatus
        } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin'
        });
        setIsAdmin(adminStatus || false);

        // Check onboarding status
        const {
          data: profile
        } = await supabase.from('profiles').select('has_completed_onboarding').eq('id', session.user.id).maybeSingle();
        setNeedsOnboarding(!profile?.has_completed_onboarding);
      }
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        fetchApps(session.user.id);
        fetchFolders(session.user.id);
        fetchParticipantCounts(session.user.id);
        fetchLowestScoringApp(session.user.id);
        checkAppLimits();
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Real-time subscription for apps changes
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel('dashboard-apps-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'apps',
          filter: `teacher_id=eq.${session.user.id}`,
        },
        (payload) => {
          console.log('Real-time app change:', payload);
          fetchApps(session.user.id);
          fetchFolders(session.user.id);
          fetchParticipantCounts(session.user.id);
        fetchLowestScoringApp(session.user.id);
          checkAppLimits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  // Refetch on window focus for cross-tab sync
  useEffect(() => {
    const handleFocus = () => {
      if (session?.user?.id) {
        fetchApps(session.user.id);
        fetchFolders(session.user.id);
        fetchParticipantCounts(session.user.id);
        fetchLowestScoringApp(session.user.id);
        checkAppLimits();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [session?.user?.id]);

  // Re-check limits when apps or features change
  useEffect(() => {
    if (!featuresLoading && apps.length >= 0) {
      console.log('[Dashboard] Triggering checkAppLimits because features loaded or apps changed');
      checkAppLimits();
    }
  }, [featuresLoading, apps.length, getNumberFeature('max_apps')]);
  const handleOnboardingComplete = async () => {
    if (!session) return;
    await supabase.from('profiles').update({
      has_completed_onboarding: true,
      onboarding_completed_at: new Date().toISOString()
    }).eq('id', session.user.id);
    setNeedsOnboarding(false);
    toast.success("You're all set! 🎉");
  };
  const handleOnboardingSkip = async () => {
    if (!session) return;
    await supabase.from('profiles').update({
      has_completed_onboarding: true,
      onboarding_completed_at: new Date().toISOString()
    }).eq('id', session.user.id);
    setNeedsOnboarding(false);
  };
  const checkAppLimits = async () => {
    // Don't check limits if features are still loading
    if (featuresLoading) {
      console.log('[Dashboard] Features still loading, skipping limit check');
      return;
    }
    const maxAppsFeature = getNumberFeature('max_apps');
    const can = await canCreateApp();
    const remaining = await getRemainingApps();
    console.log('[Dashboard] App limits checked:', {
      can,
      remaining,
      maxAppsFeature,
      currentAppCount: apps.length,
      featuresLoading
    });
    setCanCreate(can);
    setRemainingApps(remaining);
  };
  const fetchApps = async (userId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from("apps").select("*").eq("teacher_id", userId).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      setApps(data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load apps");
    } finally {
      setLoading(false);
    }
  };
  const fetchParticipantCounts = async (userId: string) => {
    try {
      // Get all app IDs for this user first, then count sessions
      const { data: userApps } = await supabase
        .from("apps")
        .select("id")
        .eq("teacher_id", userId);
      
      if (!userApps || userApps.length === 0) {
        setParticipantCounts({});
        return;
      }

      const appIds = userApps.map(a => a.id);
      const { data: sessions } = await supabase
        .from("student_sessions")
        .select("app_id, student_name")
        .in("app_id", appIds);

      const counts: Record<string, number> = {};
      if (sessions) {
        const uniquePerApp: Record<string, Set<string>> = {};
        sessions.forEach(s => {
          if (!uniquePerApp[s.app_id]) uniquePerApp[s.app_id] = new Set();
          uniquePerApp[s.app_id].add(s.student_name);
        });
        Object.entries(uniquePerApp).forEach(([appId, names]) => {
          counts[appId] = names.size;
        });
      }
      setParticipantCounts(counts);
    } catch (error) {
      console.error("Failed to fetch participant counts:", error);
    }
  };

  const fetchLowestScoringApp = async (userId: string) => {
    try {
      const { data: userApps } = await supabase
        .from("apps")
        .select("id, title")
        .eq("teacher_id", userId);
      if (!userApps || userApps.length === 0) {
        setLowestScoringApp(null);
        return;
      }
      const appIds = userApps.map(a => a.id);
      const titleById = new Map(userApps.map(a => [a.id, a.title]));
      const { data: analytics } = await supabase
        .from("analytics_summary")
        .select("app_id, avg_score, total_plays")
        .in("app_id", appIds)
        .not("avg_score", "is", null)
        .gte("total_plays", 3)
        .order("avg_score", { ascending: true })
        .limit(1);
      const row = analytics?.[0];
      if (!row) {
        setLowestScoringApp(null);
        return;
      }
      setLowestScoringApp({
        id: row.app_id,
        title: titleById.get(row.app_id) || "Untitled activity",
        avg_score: Number(row.avg_score),
        total_plays: row.total_plays ?? 0,
      });
    } catch (error) {
      console.error("Failed to fetch lowest-scoring app:", error);
    }
  };

  const fetchFolders = async (userId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from("folders").select("*").eq("user_id", userId).order("display_order", {
        ascending: true
      });
      if (error) throw error;

      // Count apps in each folder
      const foldersWithCount = await Promise.all((data || []).map(async folder => {
        const {
          count
        } = await supabase.from("apps").select("*", {
          count: "exact",
          head: true
        }).eq("teacher_id", userId).eq("folder_id", folder.id);
        return {
          ...folder,
          app_count: count || 0
        };
      }));
      setFolders(foldersWithCount);
    } catch (error: any) {
      console.error("Failed to load folders:", error);
    }
  };
  const handleDelete = async () => {
    if (!appToDelete) return;
    try {
      const {
        error
      } = await supabase.from("apps").delete().eq("id", appToDelete.id);
      if (error) throw error;
      setApps(apps.filter(app => app.id !== appToDelete.id));
      toast.success("Activity deleted successfully");
      setDeleteDialogOpen(false);
      setAppToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete activity");
    }
  };
  const openDeleteDialog = (app: App) => {
    setAppToDelete(app);
    setDeleteDialogOpen(true);
  };
  const handleShare = (shareCode: string) => {
    const url = `${window.location.origin}/play/${shareCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard!");
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const generateShareCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const generateUniqueShareCode = async () => {
    let shareCode = generateShareCode();
    let attempts = 0;

    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('apps')
        .select('id')
        .eq('share_code', shareCode)
        .maybeSingle();

      if (!existing) break;
      shareCode = generateShareCode();
      attempts++;
    }

    return shareCode;
  };

  const createPlaceholderApp = async (initialPrompt?: string) => {
    if (!session || isCreatingApp) return;

    if (!canCreate) {
      toast.error(`You've reached your activity limit of ${getNumberFeature('max_apps')}. Upgrade to create more.`);
      navigate("/settings/billing");
      return;
    }

    setIsCreatingApp(true);

    try {
      const isOnboarding = localStorage.getItem('is_onboarding') === 'true';
      if (isOnboarding) {
        localStorage.setItem('onboarding_step', 'builder-chat');
      }

      const placeholderConfig: AppConfig & { isPlaceholder: boolean } = {
        type: "quiz",
        title: "Untitled activity",
        theme: "indigo",
        questions: [],
        isPlaceholder: true,
      };

      const shareCode = await generateUniqueShareCode();
      const { data, error } = await supabase
        .from("apps")
        .insert({
          teacher_id: session.user.id,
          title: placeholderConfig.title,
          app_type: placeholderConfig.type,
          config: placeholderConfig as any,
          theme: placeholderConfig.theme,
          share_code: shareCode,
        })
        .select("id")
        .single();

      if (error) throw error;

      setCreateDialogOpen(false);
      navigate(
        `/builder/${data.id}`,
        initialPrompt ? { state: { initialPrompt } } : undefined
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to create activity");
    } finally {
      setIsCreatingApp(false);
    }
  };

  const buildManualConfig = (type: ManualAppType): AppConfig & { isManual: boolean } => {
    const base = {
      title: "Untitled activity",
      theme: "indigo",
      isManual: true,
    };

    if (type === "flashcards") {
      return {
        ...base,
        type: "flashcards",
        cards: [{ front: "", back: "" }],
      } as AppConfig & { isManual: boolean };
    }

    if (type === "matching") {
      return {
        ...base,
        type: "matching",
        pairs: [{ prompt: "", answer: "" }],
      } as AppConfig & { isManual: boolean };
    }

    return {
      ...base,
      type: "quiz",
      questions: [
        {
          questionType: "multiple-choice",
          q: "",
          options: ["Option A", "Option B", "Option C", "Option D"],
          answer: "",
          timerSeconds: 30,
        },
      ],
    } as AppConfig & { isManual: boolean };
  };

  const createManualApp = async (type: ManualAppType) => {
    if (!session || isCreatingApp) return;

    if (!canCreate) {
      toast.error(`You've reached your activity limit of ${getNumberFeature('max_apps')}. Upgrade to create more.`);
      navigate("/settings/billing");
      return;
    }

    setIsCreatingApp(true);

    try {
      const manualConfig = buildManualConfig(type);
      const shareCode = await generateUniqueShareCode();

      const { data, error } = await supabase
        .from("apps")
        .insert({
          teacher_id: session.user.id,
          title: manualConfig.title,
          app_type: manualConfig.type,
          config: manualConfig as any,
          theme: manualConfig.theme,
          share_code: shareCode,
        })
        .select("id")
        .single();

      if (error) throw error;

      setCreateDialogOpen(false);
      navigate(`/builder/${data.id}`, { state: { startInEditor: true } });
    } catch (error: any) {
      toast.error(error.message || "Failed to create activity");
    } finally {
      setIsCreatingApp(false);
    }
  };

  const openCreateDialog = () => {
    if (!canCreate) {
      toast.error(`You've reached your activity limit of ${getNumberFeature('max_apps')}. Upgrade to create more.`);
      navigate("/settings/billing");
      return;
    }
    setCreateDialogOpen(true);
  };


  const handleToggleStar = async (appId: string, isStarred: boolean) => {
    try {
      const {
        error
      } = await supabase.from("apps").update({
        is_starred: isStarred
      }).eq("id", appId);
      if (error) throw error;
      setApps(apps.map(app => app.id === appId ? {
        ...app,
        is_starred: isStarred
      } : app));
      toast.success(isStarred ? "Added to starred" : "Removed from starred");
    } catch (error: any) {
      toast.error("Failed to update star status");
    }
  };
  const handleMoveToFolder = async (appId: string, folderId: string | null) => {
    try {
      const {
        error
      } = await supabase.from("apps").update({
        folder_id: folderId
      }).eq("id", appId);
      if (error) throw error;
      toast.success(folderId ? "Activity moved to folder" : "Activity removed from folder");
      if (session) {
        fetchApps(session.user.id);
        fetchFolders(session.user.id);
      }
    } catch (error: any) {
      toast.error("Failed to move activity");
    }
  };

  // Selection handlers
  const toggleAppSelection = (appId: string, selected: boolean) => {
    setSelectedApps(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(appId);
      } else {
        newSet.delete(appId);
      }
      return newSet;
    });
  };
  const selectAllVisible = () => {
    setSelectedApps(new Set(filteredApps.map(app => app.id)));
  };
  const clearSelection = () => {
    setSelectedApps(new Set());
  };
  const handleBulkDelete = async () => {
    try {
      const {
        error
      } = await supabase.from("apps").delete().in("id", Array.from(selectedApps));
      if (error) throw error;
      setApps(apps.filter(app => !selectedApps.has(app.id)));
      toast.success(`${selectedApps.size} activities deleted successfully`);
      clearSelection();
      setBulkDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete activities");
    }
  };

  // Filtered and sorted apps
  const filteredApps = useMemo(() => {
    let filtered = apps;

    // Folder/View filter
    if (selectedView === "starred") {
      filtered = filtered.filter(app => app.is_starred);
    } else if (selectedView !== "all") {
      filtered = filtered.filter(app => app.folder_id === selectedView);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(app => app.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter(app => app.app_type === filterType);
    }

    // Readiness band filter
    if (activeBand) {
      filtered = filtered.filter(app => {
        const s = avgScores[app.id];
        if (typeof s !== "number") return false;
        if (activeBand === "struggling") return s < 0.5;
        if (activeBand === "developing") return s >= 0.5 && s < 0.75;
        return s >= 0.75;
      });
    }

    // Hide drafts from the main list (they get their own group)
    filtered = filtered.filter(app => !draftApps.some(d => d.id === app.id));



    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case "oldest":
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case "az":
          return a.title.localeCompare(b.title);
        case "za":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
    return sorted;
  }, [apps, searchQuery, filterType, sortBy, selectedView, activeBand, avgScores, draftApps]);
  const starredCount = useMemo(() => {
    return apps.filter(app => app.is_starred).length;
  }, [apps]);

  // Stats calculations
  const stats = useMemo(() => {
    if (apps.length === 0) {
      return {
        totalApps: 0,
        mostUsedType: "N/A",
        dateRange: "N/A"
      };
    }
    const typeCounts: Record<string, number> = {};
    apps.forEach(app => {
      typeCounts[app.app_type] = (typeCounts[app.app_type] || 0) + 1;
    });
    const mostUsedType = Object.entries(typeCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const oldestDate = apps.reduce((oldest, app) => new Date(app.created_at) < new Date(oldest.created_at) ? app : oldest).created_at;
    return {
      totalApps: apps.length,
      mostUsedType: mostUsedType.charAt(0).toUpperCase() + mostUsedType.slice(1),
      dateRange: format(new Date(oldestDate), "MMM yyyy")
    };
  }, [apps]);
  if (!session) {
    return null;
  }
  if (loading) {
    return <div className="min-h-screen bg-background">
        <header className="border-b bg-background">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-24" />
          </div>
        </header>
        <DashboardSkeleton />
      </div>;
  }
  const getViewTitle = () => {
    if (selectedView === "all") return "All Activities";
    if (selectedView === "starred") return "Starred Activities";
    const folder = folders.find(f => f.id === selectedView);
    return folder ? folder.name : "All Activities";
  };
  return <SidebarProvider defaultOpen>
      <div className="h-[100dvh] bg-sidebar flex w-full overflow-hidden">
        <DashboardSidebar folders={folders} selectedView={selectedView} onViewChange={setSelectedView} onFoldersUpdate={() => session && fetchFolders(session.user.id)} starredCount={starredCount} canCreate={canCreate} remainingApps={remainingApps} maxApps={getNumberFeature('max_apps')} userEmail={session?.user?.email} userId={session?.user?.id} isAdmin={isAdmin} onSignOut={handleSignOut} onCreateNew={openCreateDialog} isCreatingApp={isCreatingApp} showPromo={!subscriptionLoading && (!subscription?.subscribed || isFree)} />

        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Promotional Banner */}
          <PromotionalBanner location="dashboard_banner" onUpgrade={() => navigate("/upgrade")} />
          
          {/* Mobile Header with Sidebar Toggle */}
          <header className="md:hidden flex items-center gap-2 p-4 border-b bg-sidebar">
            <SidebarTrigger />
            <Logo size="sm" />
          </header>

          {needsOnboarding && <OnboardingFlow onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} />}

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 md:p-6">
              {/* Cohort Signal — greeting + insight tiles + primary CTA */}
              <div className="mb-12 mt-2 space-y-6">
                <CohortSignal
                  firstName={firstName}
                  activityCount={apps.length}
                  newThisMonth={newThisMonth}
                  studentsReached={studentsReached}
                  cohortsCount={cohortsCount}
                  lowestScoringApp={lowestScoringApp}
                  weeklyActivity={cohort.weekly}
                  recentResponses={cohort.recentResponseCount}
                  onGapClick={(appId) => navigate(`/analytics/${appId}`)}
                  onThisTermClick={() => {
                    setActiveBand(null);
                    setSelectedView("all");
                  }}
                />

                {cohort.responseCount > 0 && (
                  <ReadinessChart
                    bands={cohort.bands}
                    medianScore={cohort.medianScore}
                    completionRate={cohort.completionRate}
                    responseCount={cohort.responseCount}
                    activeBand={activeBand}
                    onBandClick={(band) => setActiveBand(prev => prev === band ? null : band)}
                    termLabel={cohort.termLabel}
                  />
                )}

                <NeedsAttention items={attentionItems} />
              </div>


              {/* My Learning Apps Section */}
              <div className="mb-8 mt-16">
                <h2 className="font-display italic text-3xl md:text-4xl mb-2">
                  {getViewTitle()}
                  
                </h2>
                <p className="text-muted-foreground">
                  Manage and share your activities with students
                </p>
              </div>

              {featuresLoading ? <div className="mb-6">
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div> : !canCreate && getNumberFeature('max_apps') !== 'unlimited' ? <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    You've reached your activity limit of {getNumberFeature('max_apps')}. 
                    <Button variant="link" className="p-0 h-auto text-amber-600 dark:text-amber-400 underline" onClick={() => navigate("/settings/billing")}>
                      Upgrade your plan
                    </Button> to create more activities.
                  </AlertDescription>
                </Alert> : null}

              {apps.length > 0 && <>
                  <DashboardFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} filterType={filterType} onFilterChange={setFilterType} sortBy={sortBy} onSortChange={setSortBy} viewMode={viewMode} onViewModeChange={setViewMode} />
                  {activeBand && (
                    <div className="mb-6 flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">
                        Showing activities in the <span className="text-foreground font-medium capitalize">{activeBand}</span> band
                      </span>
                      <Button variant="link" className="h-auto p-0 text-sm" onClick={() => setActiveBand(null)}>
                        Clear
                      </Button>
                    </div>
                  )}
                  <DraftsGroup
                    drafts={draftApps.map(d => ({ id: d.id, title: d.title, updated_at: d.updated_at }))}
                    onEdit={(id) => navigate(`/builder/${id}`)}
                    onDelete={(id) => {
                      const app = apps.find(a => a.id === id);
                      if (app) openDeleteDialog(app);
                    }}
                  />
                </>}


              {apps.length === 0 ? <Card className="text-center py-12">
                  <CardContent className="pt-6">
                    <div className="w-20 h-20 mx-auto mb-4 bg-secondary rounded-full flex items-center justify-center">
                      <Plus className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No activities yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first activity to get started
                    </p>
                    <Button onClick={openCreateDialog} disabled={isCreatingApp}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Activity
                    </Button>
                  </CardContent>
                </Card> : filteredApps.length === 0 ? <Card className="text-center py-12">
                  <CardContent className="pt-6">
                    <div className="w-20 h-20 mx-auto mb-4 bg-secondary rounded-full flex items-center justify-center">
                      <Plus className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No activities found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || filterType !== "all" ? "Try adjusting your search or filters" : selectedView === "starred" ? "You haven't starred any activities yet" : "No activities in this folder"}
                    </p>
                    {!searchQuery && filterType === "all" && selectedView === "all" && <Button onClick={openCreateDialog} disabled={isCreatingApp}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Activity
                      </Button>}
                  </CardContent>
                </Card> : <>
                    {viewMode === "grid" && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredApps.map((app, index) => <div key={app.id} className="animate-fade-in" style={{
                  animationDelay: `${index * 50}ms`
                }}>
                            <AppCard app={app} folders={folders} participantCount={participantCounts[app.id] || 0} isSelected={selectedApps.has(app.id)} onSelect={selected => toggleAppSelection(app.id, selected)} onEdit={() => navigate(`/builder/${app.id}`)} onPreview={() => window.open(`/play/${app.share_code}?preview=true`, "_blank")} onShare={() => handleShare(app.share_code)} onDelete={() => openDeleteDialog(app)} onToggleStar={isStarred => handleToggleStar(app.id, isStarred)} onMoveToFolder={folderId => handleMoveToFolder(app.id, folderId)} />
                          </div>)}
                      </div>}
                    
                    {viewMode === "table" && <AppTable apps={filteredApps} folders={folders} participantCounts={participantCounts} avgScores={avgScores} selectedApps={selectedApps} onSelectApp={toggleAppSelection} onSelectAll={selected => selected ? selectAllVisible() : clearSelection()} onEdit={app => navigate(`/builder/${app.id}`)} onPreview={app => window.open(`/play/${app.share_code}?preview=true`, "_blank")} onShare={app => handleShare(app.share_code)} onDelete={app => openDeleteDialog(app)} onToggleStar={(appId, isStarred) => handleToggleStar(appId, isStarred)} onMoveToFolder={(appId, folderId) => handleMoveToFolder(appId, folderId)} />}
                  </>}
            </div>
          </main>
        </div>
      </div>

      <BulkActionBar selectedCount={selectedApps.size} totalCount={filteredApps.length} onSelectAll={selectAllVisible} onDelete={() => setBulkDeleteDialogOpen(true)} onCancel={clearSelection} />

      <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleDelete} appTitle={appToDelete?.title || ""} />
      
      <DeleteConfirmDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen} onConfirm={handleBulkDelete} appCount={selectedApps.size} isBulkDelete={true} />

      <CreateActivityDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        isCreating={isCreatingApp}
        onChooseAI={() => createPlaceholderApp()}
        onChooseManual={(type) => createManualApp(type)}
      />
    </SidebarProvider>;
};
export default Dashboard;