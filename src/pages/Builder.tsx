import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings, CreditCard, Shield, MessageSquare, Presentation, BarChart3, Share2, PanelLeft, ArrowLeft, Info } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ChatInterface from "@/components/builder/ChatInterface";
import PreviewPanel from "@/components/builder/PreviewPanel";
import ShareModal from "@/components/builder/ShareModal";
import AnalyticsPanel from "@/components/builder/AnalyticsPanel";
import QuestionEditor from "@/components/builder/QuestionEditor";
import { FlashcardsEditor } from "@/components/builder/FlashcardsEditor";
import { MatchingGameEditor } from "@/components/builder/MatchingGameEditor";
import AudioSettings from "@/components/builder/AudioSettings";
import { ConfigHistory } from "@/lib/configHistory";
import { Logo } from "@/components/ui/logo";
import { BuilderOnboardingFlow } from "@/components/onboarding/BuilderOnboardingFlow";
import { useCredits } from "@/hooks/useCredits";

/**
 * timerSeconds: default time per question (in seconds, integer >= 0). 0 disables timer.
 */
export interface AppConfig {
  type: "quiz" | "flashcards" | "matching";
  title: string;
  /**
   * timerSeconds: default time per question (in seconds, integer >= 0). 0 disables timer.
   */
  timerSeconds?: number;
  showCorrectAnswers?: boolean; // @deprecated - use feedbackMode instead
  showExplanations?: boolean; // @deprecated - use feedbackMode instead
  /**
   * feedbackMode controls what students see after answering:
   * - 'full': Shows correct/incorrect + reveals correct answer + explanation
   * - 'basic': Shows correct/incorrect only, no answer reveal
   * - 'none': No feedback, auto-proceeds to next question (exam mode)
   */
  feedbackMode?: 'full' | 'basic' | 'none';
  allowRetakes?: boolean; // Whether to show "Play Again" button on results (disabled in exam mode)
  showQuestionBreakdown?: boolean;
  showLeaderboard?: boolean; // Whether to show "View Leaderboard" button on results (disabled in exam mode)
  shuffleQuestions?: boolean; // Whether to randomize question order for students
  backgroundAudio?: string; // YouTube URL or direct audio URL
  audioVolume?: number; // 0-100, default 50
  questions?: Array<{
    q: string;
    image?: string; // Question image URL
    options: string[];
    optionImages?: (string | null)[]; // Image per option
    answer: string;
    acceptedAnswers?: string[];
    hint?: string;
    explanation?: string; // Explanation shown after student answers
    questionType?: "multiple-choice" | "true-false" | "short-answer" | "fill-blank" | "poll" | "word-cloud" | "open-ended" | "slide";
    /**
     * timerSeconds: override for this question (in seconds, integer >= 0). 0 disables timer for this question.
     */
    timerSeconds?: number;
    content?: string; // For instructional slides
  }>;
  cards?: Array<{
    front: string;
    back: string;
    difficulty?: number;
    nextReview?: Date;
  }>;
  pairs?: Array<{
    prompt: string;
    answer: string;
  }>;
  theme: "indigo" | "emerald" | "slate" | "blue" | "amber" | "sky";
  difficulty?: "easy" | "medium" | "hard";
}

const Builder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appId } = useParams();
  const initialPrompt = location.state?.initialPrompt as string | undefined;
  const isMobile = useIsMobile();
  const [session, setSession] = useState<Session | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [savedAppId, setSavedAppId] = useState<string | null>(null);
  const [isLoadingApp, setIsLoadingApp] = useState(Boolean(appId && appId !== "new"));
  const [credits, setCredits] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unsavedMessages, setUnsavedMessages] = useState<any[]>([]);
  const [mobileTab, setMobileTab] = useState<"chat" | "builder">("chat");
  const configHistoryRef = useRef(new ConfigHistory());
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<string>('');
  
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(() => {
    const saved = localStorage.getItem('builder-chat-panel-open');
    return saved !== null ? saved === 'true' : true;
  });

  // Resizable chat panel width (percentage of viewport)
  const [chatWidth, setChatWidth] = useState(() => {
    const saved = Number(localStorage.getItem('builder-chat-panel-width'));
    return saved >= 20 && saved <= 70 ? saved : 20;
  });
  const isResizingRef = useRef(false);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const pct = (e.clientX / window.innerWidth) * 100;
      const clamped = Math.min(70, Math.max(20, pct));
      setChatWidth(clamped);
    };
    const handleUp = () => {
      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setChatWidth((w) => {
        localStorage.setItem('builder-chat-panel-width', String(Math.round(w)));
        return w;
      });
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  const startResizing = () => {
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  
  // Source context state - lifted from ChatInterface to persist across app creation/navigation
  const [documentContext, setDocumentContext] = useState<{
    fileName: string;
    text: string;
    characterCount: number;
    wasTruncated: boolean;
  } | null>(null);
  
  const [urlContext, setUrlContext] = useState<{
    url: string;
    hostname: string;
    title?: string;
    text: string;
    characterCount: number;
    wasTruncated: boolean;
  } | null>(null);
  
  // This hook triggers the monthly credit reset check on builder load
  const { refresh: refreshCredits } = useCredits();

  // Persist chat panel state
  useEffect(() => {
    localStorage.setItem('builder-chat-panel-open', String(isChatPanelOpen));
  }, [isChatPanelOpen]);

  // Fetch user credits
  const fetchCredits = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data, error } = await supabase.rpc('get_user_credits', {
      _user_id: session.user.id
    });

    if (!error && data !== null) {
      setCredits(data);
    }
  };

  // State for controlling tabs during onboarding
  const [activeTab, setActiveTab] = useState("preview");

  // Detect onboarding mode from URL and localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isOnboardingParam = params.get('onboarding') === 'true';
    const isOnboardingLocal = localStorage.getItem('is_onboarding') === 'true';
    const step = localStorage.getItem('onboarding_step') || '';
    
    if (isOnboardingParam || isOnboardingLocal) {
      setIsOnboarding(true);
      setOnboardingStep(step);
      // Force chat panel open during onboarding
      if (step === 'builder-chat' || step === 'builder-preview') {
        setIsChatPanelOpen(true);
      }
    }
  }, [location.search]);

  // Handle onboarding step changes to switch tabs
  const handleOnboardingStepChange = (step: string | null) => {
    if (!step) return;
    setOnboardingStep(step);
    
    // Auto-switch tabs based on step
    if (step === 'edit-tab') {
      setActiveTab('edit');
    } else if (step === 'settings-tab') {
      setActiveTab('settings');
    } else if (step === 'builder-preview') {
      setActiveTab('preview');
    }
  };

  // Load app if appId is provided in URL
  useEffect(() => {
    const loadApp = async () => {
      if (!appId || appId === "new") {
        setSavedAppId(null);
        setAppConfig(null);
        return;
      }

      setIsLoadingApp(true);
      try {
        const { data, error } = await supabase
          .from("apps")
          .select("*")
          .eq("id", appId)
          .single();

        if (error) throw error;

        if (data) {
          const config = data.config as unknown as AppConfig;
          // Only AI placeholders render as "nothing yet" (chat-first flow).
          // Manually created activities load straight into the editor.
          const isAiPlaceholder =
            !!(config as any).isPlaceholder && !(config as any).isManual;
          setAppConfig(isAiPlaceholder ? null : config);
          if (!isAiPlaceholder && (location.state as any)?.startInEditor) {
            setActiveTab("edit");
            setMobileTab("builder");
          }
          setSavedAppId(data.id);
          // Restore persisted document/URL context
          if ((data as any).document_context) {
            setDocumentContext((data as any).document_context);
          }
          if ((data as any).url_context) {
            setUrlContext((data as any).url_context);
          }
        }
      } catch (error: any) {
        console.error("Error loading app:", error);
        toast.error("Failed to load app");
        navigate("/builder/new");
      } finally {
        setIsLoadingApp(false);
      }
    };

    loadApp();
  }, [appId, navigate]);

  // Refetch app on window focus for cross-tab/session sync
  useEffect(() => {
    const handleFocus = async () => {
      if (!appId || appId === 'new' || !session) return;
      
      try {
        const { data, error } = await supabase
          .from("apps")
          .select("*")
          .eq("id", appId)
          .single();

        if (!error && data) {
          const config = data.config as unknown as AppConfig;
          // Only update if config has actually changed (avoid losing local edits)
          if (JSON.stringify(config) !== JSON.stringify(appConfig)) {
            setAppConfig(config);
            toast.info("App synced from another session");
          }
        }
      } catch (error) {
        console.error("Error refreshing app:", error);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [appId, session, appConfig]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setSession(session);
        fetchCredits();
        
        // Check admin status
        const { data: adminStatus } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin'
        });
        setIsAdmin(adminStatus || false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Wrapper functions that persist document/URL context to the database
  const handleSetDocumentContext = async (ctx: typeof documentContext) => {
    setDocumentContext(ctx);
    const id = savedAppId || appId;
    if (id && id !== 'new') {
      const { error } = await supabase.from('apps').update({ document_context: ctx } as any).eq('id', id);
      if (error) console.error('Failed to persist document context:', error);
      else console.log('Document context persisted for app:', id);
    }
  };

  const handleSetUrlContext = async (ctx: typeof urlContext) => {
    setUrlContext(ctx);
    const id = savedAppId || appId;
    if (id && id !== 'new') {
      const { error } = await supabase.from('apps').update({ url_context: ctx } as any).eq('id', id);
      if (error) console.error('Failed to persist URL context:', error);
      else console.log('URL context persisted for app:', id);
    }
  };

  const handleAppGenerated = (config: AppConfig) => {
    configHistoryRef.current.push(config);
    setAppConfig(config);
  };

  const handleConfigUpdate = (config: AppConfig) => {
    configHistoryRef.current.push(config);
    setAppConfig(config);
  };

  const handleUndo = () => {
    const previousConfig = configHistoryRef.current.undo();
    if (previousConfig) {
      setAppConfig(previousConfig);
      toast.success("Undone");
    }
  };

  const handleRedo = () => {
    const nextConfig = configHistoryRef.current.redo();
    if (nextConfig) {
      setAppConfig(nextConfig);
      toast.success("Redone");
    }
  };

  // Auto-save when appConfig changes
  useEffect(() => {
    const autoSave = async () => {
      if (!appConfig || !session) return;

      try {
        if (savedAppId) {
          // Update existing app
          await supabase
            .from("apps")
            .update({
              title: appConfig.title,
              app_type: appConfig.type,
              config: appConfig as any,
              theme: appConfig.theme,
            })
            .eq("id", savedAppId);
        } else {
          // Create new app on first generation
          // Generate a short 6-character alphanumeric code
          const generateShareCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            return Array.from({ length: 6 }, () => 
              chars[Math.floor(Math.random() * chars.length)]
            ).join('');
          };

          // Check for uniqueness and retry if collision occurs
          let shareCode = generateShareCode();
          let attempts = 0;
          while (attempts < 5) {
            const { data: existing } = await supabase
              .from('apps')
              .select('id')
              .eq('share_code', shareCode)
              .maybeSingle();
            
            if (!existing) break; // Code is unique
            shareCode = generateShareCode();
            attempts++;
          }

          const { data, error } = await supabase.from("apps").insert([{
            teacher_id: session.user.id,
            title: appConfig.title,
            app_type: appConfig.type,
            config: appConfig as any,
            theme: appConfig.theme,
            share_code: shareCode,
          }]).select().single();

          if (error) throw error;

          setSavedAppId(data.id);
          
          // Bulk-save unsaved chat messages if we have any
          if (unsavedMessages.length > 0 && session.user.id) {
            const messagesToSave = unsavedMessages.map(msg => ({
              user_id: session.user.id,
              app_id: data.id,
              role: msg.role,
              content: msg.content,
              attachment_kind: msg.attachment?.kind ?? null,
              attachment_label: msg.attachment?.label ?? null,
              attachment_sublabel: msg.attachment?.sublabel ?? null,
              attachment_href: msg.attachment?.href ?? null,
            }));

            const { error: messagesError } = await supabase
              .from("chat_messages")
              .insert(messagesToSave);

            if (messagesError) {
              console.error("Error saving chat messages:", messagesError);
            } else {
              // Clear unsaved messages after saving
              setUnsavedMessages([]);
            }
          }
          
          navigate(`/builder/${data.id}`, { replace: true });
          toast.success("App saved!");
        }
      } catch (error: any) {
        console.error("Auto-save error:", error);
      }
    };

    autoSave();
  }, [appConfig, session, savedAppId, navigate]);

  const handleShare = () => {
    if (!savedAppId) {
      toast.error("App not saved yet");
      return;
    }
    setShareModalOpen(true);
  };

  const handleOnboardingComplete = () => {
    setIsOnboarding(false);
    setOnboardingStep('');
  };

  const handleOnboardingSkip = () => {
    setIsOnboarding(false);
    setOnboardingStep('');
  };

  // Auto-switch mobile tabs during onboarding
  useEffect(() => {
    if (!isMobile || !isOnboarding) return;
    
    if (onboardingStep === 'builder-chat') {
      setMobileTab('chat');
    } else if (onboardingStep === 'builder-preview') {
      setMobileTab('builder');
    }
  }, [isOnboarding, onboardingStep, isMobile]);


  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="shrink-0 border-b bg-card shadow-none">
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4">
          <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
            <Logo size="md" />
            {appConfig && (
              <Input
                value={appConfig.title || ""}
                onChange={(e) =>
                  handleConfigUpdate({ ...appConfig, title: e.target.value })
                }
                placeholder="Untitled activity"
                aria-label="Activity title"
                className="h-9 min-w-0 flex-1 border-transparent bg-transparent px-2 text-sm font-medium hover:border-input focus-visible:border-input sm:w-[260px] sm:flex-none"
              />
            )}
          </div>

          
          <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-end sm:gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="px-2 sm:px-3">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
            {savedAppId && (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/analytics/${savedAppId}`)} className="builder-analytics-button px-2 sm:px-3">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Analytics
                </Button>
                <Button size="sm" onClick={handleShare} className="builder-assign-button px-2 sm:px-3">
                  <Share2 className="w-4 h-4 mr-1" />
                  Assign
                </Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {session?.user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">My Account</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings/billing")}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings/account")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Panel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex min-h-0 flex-1 flex-col">
        {isMobile ? (
          // Mobile Layout with Bottom Tabs
          <>
            {mobileTab === "chat" && (
              <div className="builder-chat-interface min-h-0 flex-1 overflow-hidden">
                {isLoadingApp ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">Loading app...</p>
                  </div>
                ) : (
                  <ChatInterface
                    appId={savedAppId}
                    onAppGenerated={handleAppGenerated} 
                    currentConfig={appConfig}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={configHistoryRef.current.canUndo()}
                    canRedo={configHistoryRef.current.canRedo()}
                    initialPrompt={initialPrompt}
                    onMessagesChange={setUnsavedMessages}
                    isOnboarding={isOnboarding}
                    onTogglePanel={() => setIsChatPanelOpen(false)}
                    documentContext={documentContext}
                    setDocumentContext={handleSetDocumentContext}
                    urlContext={urlContext}
                    setUrlContext={handleSetUrlContext}
                  />
                )}
              </div>
            )}

            {mobileTab === "builder" && (
              <div className="min-h-0 flex-1 overflow-hidden">
                {savedAppId ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-3 shrink-0">
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="edit" className="builder-edit-tab">Edit</TabsTrigger>
                    <TabsTrigger value="settings" className="builder-settings-tab">Settings</TabsTrigger>
                  </TabsList>
                  <TabsContent value="preview" className="flex-1 overflow-y-auto mt-0 p-4">
                    <div className="builder-preview-panel">
                      <PreviewPanel config={appConfig} appId={savedAppId} onConfigUpdate={handleConfigUpdate} />
                    </div>
                  </TabsContent>
                  <TabsContent value="edit" className="flex-1 overflow-y-auto mt-0 p-4">
                    {appConfig && appConfig.type === "quiz" && (
                      <QuestionEditor config={appConfig} onConfigUpdate={handleConfigUpdate} />
                    )}
                    {appConfig && appConfig.type === "flashcards" && (
                      <FlashcardsEditor config={appConfig} onConfigUpdate={handleConfigUpdate} />
                    )}
                    {appConfig && appConfig.type === "matching" && (
                      <MatchingGameEditor config={appConfig} onConfigUpdate={handleConfigUpdate} />
                    )}
                  </TabsContent>
                  <TabsContent value="settings" className="flex-1 overflow-y-auto mt-0 p-4">
                    {appConfig && (
                      <div className="max-w-2xl mx-auto space-y-6">
                        <div>
                          <h2 className="text-2xl font-bold mb-2">Quiz Behavior Settings</h2>
                          <p className="text-muted-foreground">Configure how your quiz behaves during play</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="feedback-mode-mobile" className="font-normal">
                              Feedback Mode
                            </Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-[280px]">
                                <p className="mb-2"><strong>Full:</strong> Shows correct/incorrect, reveals answer, and explanation</p>
                                <p className="mb-2"><strong>Basic:</strong> Shows only correct/incorrect status</p>
                                <p><strong>None:</strong> No feedback, auto-proceeds (exam mode)</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Select
                            value={appConfig.feedbackMode || (appConfig.showCorrectAnswers === false ? 'basic' : 'full')}
                            onValueChange={(value: 'full' | 'basic' | 'none') => {
                              handleConfigUpdate({
                                ...appConfig,
                                feedbackMode: value,
                                // Keep legacy fields in sync for backward compatibility
                                showCorrectAnswers: value === 'full',
                                showExplanations: value === 'full',
                                // Auto-disable retakes, question breakdown, and leaderboard in exam mode
                                allowRetakes: value === 'none' ? false : appConfig.allowRetakes,
                                showQuestionBreakdown: value === 'none' ? false : appConfig.showQuestionBreakdown,
                                showLeaderboard: value === 'none' ? false : appConfig.showLeaderboard,
                              });
                              const messages = {
                                full: "Full feedback enabled - students see correct/incorrect, answer, and explanation",
                                basic: "Basic feedback enabled - students only see if they got it right or wrong",
                                none: "No feedback - exam mode enabled, retakes disabled"
                              };
                              toast.success(messages[value]);
                            }}
                          >
                            <SelectTrigger id="feedback-mode-mobile" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full">Full Feedback (answer + explanation)</SelectItem>
                              <SelectItem value="basic">Basic Feedback (correct/incorrect only)</SelectItem>
                              <SelectItem value="none">No Feedback (exam mode)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="show-question-breakdown"
                            checked={appConfig.showQuestionBreakdown !== false && (appConfig.feedbackMode || 'full') !== 'none'}
                            disabled={(appConfig.feedbackMode || 'full') === 'none'}
                            onCheckedChange={(checked) => {
                              handleConfigUpdate({
                                ...appConfig,
                                showQuestionBreakdown: checked,
                              });
                              toast.success(checked ? "Question breakdown will be shown" : "Question breakdown will be hidden");
                            }}
                          />
                          <Label htmlFor="show-question-breakdown" className="font-normal cursor-pointer">
                            Show detailed question breakdown on results screen
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[250px]">
                              <p>{(appConfig.feedbackMode || 'full') === 'none' 
                                ? "Disabled in exam mode (No Feedback)" 
                                : "When enabled, students will see a complete breakdown of each question with their answers, correct answers, time spent, and hints used."}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="allow-retakes-mobile"
                            checked={appConfig.allowRetakes !== false}
                            disabled={(appConfig.feedbackMode || 'full') === 'none'}
                            onCheckedChange={(checked) => {
                              handleConfigUpdate({
                                ...appConfig,
                                allowRetakes: checked,
                              });
                              toast.success(checked ? "Students can retake the quiz" : "Retakes disabled");
                            }}
                          />
                          <Label 
                            htmlFor="allow-retakes-mobile" 
                            className={`font-normal cursor-pointer ${(appConfig.feedbackMode || 'full') === 'none' ? 'text-muted-foreground' : ''}`}
                          >
                            Allow students to retake
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[250px]">
                              <p>{(appConfig.feedbackMode || 'full') === 'none' 
                                ? "Disabled in exam mode (No Feedback)" 
                                : "Show 'Play Again' button on results screen"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="show-leaderboard-mobile"
                            checked={appConfig.showLeaderboard !== false && (appConfig.feedbackMode || 'full') !== 'none'}
                            disabled={(appConfig.feedbackMode || 'full') === 'none'}
                            onCheckedChange={(checked) => {
                              handleConfigUpdate({
                                ...appConfig,
                                showLeaderboard: checked,
                              });
                              toast.success(checked ? "Leaderboard button will be shown" : "Leaderboard button will be hidden");
                            }}
                          />
                          <Label 
                            htmlFor="show-leaderboard-mobile" 
                            className={`font-normal cursor-pointer ${(appConfig.feedbackMode || 'full') === 'none' ? 'text-muted-foreground' : ''}`}
                          >
                            Show leaderboard on results
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[250px]">
                              <p>{(appConfig.feedbackMode || 'full') === 'none' 
                                ? "Disabled in exam mode (No Feedback)" 
                                : "Show 'View Leaderboard' button on the results screen"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="shuffle-questions-mobile"
                            checked={appConfig.shuffleQuestions === true}
                            onCheckedChange={(checked) => {
                              handleConfigUpdate({
                                ...appConfig,
                                shuffleQuestions: checked,
                              });
                              toast.success(checked ? "Questions will be shuffled for each student" : "Questions will appear in order");
                            }}
                          />
                          <Label htmlFor="shuffle-questions-mobile" className="font-normal cursor-pointer">
                            Shuffle question order
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[250px]">
                              <p>Each student sees questions in a random order. Instructional slides stay with their following question. Great for preventing cheating!</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        <AudioSettings
                          audioUrl={appConfig.backgroundAudio}
                          volume={appConfig.audioVolume}
                          onUpdate={(url, volume) => {
                            handleConfigUpdate({
                              ...appConfig,
                              backgroundAudio: url,
                              audioVolume: volume,
                            });
                            toast.success(url ? "Background audio updated" : "Background audio removed");
                          }}
                        />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
                ) : (
                  <div className="h-full overflow-y-auto p-4">
                    <PreviewPanel config={appConfig} appId={savedAppId} onConfigUpdate={handleConfigUpdate} />
                  </div>
                )}
              </div>
            )}

            {/* Mobile Bottom Navigation */}
            <div className="shrink-0 h-14 bg-card border-t flex items-center justify-around z-50">
              <button
                onClick={() => setMobileTab("chat")}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                  mobileTab === "chat" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-xs font-medium">Chat</span>
              </button>
              <button
                onClick={() => setMobileTab("builder")}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                  mobileTab === "builder" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Presentation className="w-5 h-5" />
                <span className="text-xs font-medium">Builder</span>
              </button>
            </div>
          </>
        ) : (
          // Desktop Layout - Side by Side
          <div className="flex h-full min-h-0 flex-1 relative">
            {/* Left: Chat Interface - Collapsible */}
            <div 
              style={{ width: isChatPanelOpen ? `${chatWidth}%` : 0 }}
              className={`builder-chat-interface h-full overflow-hidden border-r ${
                isResizingRef.current ? "" : "transition-[width] duration-300 ease-in-out"
              } ${isChatPanelOpen ? "" : "border-r-0"}`}
            >

              {isLoadingApp ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Loading app...</p>
                </div>
              ) : (
                <ChatInterface
                  appId={savedAppId}
                  onAppGenerated={handleAppGenerated} 
                  currentConfig={appConfig}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  canUndo={configHistoryRef.current.canUndo()}
                  canRedo={configHistoryRef.current.canRedo()}
                  initialPrompt={initialPrompt}
                  onMessagesChange={setUnsavedMessages}
                  isOnboarding={isOnboarding}
                  onTogglePanel={() => setIsChatPanelOpen(false)}
                  documentContext={documentContext}
                  setDocumentContext={handleSetDocumentContext}
                  urlContext={urlContext}
                  setUrlContext={handleSetUrlContext}
                />
              )}
            </div>

            {/* Drag handle to resize chat panel */}
            {isChatPanelOpen && (
              <div
                role="separator"
                aria-orientation="vertical"
                onMouseDown={startResizing}
                onDoubleClick={() => {
                  setChatWidth(20);
                  localStorage.setItem('builder-chat-panel-width', '20');
                }}
                className="relative z-20 w-1.5 -ml-[3px] cursor-col-resize shrink-0 group"
                title="Drag to resize"
              >
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-transparent group-hover:bg-primary/60 transition-colors" />
              </div>
            )}


            {/* Floating button to show chat when hidden */}
            {!isChatPanelOpen && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChatPanelOpen(true)}
                className="absolute left-4 top-4 z-10 shadow-md"
              >
                <PanelLeft className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
            )}

            {/* Right: Preview & Controls */}
            <div className="flex-1 overflow-hidden">
              {savedAppId ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 shrink-0">
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="edit" className="builder-edit-tab">Edit</TabsTrigger>
                    <TabsTrigger value="settings" className="builder-settings-tab">Settings</TabsTrigger>
                  </TabsList>
                  <TabsContent value="preview" className="h-[calc(100vh-140px)] overflow-y-auto mt-0 p-6">
                    <div className="builder-preview-panel">
                      <PreviewPanel config={appConfig} appId={savedAppId} onConfigUpdate={handleConfigUpdate} />
                    </div>
                  </TabsContent>
                  <TabsContent value="edit" className="h-[calc(100vh-140px)] overflow-y-auto mt-0 p-6">
                    {appConfig && appConfig.type === "quiz" && (
                      <QuestionEditor config={appConfig} onConfigUpdate={handleConfigUpdate} />
                    )}
                    {appConfig && appConfig.type === "flashcards" && (
                      <FlashcardsEditor config={appConfig} onConfigUpdate={handleConfigUpdate} />
                    )}
                    {appConfig && appConfig.type === "matching" && (
                      <MatchingGameEditor config={appConfig} onConfigUpdate={handleConfigUpdate} />
                    )}
                  </TabsContent>
                  <TabsContent value="settings" className="h-[calc(100vh-140px)] overflow-y-auto mt-0 p-6">
                    {appConfig && (
                      <div className="max-w-2xl mx-auto space-y-6">
                        <div>
                          <h2 className="text-2xl font-bold mb-2">Quiz Behavior Settings</h2>
                          <p className="text-muted-foreground">Configure how your quiz behaves during play</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="feedback-mode" className="font-normal">
                              Feedback Mode
                            </Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-[280px]">
                                <p className="mb-2"><strong>Full:</strong> Shows correct/incorrect, reveals answer, and explanation</p>
                                <p className="mb-2"><strong>Basic:</strong> Shows only correct/incorrect status</p>
                                <p><strong>None:</strong> No feedback, auto-proceeds (exam mode)</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Select
                            value={appConfig.feedbackMode || (appConfig.showCorrectAnswers === false ? 'basic' : 'full')}
                            onValueChange={(value: 'full' | 'basic' | 'none') => {
                              handleConfigUpdate({
                                ...appConfig,
                                feedbackMode: value,
                                // Keep legacy fields in sync for backward compatibility
                                showCorrectAnswers: value === 'full',
                                showExplanations: value === 'full',
                                // Auto-disable retakes, question breakdown, and leaderboard in exam mode
                                allowRetakes: value === 'none' ? false : appConfig.allowRetakes,
                                showQuestionBreakdown: value === 'none' ? false : appConfig.showQuestionBreakdown,
                                showLeaderboard: value === 'none' ? false : appConfig.showLeaderboard,
                              });
                              const messages = {
                                full: "Full feedback enabled - students see correct/incorrect, answer, and explanation",
                                basic: "Basic feedback enabled - students only see if they got it right or wrong",
                                none: "No feedback - exam mode enabled, retakes disabled"
                              };
                              toast.success(messages[value]);
                            }}
                          >
                            <SelectTrigger id="feedback-mode" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full">Full Feedback (answer + explanation)</SelectItem>
                              <SelectItem value="basic">Basic Feedback (correct/incorrect only)</SelectItem>
                              <SelectItem value="none">No Feedback (exam mode)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="allow-retakes"
                            checked={appConfig.allowRetakes !== false}
                            disabled={(appConfig.feedbackMode || 'full') === 'none'}
                            onCheckedChange={(checked) => {
                              handleConfigUpdate({
                                ...appConfig,
                                allowRetakes: checked,
                              });
                              toast.success(checked ? "Students can retake the quiz" : "Retakes disabled");
                            }}
                          />
                          <Label 
                            htmlFor="allow-retakes" 
                            className={`font-normal cursor-pointer ${(appConfig.feedbackMode || 'full') === 'none' ? 'text-muted-foreground' : ''}`}
                          >
                            Allow students to retake
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[250px]">
                              <p>{(appConfig.feedbackMode || 'full') === 'none' 
                                ? "Disabled in exam mode (No Feedback)" 
                                : "Show 'Play Again' button on results screen"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="show-leaderboard"
                            checked={appConfig.showLeaderboard !== false && (appConfig.feedbackMode || 'full') !== 'none'}
                            disabled={(appConfig.feedbackMode || 'full') === 'none'}
                            onCheckedChange={(checked) => {
                              handleConfigUpdate({
                                ...appConfig,
                                showLeaderboard: checked,
                              });
                              toast.success(checked ? "Leaderboard button will be shown" : "Leaderboard button will be hidden");
                            }}
                          />
                          <Label 
                            htmlFor="show-leaderboard" 
                            className={`font-normal cursor-pointer ${(appConfig.feedbackMode || 'full') === 'none' ? 'text-muted-foreground' : ''}`}
                          >
                            Show leaderboard on results
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[250px]">
                              <p>{(appConfig.feedbackMode || 'full') === 'none' 
                                ? "Disabled in exam mode (No Feedback)" 
                                : "Show 'View Leaderboard' button on the results screen"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="show-question-breakdown"
                            checked={appConfig.showQuestionBreakdown !== false && (appConfig.feedbackMode || 'full') !== 'none'}
                            disabled={(appConfig.feedbackMode || 'full') === 'none'}
                            onCheckedChange={(checked) => {
                              handleConfigUpdate({
                                ...appConfig,
                                showQuestionBreakdown: checked,
                              });
                              toast.success(checked ? "Question breakdown will be shown" : "Question breakdown will be hidden");
                            }}
                          />
                          <Label htmlFor="show-question-breakdown" className="font-normal cursor-pointer">
                            Show detailed question breakdown on results screen
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[250px]">
                              <p>{(appConfig.feedbackMode || 'full') === 'none' 
                                ? "Disabled in exam mode (No Feedback)" 
                                : "When enabled, students will see a complete breakdown of each question with their answers, correct answers, time spent, and hints used."}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="shuffle-questions"
                            checked={appConfig.shuffleQuestions === true}
                            onCheckedChange={(checked) => {
                              handleConfigUpdate({
                                ...appConfig,
                                shuffleQuestions: checked,
                              });
                              toast.success(checked ? "Questions will be shuffled for each student" : "Questions will appear in order");
                            }}
                          />
                          <Label htmlFor="shuffle-questions" className="font-normal cursor-pointer">
                            Shuffle question order
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[250px]">
                              <p>Each student sees questions in a random order. Instructional slides stay with their following question. Great for preventing cheating!</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        <AudioSettings
                          audioUrl={appConfig.backgroundAudio}
                          volume={appConfig.audioVolume}
                          onUpdate={(url, volume) => {
                            handleConfigUpdate({
                              ...appConfig,
                              backgroundAudio: url,
                              audioVolume: volume,
                            });
                            toast.success(url ? "Background audio updated" : "Background audio removed");
                          }}
                        />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex-1 overflow-y-auto p-4">
                  <PreviewPanel config={appConfig} appId={savedAppId} onConfigUpdate={handleConfigUpdate} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Builder Onboarding Flow */}
      {isOnboarding && onboardingStep && savedAppId && (
        <BuilderOnboardingFlow
          currentStep={onboardingStep as any}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
          appId={savedAppId}
          onStepChange={handleOnboardingStepChange}
        />
      )}

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        appId={savedAppId}
      />
    </div>
  );
};

export default Builder;
