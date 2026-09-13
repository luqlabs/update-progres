import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Loader2, Send, Bot, Undo2, Redo2, Paperclip, X, FileText, Link, ChevronDown, PanelLeftClose, Sparkles, Wand2, Check } from "lucide-react";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppConfig } from "@/pages/Builder";
import { validateEducationalIntent, isDestructiveChange, classifyIntent } from "@/lib/aiValidation";
import ConfirmDialog from "./ConfirmDialog";
import SmartSuggestions from "./SmartSuggestions";
import { CommandAutocomplete } from "./CommandAutocomplete";
import ReactMarkdown from "react-markdown";
import { parseDocument, extractTextFromSelectedPages } from "@/lib/documentParser";
import PdfPageSelector from "./PdfPageSelector";
import { fetchUrlContent, ParsedUrl } from "@/lib/urlParser";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface MessageAttachment {
  kind: "document" | "url";
  label: string;
  sublabel?: string;
  href?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  createdAt?: number;
  attachment?: MessageAttachment;
  /** Suggested quick replies for a clarifying question */
  options?: string[];
  /** How the options can be answered */
  optionMode?: "single" | "multi";
  /** Whether the user may also type a free-text answer */
  allowFreeText?: boolean;
  /** The answer the user picked (locks the card) */
  answeredWith?: string;
}


// Format a timestamp Lovable-chat style
function formatChatTime(ts: number, now: number): string {
  const diffSec = Math.max(0, Math.floor((now - ts) / 1000));
  if (diffSec < 45) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  const d = new Date(ts);
  const nd = new Date(now);
  const sameDay = d.toDateString() === nd.toDateString();
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (sameDay) {
    const diffH = Math.floor(diffSec / 3600);
    if (diffH < 8) return `${diffH}h ago`;
    return timeStr;
  }
  const yest = new Date(nd);
  yest.setDate(nd.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return `Yesterday ${timeStr}`;
  const sameYear = d.getFullYear() === nd.getFullYear();
  return `${d.toLocaleDateString([], { month: "short", day: "numeric", year: sameYear ? undefined : "numeric" })} ${timeStr}`;
}

function MessageMeta({ ts, align }: { ts: number; align: "left" | "right" }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  const full = new Date(ts).toLocaleString();
  return (
    <p
      className={`text-[10px] text-muted-foreground mt-1 px-1 ${align === "right" ? "text-right" : "text-left"}`}
      title={full}
    >
      {formatChatTime(ts, now)}
    </p>
  );
}

function AttachmentChip({
  attachment,
  onRemove,
  interactive = false,
}: {
  attachment: MessageAttachment;
  onRemove?: () => void;
  interactive?: boolean;
}) {
  const Icon = attachment.kind === "document" ? FileText : Link;
  const content = (
    <>
      <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />
      <span className="text-xs truncate">{attachment.label}</span>
      {attachment.sublabel && (
        <span className="text-[10px] opacity-70 flex-shrink-0">{attachment.sublabel}</span>
      )}
    </>
  );
  const base =
    "flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/60 border border-border/60 max-w-full";
  if (interactive && attachment.kind === "url" && attachment.href) {
    return (
      <a
        href={attachment.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} hover:bg-background/90 transition-colors`}
      >
        {content}
      </a>
    );
  }
  return (
    <div className={base}>
      {content}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 opacity-70 hover:opacity-100"
          aria-label="Remove attachment"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

const LET_AI_DECIDE = "You decide, pick what fits best";

/**
 * A clarifying question card: the assistant asks one thing, the lecturer
 * answers by tapping. Locks once answered so the history reads clearly.
 */
function ClarifyCard({
  options,
  mode,
  allowFreeText,
  answeredWith,
  disabled,
  onAnswer,
}: {
  options: string[];
  mode: "single" | "multi";
  allowFreeText: boolean;
  answeredWith?: string;
  disabled?: boolean;
  onAnswer: (answer: string) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  if (answeredWith) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Check className="w-3 h-3 text-primary flex-shrink-0" />
        <span className="truncate">You answered: {answeredWith}</span>
      </div>
    );
  }

  const toggle = (option: string) => {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  return (
    <div className="mt-2 w-full max-w-[90%] rounded-md border border-border bg-background p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
        {mode === "multi" ? "Pick any that apply" : "Pick one"}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => (mode === "multi" ? toggle(option) : onAnswer(option))}
              className={`px-3 py-1.5 rounded-md border text-xs transition-colors disabled:opacity-50 ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:bg-secondary"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3">
        {mode === "multi" && (
          <Button
            size="sm"
            className="h-7 text-xs"
            disabled={disabled || selected.length === 0}
            onClick={() => onAnswer(selected.join(", "))}
          >
            Confirm
          </Button>
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onAnswer(LET_AI_DECIDE)}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-50"
        >
          Let the assistant decide
        </button>
      </div>
      {allowFreeText && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Or type your own answer below.
        </p>
      )}
    </div>
  );
}


interface DocumentContextType {
  fileName: string;
  text: string;
  characterCount: number;
  wasTruncated: boolean;
}

interface UrlContextType {
  url: string;
  hostname: string;
  title?: string;
  text: string;
  characterCount: number;
  wasTruncated: boolean;
}

interface ChatInterfaceProps {
  appId: string | null;
  onAppGenerated: (config: AppConfig) => void;
  onUpdateConfig?: (config: AppConfig) => void;
  currentConfig: AppConfig | null;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  initialPrompt?: string;
  onMessagesChange?: (messages: Message[]) => void;
  isOnboarding?: boolean;
  onTogglePanel?: () => void;
  // Source context - lifted to parent to persist across app creation/navigation
  documentContext: DocumentContextType | null;
  setDocumentContext: (context: DocumentContextType | null) => void;
  urlContext: UrlContextType | null;
  setUrlContext: (context: UrlContextType | null) => void;
}

// Action types from chat-assistant
interface ChatAction {
  action: string;
  data: Record<string, any>;
}

interface DbMessage {
  id: string;
  user_id: string;
  app_id: string | null;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

const ChatInterface = ({ 
  appId,
  onAppGenerated, 
  onUpdateConfig,
  currentConfig, 
  onUndo, 
  onRedo, 
  canUndo = false, 
  canRedo = false,
  initialPrompt,
  onMessagesChange,
  isOnboarding = false,
  onTogglePanel,
  documentContext,
  setDocumentContext,
  urlContext,
  setUrlContext
}: ChatInterfaceProps) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [showCommandAutocomplete, setShowCommandAutocomplete] = useState(false);
  const [commandType, setCommandType] = useState<'/quiz' | '/theme' | null>(null);
  const [commandStartPos, setCommandStartPos] = useState(0);
  const [hasProcessedInitialPrompt, setHasProcessedInitialPrompt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); // Track if generating content vs chatting
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Document upload state - only transient UI state stays local
  const [isParsingFile, setIsParsingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // URL import state - only transient UI state stays local
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  
  // PDF page selection state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [showPageSelector, setShowPageSelector] = useState(false);

  // Signal that we just created an app locally in this session — used to skip
  // the DB history refetch when appId flips from "new" to a real UUID after
  // first generation (the in-memory messages are the source of truth).
  const justCreatedRef = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Notify parent of message changes (for bulk-saving later)
  useEffect(() => {
    if (onMessagesChange && (!appId || appId === "new")) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange, appId]);

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

  // Load user ID and chat history for this specific app
  useEffect(() => {
    const loadChatHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      setUserId(session.user.id);
      
      // Fetch credits
      fetchCredits();

      // For new apps, always start fresh with welcome message
      if (!appId || appId === "new") {
        setMessages([{
          role: "assistant",
          content: "Hey! 👋 I'm here to help you create engaging learning experiences.\n\nJust tell me what you're thinking, whether it's a quiz, flashcards, or a matching game. You can be as specific or vague as you want. I'll ask questions if I need more details!\n\n**Quick examples:**\n• \"Create a lecture quiz on microeconomics\"\n• \"I need vocabulary flashcards for business English\"\n• \"Build a compliance training assessment\"\n\nWhat would you like to create?",
        }]);
        return;
      }

      // If we just created this app in this session, our in-memory messages are
      // the authoritative conversation. Skip refetch to avoid a race with the
      // parent's bulk insert of chat_messages right before navigate().
      if (justCreatedRef.current) {
        justCreatedRef.current = false;
        return;
      }

      // Load messages from database for existing apps
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("app_id", appId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading chat history:", error);
        setMessages([{
          role: "assistant",
          content: "Hey! 👋 I'm here to help you create engaging learning experiences.\n\nJust tell me what you're thinking, whether it's a quiz, flashcards, or a matching game. You can be as specific or vague as you want. I'll ask questions if I need more details!\n\n**Quick examples:**\n• \"Create a lecture quiz on microeconomics\"\n• \"I need vocabulary flashcards for business English\"\n• \"Build a compliance training assessment\"\n\nWhat would you like to create?",
        }]);
      } else if (data && data.length > 0) {
        const fromDb: Message[] = data.map((msg: any) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
          createdAt: msg.created_at ? new Date(msg.created_at).getTime() : Date.now(),
          options: Array.isArray(msg.options) && msg.options.length > 0 ? (msg.options as string[]) : undefined,
          optionMode: msg.option_mode === "multi" ? "multi" : msg.option_mode === "single" ? "single" : undefined,
          answeredWith: msg.answered_with || undefined,
          attachment: msg.attachment_kind && msg.attachment_label
            ? {
                kind: msg.attachment_kind as "document" | "url",
                label: msg.attachment_label as string,
                sublabel: msg.attachment_sublabel || undefined,
                href: msg.attachment_href || undefined,
              }
            : undefined,
        }));

        setMessages((prev) => (prev.length > fromDb.length ? prev : fromDb));
      } else {
        setMessages([{
          role: "assistant",
          content: "Hey! 👋 I'm here to help you create engaging learning experiences.\n\nJust tell me what you're thinking, whether it's a quiz, flashcards, or a matching game. You can be as specific or vague as you want. I'll ask questions if I need more details!\n\n**Quick examples:**\n• \"Create a lecture quiz on microeconomics\"\n• \"I need vocabulary flashcards for business English\"\n• \"Build a compliance training assessment\"\n\nWhat would you like to create?",
        }]);
      }
    };

    loadChatHistory();
  }, [appId]);

  // Snapshot the currently-attached source (document/URL) onto an outgoing user message
  const buildAttachmentSnapshot = (): MessageAttachment | undefined => {
    if (documentContext) {
      return {
        kind: "document",
        label: documentContext.fileName,
        sublabel: documentContext.wasTruncated ? "trimmed" : undefined,
      };
    }
    if (urlContext) {
      return {
        kind: "url",
        label: urlContext.title || urlContext.hostname,
        sublabel: urlContext.hostname && urlContext.title ? urlContext.hostname : undefined,
        href: urlContext.url,
      };
    }
    return undefined;
  };

  // Ensure every message has a createdAt so timestamps render Lovable-style
  useEffect(() => {
    if (messages.some((m) => !m.createdAt)) {
      const now = Date.now();
      setMessages((prev) => prev.map((m) => (m.createdAt ? m : { ...m, createdAt: now })));
    }
  }, [messages]);

  // Auto-send initial prompt from dashboard
  useEffect(() => {
    if (
      initialPrompt && 
      !hasProcessedInitialPrompt && 
      !isLoading && 
      userId && 
      messages.length === 1 && 
      (!currentConfig || (currentConfig as any).isPlaceholder)
    ) {
      setHasProcessedInitialPrompt(true);

      // Route the first prompt through the assistant too, so it can ask a
      // clarifying question instead of guessing what to build.
      setTimeout(() => {
        setInput("");
        streamConversation(initialPrompt);
      }, 300);
    }

  }, [initialPrompt, hasProcessedInitialPrompt, isLoading, userId, messages, appId]);

  // Auto-send onboarding welcome message when app is created
  useEffect(() => {
    if (isOnboarding && appId && appId !== "new" && messages.length === 1) {
      const onboardingWelcome: Message = {
        role: "assistant",
        content: `🎉 Great job! Your ${currentConfig?.type || 'app'} is created!\n\n**Now you can customize it:**\n• "Make question 3 easier"\n• "Add a 30-second timer"\n• "Switch to emerald theme"\n• "Add 2 more questions about [topic]"\n\n**Just type naturally and I'll help!**`
      };
      
      setMessages(prev => [...prev, onboardingWelcome]);
      
      // Save to DB if appId exists
      if (appId !== "new") {
        saveMessage("assistant", onboardingWelcome.content);
      }
    }
  }, [isOnboarding, appId, currentConfig?.type]);

  // One-time credit charge token: set when a user message is charged by
  // chat-assistant, consumed by the generate-app call that follows it.
  const prepaidMessageIdRef = useRef<string | null>(null);

  // Save message to database with app_id
  // Only save to database if we have an appId (not for new apps)
  // Returns the inserted message id (used as the credit charge token)
  const saveMessage = async (
    role: "user" | "assistant",
    content: string,
    attachment?: MessageAttachment,
    meta?: { options?: string[]; optionMode?: "single" | "multi" }
  ): Promise<string | null> => {
    if (!userId || !appId || appId === "new") return null;

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        user_id: userId,
        app_id: appId,
        role,
        content,
        attachment_kind: attachment?.kind ?? null,
        attachment_label: attachment?.label ?? null,
        attachment_sublabel: attachment?.sublabel ?? null,
        attachment_href: attachment?.href ?? null,
        options: meta?.options?.length ? meta.options : null,
        option_mode: meta?.options?.length ? (meta.optionMode ?? "single") : null,
      } as any)
      .select("id")
      .single();


    if (error) {
      console.error("Error saving message:", error);
      return null;
    }
    return (data as any)?.id ?? null;
  };

  // Generate context-aware, varied responses
  const generateAIResponse = (config: AppConfig, previousConfig: AppConfig | null, userPrompt: string, warnings?: string[]): string => {
    const isNewApp = !previousConfig;
    const typeEmojis = {
      quiz: "📝",
      flashcards: "🎴",
      "matching": "🎯"
    };
    
    const emoji = typeEmojis[config.type as keyof typeof typeEmojis] || "✨";
    
    // Detect what changed
    const detectChanges = () => {
      if (isNewApp) {
        const itemCount = config.type === "quiz" 
          ? config.questions?.length || 0
          : config.type === "flashcards"
          ? config.cards?.length || 0
          : config.pairs?.length || 0;
        
        return {
          type: "created",
          details: itemCount > 0 ? `with ${itemCount} ${config.type === "quiz" ? "questions" : config.type === "flashcards" ? "cards" : "pairs"}` : ""
        };
      }
      
      // Detect specific changes for updates
      const changes = [];
      
      if (previousConfig.title !== config.title) {
        changes.push(`renamed to "${config.title}"`);
      }
      
      if (config.type === "quiz" && previousConfig.type === "quiz") {
        const prevQCount = previousConfig.questions?.length || 0;
        const newQCount = config.questions?.length || 0;
        const diff = newQCount - prevQCount;
        
        if (diff > 0) {
          changes.push(`added ${diff} ${diff === 1 ? "question" : "questions"}`);
        } else if (diff < 0) {
          changes.push(`removed ${Math.abs(diff)} ${Math.abs(diff) === 1 ? "question" : "questions"}`);
        }
      }
      
      if (previousConfig.theme !== config.theme) {
        changes.push(`switched to ${config.theme} theme`);
      }
      
      if (previousConfig.difficulty !== config.difficulty) {
        changes.push(`changed difficulty to ${config.difficulty}`);
      }
      
      return {
        type: "updated",
        details: changes.length > 0 ? changes.join(", ") : "modified"
      };
    };
    
    const change = detectChanges();
    
    // Response templates for creation
    const createdTemplates = [
      `Awesome! ${emoji} Created "${config.title}" ${change.details}. Ready to share!`,
      `Perfect! ${emoji} Your new "${config.title}" is ready ${change.details}!`,
      `Nice! ${emoji} "${config.title}" is all set ${change.details}. Let's go!`,
      `Great job! ${emoji} Built "${config.title}" ${change.details}. Looking good!`,
      `Done! ${emoji} "${config.title}" is ready to use ${change.details}!`
    ];
    
    // Response templates for updates
    const updatedTemplates = [
      `Updated! ✅ ${change.details ? "I've " + change.details + " for" : "Modified"} "${config.title}".`,
      `Done! ✅ ${change.details ? change.details.charAt(0).toUpperCase() + change.details.slice(1) : "Updated"} "${config.title}".`,
      `Perfect! ✅ "${config.title}" ${change.details ? "- " + change.details : "has been updated"}.`,
      `Nice! ✅ ${change.details ? change.details.charAt(0).toUpperCase() + change.details.slice(1) + " in" : "Modified"} "${config.title}".`,
      `All set! ✅ ${change.details ? "Just " + change.details + " for" : "Updated"} "${config.title}".`
    ];
    
    const templates = isNewApp ? createdTemplates : updatedTemplates;
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    let response = randomTemplate;
    
    // Add contextual next steps
    if (isNewApp) {
      const suggestions = [
        "Try it out in the preview!",
        "Check it out on the right!",
        "Take a look at the preview!",
        "See how it looks!",
        "Preview it now!"
      ];
      response += " " + suggestions[Math.floor(Math.random() * suggestions.length)];
    }
    
    // Handle warnings with friendly tone
    if (warnings && warnings.length > 0) {
      response += `\n\n⚠️ Quick heads up:\n${warnings.map((w: string) => `• ${w}`).join('\n')}`;
    }
    
    return response;
  };

  const processGeneration = async (promptText: string) => {
    if (isLoading) return;

    // Validate input
    const validation = validateEducationalIntent(promptText);
    if (!validation.valid) {
      toast.error(validation.errors[0]);
      return;
    }

    // Check for destructive changes
    if (currentConfig && isDestructiveChange(promptText, currentConfig)) {
      setPendingPrompt(promptText);
      setConfirmDialogOpen(true);
      return;
    }

    await executeGeneration(promptText);
  };

  // Internal generation function - skipUserMessage is used when coming from conversation flow
  const executeGeneration = async (promptText: string, skipUserMessage = false) => {
    // When this generation continues a chat message, reuse that message's
    // credit charge (one request = one credit) instead of charging again.
    const prepaidMessageId = skipUserMessage ? prepaidMessageIdRef.current : null;
    prepaidMessageIdRef.current = null;

    // Only add user message if not coming from conversation flow
    if (!skipUserMessage) {
      const attachmentSnapshot = buildAttachmentSnapshot();
      const userMessage: Message = { role: "user", content: promptText, createdAt: Date.now(), attachment: attachmentSnapshot };
      setMessages((prev) => [...prev, userMessage]);
      await saveMessage("user", promptText, attachmentSnapshot);
    }
    
    setIsLoading(true);
    setIsGenerating(true);

    try {
      // Combine document and URL content
      const combinedContent = [
        documentContext?.text,
        urlContext?.text,
      ].filter(Boolean).join('\n\n--- ADDITIONAL CONTENT ---\n\n');
      
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'generate-app',
        { 
          body: { 
            prompt: promptText,
            documentContent: combinedContent || undefined,
            currentConfig: currentConfig,
            prepaidMessageId: prepaidMessageId || undefined
          } 
        }
      );

      if (functionError) throw functionError;

      if (functionData.error) {
        const errorMsg = functionData.error;
        const assistantMessage: Message = { 
          role: "assistant", 
          content: errorMsg 
        };
        setMessages((prev) => [...prev, assistantMessage]);
        await saveMessage("assistant", errorMsg);
        toast.error(errorMsg);
        return;
      }

      const { config, warnings } = functionData;
      const action = currentConfig ? "updated" : "created";
      
      const responseText = generateAIResponse(config, currentConfig, promptText, warnings);
      
      const assistantMessage: Message = { 
        role: "assistant", 
        content: responseText 
      };
      
      // CRITICAL: For new apps, ensure parent gets updated messages BEFORE navigation
      // Build the complete message list including the user message we added earlier
      // (since 'messages' closure may not yet reflect the setMessages call from line 394)
      // IMPORTANT: Use promptText directly from function parameter to ensure full original text is preserved
      const userMessage: Message = { role: "user", content: promptText, createdAt: Date.now(), attachment: buildAttachmentSnapshot() };
      
      console.log("[ChatInterface] Building fullMessages with promptText length:", promptText.length);
      console.log("[ChatInterface] Full promptText:", promptText);
      
      // For new apps at /builder/new, build the complete conversation
      // The closure 'messages' is stale and only contains [welcome], so we explicitly add user message
      if (!appId || appId === "new") {
        // Mark that we just created an app locally so the loadChatHistory effect
        // skips its refetch when appId flips to the real UUID after navigate().
        justCreatedRef.current = true;
        // messages = [welcome], we need [welcome, user, assistant]
        const fullMessages = [...messages, userMessage, assistantMessage];
        
        console.log("[ChatInterface] Full messages being saved:", fullMessages.map(m => ({ role: m.role, contentLength: m.content.length, preview: m.content.substring(0, 80) })));
        
        setMessages(fullMessages);
        
        if (onMessagesChange) {
          onMessagesChange(fullMessages);
        }
      } else {
        // For existing apps, just add assistant message (user was already saved in real-time)
        setMessages((prev) => [...prev, assistantMessage]);
      }
      
      // For existing apps, save to DB
      if (appId && appId !== "new") {
        await saveMessage("assistant", responseText);
      }
      
      onAppGenerated(config);
      toast.success(`App ${action} successfully!`);
      
      // Refresh credits after successful generation
      fetchCredits();
    } catch (error: any) {
      console.error("Error generating app:", error);
      console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      let errorMessage = "Sorry, I encountered an error. ";
      
      if (error.message?.includes("Rate limits")) {
        errorMessage += "Rate limit reached. Please try again in a moment.";
      } else if (error.message?.includes("Payment required")) {
        errorMessage += "Please add credits to your workspace to continue.";
      } else {
        errorMessage += "Please try rephrasing your request. Error: " + (error.message || "Unknown error");
      }
      
      const assistantMessage: Message = { 
        role: "assistant", 
        content: errorMessage 
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      await saveMessage("assistant", errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  // Handle action-based responses from AI
  const handleAction = async (action: ChatAction): Promise<void> => {
    console.log("Handling action:", action.action, action.data);
    
    switch (action.action) {
      case "add_question": {
        if (!currentConfig || currentConfig.type !== 'quiz') {
          const msg = "I'll create a new quiz first, then add that question.";
          setMessages(prev => [...prev, { role: "assistant", content: msg }]);
          await saveMessage("assistant", msg);
          // Trigger generation with the question
          await executeGeneration(`Create a quiz and add this question: ${action.data.question}`, true);
          return;
        }
        
        // Add question to existing config - use correct AppConfig types
        const options = action.data.options || ['Option A', 'Option B', 'Option C', 'Option D'];
        const correctIndex = action.data.correctAnswer ?? 0;
        const newQuestion = {
          q: action.data.question,
          questionType: (action.data.questionType || 'multiple-choice') as "multiple-choice" | "true-false" | "short-answer" | "fill-blank" | "poll" | "word-cloud" | "open-ended" | "slide",
          options: options,
          answer: options[correctIndex] || options[0], // answer is the correct option text
          hint: action.data.explanation || '',
          explanation: action.data.explanation || '',
        };
        
        const updatedConfig: AppConfig = {
          ...currentConfig,
          questions: [...(currentConfig.questions || []), newQuestion],
        };
        
        if (onUpdateConfig) {
          onUpdateConfig(updatedConfig);
        }
        onAppGenerated(updatedConfig);
        
        const msg = `Added question: "${action.data.question.slice(0, 50)}${action.data.question.length > 50 ? '...' : ''}"`;
        setMessages(prev => [...prev, { role: "assistant", content: msg }]);
        await saveMessage("assistant", msg);
        toast.success("Question added!");
        fetchCredits();
        break;
      }
      
      case "add_flashcard": {
        if (!currentConfig || currentConfig.type !== 'flashcards') {
          const msg = "I'll create a new flashcard set first.";
          setMessages(prev => [...prev, { role: "assistant", content: msg }]);
          await saveMessage("assistant", msg);
          await executeGeneration(`Create flashcards and add: ${action.data.term} - ${action.data.definition}`, true);
          return;
        }
        
        // Use correct AppConfig types - cards use front/back not term/definition
        const newCard = {
          front: action.data.term,
          back: action.data.definition,
        };
        
        const updatedConfig: AppConfig = {
          ...currentConfig,
          cards: [...(currentConfig.cards || []), newCard],
        };
        
        if (onUpdateConfig) {
          onUpdateConfig(updatedConfig);
        }
        onAppGenerated(updatedConfig);
        
        const msg = `Added flashcard: "${action.data.term}"`;
        setMessages(prev => [...prev, { role: "assistant", content: msg }]);
        await saveMessage("assistant", msg);
        toast.success("Flashcard added!");
        fetchCredits();
        break;
      }
      
      case "add_matching_pair": {
        if (!currentConfig || currentConfig.type !== 'matching') {
          const msg = "I'll create a new matching game first.";
          setMessages(prev => [...prev, { role: "assistant", content: msg }]);
          await saveMessage("assistant", msg);
          await executeGeneration(`Create a matching game and add: ${action.data.left} matches with ${action.data.right}`, true);
          return;
        }
        
        // Use correct AppConfig types - pairs use prompt/answer not left/right
        const newPair = {
          prompt: action.data.left,
          answer: action.data.right,
        };
        
        const updatedConfig: AppConfig = {
          ...currentConfig,
          pairs: [...(currentConfig.pairs || []), newPair],
        };
        
        if (onUpdateConfig) {
          onUpdateConfig(updatedConfig);
        }
        onAppGenerated(updatedConfig);
        
        const msg = `Added matching pair: "${action.data.left}" ↔ "${action.data.right}"`;
        setMessages(prev => [...prev, { role: "assistant", content: msg }]);
        await saveMessage("assistant", msg);
        toast.success("Matching pair added!");
        fetchCredits();
        break;
      }
      
      case "delete_content": {
        if (!currentConfig) {
          const msg = "There's no content to delete yet.";
          setMessages(prev => [...prev, { role: "assistant", content: msg }]);
          await saveMessage("assistant", msg);
          return;
        }
        
        let updatedConfig: AppConfig;
        let deleteMessage: string;
        
        if (action.data.deleteType === "all") {
          // Clear all items based on type
          if (currentConfig.type === 'quiz') {
            updatedConfig = { ...currentConfig, questions: [] };
            deleteMessage = "Deleted all questions. Your quiz is now empty - add new questions anytime!";
          } else if (currentConfig.type === 'flashcards') {
            updatedConfig = { ...currentConfig, cards: [] };
            deleteMessage = "Deleted all flashcards. Your set is now empty - add new cards anytime!";
          } else if (currentConfig.type === 'matching') {
            updatedConfig = { ...currentConfig, pairs: [] };
            deleteMessage = "Deleted all matching pairs. Your game is now empty - add new pairs anytime!";
          } else {
            const msg = "I'm not sure what content type this is. Could you specify what to delete?";
            setMessages(prev => [...prev, { role: "assistant", content: msg }]);
            await saveMessage("assistant", msg);
            return;
          }
        } else if (action.data.deleteType === "specific" && action.data.itemIndices) {
          const indices = new Set(action.data.itemIndices as number[]);
          const count = indices.size;
          
          if (currentConfig.type === 'quiz') {
            updatedConfig = {
              ...currentConfig,
              questions: (currentConfig.questions || []).filter((_, i) => !indices.has(i))
            };
            deleteMessage = `Deleted ${count} question${count > 1 ? 's' : ''}.`;
          } else if (currentConfig.type === 'flashcards') {
            updatedConfig = {
              ...currentConfig,
              cards: (currentConfig.cards || []).filter((_, i) => !indices.has(i))
            };
            deleteMessage = `Deleted ${count} flashcard${count > 1 ? 's' : ''}.`;
          } else if (currentConfig.type === 'matching') {
            updatedConfig = {
              ...currentConfig,
              pairs: (currentConfig.pairs || []).filter((_, i) => !indices.has(i))
            };
            deleteMessage = `Deleted ${count} matching pair${count > 1 ? 's' : ''}.`;
          } else {
            const msg = "I'm not sure what content type this is.";
            setMessages(prev => [...prev, { role: "assistant", content: msg }]);
            await saveMessage("assistant", msg);
            return;
          }
        } else {
          const msg = "I need to know what to delete. Say 'delete all' or specify which items.";
          setMessages(prev => [...prev, { role: "assistant", content: msg }]);
          await saveMessage("assistant", msg);
          return;
        }
        
        if (onUpdateConfig) {
          onUpdateConfig(updatedConfig);
        }
        onAppGenerated(updatedConfig);
        
        setMessages(prev => [...prev, { role: "assistant", content: deleteMessage }]);
        await saveMessage("assistant", deleteMessage);
        toast.success(deleteMessage);
        break;
      }
      
      case "modify_content": {
        const modificationType = action.data.modificationType || 'general';
        const updates = action.data.updates || {};
        const itemIndex = action.data.itemIndex;
        
        // Handle specific modification types directly
        if (modificationType === 'edit_item' && typeof itemIndex === 'number' && currentConfig) {
          let updatedConfig = { ...currentConfig };
          let successMsg = '';
          
          if (currentConfig.type === 'quiz' && currentConfig.questions?.[itemIndex]) {
            const updatedQuestions = [...(currentConfig.questions || [])];
            const question = { ...updatedQuestions[itemIndex] };
            
            if (updates.question) question.q = updates.question;
            
            // Handle questionType changes
            if (updates.questionType) {
              question.questionType = updates.questionType as "multiple-choice" | "true-false" | "short-answer" | "fill-blank" | "poll" | "word-cloud" | "open-ended" | "slide";
              
              // Auto-adjust options for true/false questions
              if (updates.questionType === 'true-false') {
                question.options = ['True', 'False'];
                // Adjust answer if current answer isn't valid for true/false
                if (question.answer !== 'True' && question.answer !== 'False') {
                  question.answer = 'True'; // Default to True
                }
              }
            }
            
            if (updates.options) question.options = updates.options;
            if (typeof updates.correctAnswer === 'number') {
              const opts = updates.options || question.options;
              if (opts?.[updates.correctAnswer]) {
                question.answer = opts[updates.correctAnswer];
              }
            }
            if (updates.explanation) question.explanation = updates.explanation;
            if (updates.hint) question.hint = updates.hint;
            
            updatedQuestions[itemIndex] = question;
            updatedConfig.questions = updatedQuestions;
            successMsg = `Updated question ${itemIndex + 1}.`;
          } else if (currentConfig.type === 'flashcards' && currentConfig.cards?.[itemIndex]) {
            const updatedCards = [...(currentConfig.cards || [])];
            const card = { ...updatedCards[itemIndex] };
            
            if (updates.term) card.front = updates.term;
            if (updates.definition) card.back = updates.definition;
            
            updatedCards[itemIndex] = card;
            updatedConfig.cards = updatedCards;
            successMsg = `Updated flashcard ${itemIndex + 1}.`;
          } else if (currentConfig.type === 'matching' && currentConfig.pairs?.[itemIndex]) {
            const updatedPairs = [...(currentConfig.pairs || [])];
            const pair = { ...updatedPairs[itemIndex] };
            
            if (updates.left) pair.prompt = updates.left;
            if (updates.right) pair.answer = updates.right;
            
            updatedPairs[itemIndex] = pair;
            updatedConfig.pairs = updatedPairs;
            successMsg = `Updated matching pair ${itemIndex + 1}.`;
          } else {
            const msg = `I couldn't find item ${itemIndex + 1} to update.`;
            setMessages(prev => [...prev, { role: "assistant", content: msg }]);
            await saveMessage("assistant", msg);
            return;
          }
          
          if (onUpdateConfig) onUpdateConfig(updatedConfig);
          onAppGenerated(updatedConfig);
          setMessages(prev => [...prev, { role: "assistant", content: successMsg }]);
          await saveMessage("assistant", successMsg);
          toast.success(successMsg);
          return;
        }
        
        // Handle setting changes directly
        if (modificationType === 'change_setting' && currentConfig) {
          let updatedConfig = { ...currentConfig };
          const changes: string[] = [];
          
          if (updates.title) { updatedConfig.title = updates.title; changes.push(`title to "${updates.title}"`); }
          if (updates.theme) { updatedConfig.theme = updates.theme; changes.push(`theme to ${updates.theme}`); }
          if (typeof updates.timerSeconds === 'number') { updatedConfig.timerSeconds = updates.timerSeconds; changes.push(`timer to ${updates.timerSeconds}s`); }
          if (typeof updates.shuffleQuestions === 'boolean') { updatedConfig.shuffleQuestions = updates.shuffleQuestions; changes.push(`shuffle ${updates.shuffleQuestions ? 'on' : 'off'}`); }
          
          if (changes.length > 0) {
            if (onUpdateConfig) onUpdateConfig(updatedConfig);
            onAppGenerated(updatedConfig);
            const msg = `Updated: ${changes.join(', ')}.`;
            setMessages(prev => [...prev, { role: "assistant", content: msg }]);
            await saveMessage("assistant", msg);
            toast.success('Settings updated!');
            return;
          }
        }
        
        // Fallback to generate-app for complex modifications
        const modificationText = action.data.modification || JSON.stringify(updates);
        setIsGenerating(true);
        await executeGeneration(modificationText, true);
        break;
      }
      
      case "generate_new_content": {
        // CRITICAL: Use fullPrompt if available to preserve all user details (question types, etc)
        // Fall back to building a prompt from individual parameters if fullPrompt is missing
        let generationPrompt: string;
        
        if (action.data.fullPrompt) {
          // Use the user's complete original message to preserve all details
          generationPrompt = action.data.fullPrompt;
          console.log("Handling action: generate_new_content with fullPrompt:", generationPrompt);
        } else {
          // Fallback: build prompt from parameters (may lose details)
          const parts = [`Create a ${action.data.contentType}`];
          if (action.data.topic) parts.push(`about ${action.data.topic}`);
          if (action.data.questionCount) parts.push(`with ${action.data.questionCount} items`);
          if (action.data.difficulty) parts.push(`at ${action.data.difficulty} difficulty`);
          if (action.data.gradeLevel) parts.push(`for ${action.data.gradeLevel}`);
          generationPrompt = parts.join(' ');
          console.log("Handling action: generate_new_content with constructed prompt:", generationPrompt);
        }
        
        const msg = `Creating your ${action.data.contentType} about ${action.data.topic}...`;
        setMessages(prev => [...prev, { role: "assistant", content: msg }]);
        await saveMessage("assistant", msg);
        
        await executeGeneration(generationPrompt, true);
        break;
      }
      
      case "chat_response": {
        // Display the assistant's reply. Never fall back to a canned greeting —
        // if the model returned nothing usable, say so and let the user retry.
        const rawMsg = typeof action.data.message === "string" ? action.data.message.trim() : "";
        const msg = rawMsg || "Sorry, I didn't catch that. Could you send it again?";
        const options = Array.isArray(action.data.options)
          ? action.data.options
              .filter((o: unknown) => typeof o === "string" && o.trim().length > 0)
              .slice(0, 5)
              .map((o: string) => o.trim())
          : undefined;
        const optionMode: "single" | "multi" =
          action.data.optionMode === "multi" ? "multi" : "single";
        const allowFreeText = action.data.allowFreeText !== false;
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: msg,
            options: options?.length ? options : undefined,
            optionMode: options?.length ? optionMode : undefined,
            allowFreeText: options?.length ? allowFreeText : undefined,
          },
        ]);
        await saveMessage("assistant", msg, undefined, { options, optionMode });

        break;
      }
      
      case "bulk_modify_questions": {
        if (!currentConfig?.questions?.length) {
          const msg = "There are no questions to modify yet. Create a quiz first!";
          setMessages(prev => [...prev, { role: "assistant", content: msg }]);
          await saveMessage("assistant", msg);
          return;
        }

        const { field, value } = action.data;
        const updatedConfig = { ...currentConfig };
        const updatedQuestions = [...currentConfig.questions];

        // Apply the value to all questions
        for (let i = 0; i < updatedQuestions.length; i++) {
          if (field === 'hint') {
            updatedQuestions[i] = { ...updatedQuestions[i], hint: value };
          } else if (field === 'explanation') {
            updatedQuestions[i] = { ...updatedQuestions[i], explanation: value };
          }
        }

        updatedConfig.questions = updatedQuestions;
        if (onUpdateConfig) onUpdateConfig(updatedConfig);
        onAppGenerated(updatedConfig);
        
        const fieldLabel = field === 'hint' ? 'hints' : 'explanations';
        const msg = `Done! Added ${fieldLabel} to all ${updatedQuestions.length} questions.`;
        setMessages(prev => [...prev, { role: "assistant", content: msg }]);
        await saveMessage("assistant", msg);
        toast.success(msg);
        break;
      }
      
      case "bulk_generate_hints": {
        if (!currentConfig?.questions?.length) {
          const msg = "There are no questions to modify yet. Create a quiz first!";
          setMessages(prev => [...prev, { role: "assistant", content: msg }]);
          await saveMessage("assistant", msg);
          return;
        }

        const { field, hints } = action.data;
        const updatedConfig = { ...currentConfig };
        const updatedQuestions = [...currentConfig.questions];

        // Apply each unique hint to its respective question
        let appliedCount = 0;
        for (const hintData of hints || []) {
          const { questionIndex, value } = hintData;
          if (questionIndex >= 0 && questionIndex < updatedQuestions.length) {
            if (field === 'hint') {
              updatedQuestions[questionIndex] = { ...updatedQuestions[questionIndex], hint: value };
            } else if (field === 'explanation') {
              updatedQuestions[questionIndex] = { ...updatedQuestions[questionIndex], explanation: value };
            }
            appliedCount++;
          }
        }

        updatedConfig.questions = updatedQuestions;
        if (onUpdateConfig) onUpdateConfig(updatedConfig);
        onAppGenerated(updatedConfig);
        
        const fieldLabel = field === 'hint' ? 'hints' : 'explanations';
        const msg = `Done! Added unique ${fieldLabel} to ${appliedCount} questions.`;
        setMessages(prev => [...prev, { role: "assistant", content: msg }]);
        await saveMessage("assistant", msg);
        toast.success(msg);
        break;
      }
      
      case "add_multiple_items": {
        const items = action.data.items || [];
        const contentType = action.data.contentType;
        
        if (items.length === 0) {
          const msg = "I didn't generate any items. Could you provide more details?";
          setMessages(prev => [...prev, { role: "assistant", content: msg }]);
          await saveMessage("assistant", msg);
          return;
        }
        
        // If no config exists, create new config directly with the AI-generated items
        if (!currentConfig) {
          const topicHint = items[0]?.question || items[0]?.term || items[0]?.left || "New Content";
          
          let newConfig: AppConfig;
          
          if (contentType === "questions") {
            const questions = items.map((item: any) => ({
              q: item.question,
              questionType: (item.questionType || "multiple-choice") as "multiple-choice" | "true-false" | "short-answer" | "fill-blank" | "poll" | "word-cloud" | "open-ended" | "slide",
              options: item.options || ["Option A", "Option B", "Option C", "Option D"],
              answer: (item.options && item.options[item.correctAnswer ?? 0]) || item.options?.[0] || "Option A",
              hint: item.explanation || "",
              explanation: item.explanation || "",
            }));
            
            newConfig = {
              type: "quiz",
              title: `Quiz: ${topicHint.substring(0, 50)}`,
              questions,
              theme: "indigo",
              difficulty: "medium",
            };
          } else if (contentType === "flashcards") {
            const cards = items.map((item: any) => ({
              front: item.term,
              back: item.definition,
            }));
            
            newConfig = {
              type: "flashcards",
              title: `Flashcards: ${topicHint.substring(0, 50)}`,
              cards,
              theme: "indigo",
            };
          } else {
            const pairs = items.map((item: any) => ({
              prompt: item.left,
              answer: item.right,
            }));
            
            newConfig = {
              type: "matching",
              title: `Matching Game: ${topicHint.substring(0, 50)}`,
              pairs,
              theme: "indigo",
            };
          }
          
          if (onUpdateConfig) {
            onUpdateConfig(newConfig);
          }
          onAppGenerated(newConfig);
          
          const itemType = contentType === "questions" ? "questions" : contentType === "flashcards" ? "flashcards" : "matching pairs";
          const msg = `Created a new ${newConfig.type} with ${items.length} ${itemType}!`;
          setMessages(prev => [...prev, { role: "assistant", content: msg }]);
          await saveMessage("assistant", msg);
          toast.success(msg);
          fetchCredits();
          return;
        }
        
        let updatedConfig: AppConfig = { ...currentConfig };
        let addedCount = 0;
        
        if (contentType === "questions" && currentConfig.type === "quiz") {
          const newQuestions = items.map((item: any) => ({
            q: item.question,
            questionType: (item.questionType || "multiple-choice") as "multiple-choice" | "true-false" | "short-answer" | "fill-blank" | "poll" | "word-cloud" | "open-ended" | "slide",
            options: item.options || ["Option A", "Option B", "Option C", "Option D"],
            answer: (item.options && item.options[item.correctAnswer ?? 0]) || item.options?.[0] || "Option A",
            hint: item.explanation || "",
            explanation: item.explanation || "",
          }));
          updatedConfig.questions = [...(currentConfig.questions || []), ...newQuestions];
          addedCount = newQuestions.length;
        } else if (contentType === "flashcards" && currentConfig.type === "flashcards") {
          const newCards = items.map((item: any) => ({
            front: item.term,
            back: item.definition,
          }));
          updatedConfig.cards = [...(currentConfig.cards || []), ...newCards];
          addedCount = newCards.length;
        } else if (contentType === "pairs" && currentConfig.type === "matching") {
          const newPairs = items.map((item: any) => ({
            prompt: item.left,
            answer: item.right,
          }));
          updatedConfig.pairs = [...(currentConfig.pairs || []), ...newPairs];
          addedCount = newPairs.length;
        } else {
          // Content type mismatch - need to handle conversion
          const msg = `Your current content is a ${currentConfig.type}, but you're adding ${contentType}. Would you like me to create a new ${contentType === "questions" ? "quiz" : contentType === "flashcards" ? "flashcard set" : "matching game"} instead?`;
          setMessages(prev => [...prev, { role: "assistant", content: msg }]);
          await saveMessage("assistant", msg);
          return;
        }
        
        if (onUpdateConfig) {
          onUpdateConfig(updatedConfig);
        }
        onAppGenerated(updatedConfig);
        
        const totalItems = updatedConfig.questions?.length || updatedConfig.cards?.length || updatedConfig.pairs?.length || 0;
        const itemType = contentType === "questions" ? "questions" : contentType === "flashcards" ? "flashcards" : "matching pairs";
        const msg = `Added ${addedCount} ${itemType}! Your ${currentConfig.type} now has ${totalItems} items total.`;
        setMessages(prev => [...prev, { role: "assistant", content: msg }]);
        await saveMessage("assistant", msg);
        toast.success(`Added ${addedCount} ${itemType}!`);
        fetchCredits();
        break;
      }
      
      case "analyze_content": {
        const { analysisType, findings, suggestions } = action.data;
        
        let msg = `**📊 Analysis Results (${analysisType})**\n\n${findings}`;
        
        if (suggestions && suggestions.length > 0) {
          msg += `\n\n**💡 Suggestions:**\n${suggestions.map((s: string) => `• ${s}`).join('\n')}`;
        }
        
        setMessages(prev => [...prev, { role: "assistant", content: msg }]);
        await saveMessage("assistant", msg);
        break;
      }
      
      default:
        console.warn("Unhandled action type:", action.action, action.data);
        const fallbackMsg = `I tried to perform "${action.action}" but encountered an issue. Let me try a different approach - could you rephrase what you'd like me to do?`;
        setMessages(prev => [...prev, { role: "assistant", content: fallbackMsg }]);
        await saveMessage("assistant", fallbackMsg);
    }
  };

  // Send message and handle action-based response from AI
  const streamConversation = async (userMessage: string) => {
    const attachmentSnapshot = buildAttachmentSnapshot();
    const updatedMessages: Message[] = [...messages, { role: "user", content: userMessage, createdAt: Date.now(), attachment: attachmentSnapshot }];
    // Lock any open clarifying card with the answer the user just gave
    setMessages(
      updatedMessages.map((m) =>
        m.options && !m.answeredWith ? { ...m, answeredWith: userMessage } : m
      )
    );

    setIsLoading(true);
    
    // Save user message — its id doubles as the one-time credit charge token
    const userMessageId = await saveMessage("user", userMessage, attachmentSnapshot);
    prepaidMessageIdRef.current = userMessageId;
    
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("No session");
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
            currentConfig,
            documentContent: documentContext?.text || undefined,
            urlContent: urlContext?.text || undefined,
            userMessageId: userMessageId || undefined,
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }
      
      // Response is always JSON with action-based structure
      const actionResponse: ChatAction = await response.json();
      
      // Handle the action
      await handleAction(actionResponse);
      
      // Always refresh credits after successful chat-assistant call (1 credit per message)
      fetchCredits();
      
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMessage = error.message || "Sorry, I had trouble responding. Please try again.";
      
      // Add error message as assistant response
      setMessages(prev => [...prev, { role: "assistant", content: errorMessage, isStreaming: false }]);
      
      await saveMessage("assistant", errorMessage);
      toast.error(errorMessage);
      // Give the user their message back so nothing is lost
      setInput((prev) => (prev.trim() ? prev : userMessage));
    } finally {
      setIsLoading(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  };

  // SIMPLIFIED: Always route through chat-assistant first
  // The server decides when to trigger generation based on conversation context
  const shouldRouteToConversation = (): boolean => {
    // Always route through chat-assistant for proper conversational flow
    // The chat-assistant will handle the conversation and signal when ready to generate
    return true;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const promptText = input.trim();
    setInput("");
    
    // SIMPLIFIED ROUTING:
    // Always route through chat-assistant for proper conversational flow
    // The chat-assistant will handle the conversation and signal when ready to generate
    if (shouldRouteToConversation()) {
      // Route through chat-assistant for conversation + smart detection
      await streamConversation(promptText);
    } else {
      // Fallback - should not be reached since we always return true
      if (credits !== null && credits <= 0) {
        toast.error("Insufficient credits. Please upgrade to continue.");
        return;
      }
      await processGeneration(promptText);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  // Clicking a clarifying-question chip answers it immediately
  const handleQuickReply = async (option: string) => {
    if (isLoading) return;
    setInput("");
    await streamConversation(option);
  };

  // Detect slash commands as user types
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setInput(value);
    
    // Find the last slash before cursor
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
    
    if (lastSlashIndex !== -1) {
      const textAfterSlash = textBeforeCursor.substring(lastSlashIndex);
      const commandMatch = textAfterSlash.match(/^\/(quiz|theme)\s*$/i);
      
      if (commandMatch) {
        const detectedCommand = commandMatch[1].toLowerCase() as 'quiz' | 'theme';
        setCommandType(`/${detectedCommand}` as '/quiz' | '/theme');
        setCommandStartPos(lastSlashIndex);
        setShowCommandAutocomplete(true);
      } else {
        setShowCommandAutocomplete(false);
        setCommandType(null);
      }
    } else {
      setShowCommandAutocomplete(false);
      setCommandType(null);
    }
  };

  // Handle command selection
  const handleCommandSelect = (value: string) => {
    if (!textareaRef.current) return;
    
    const beforeCommand = input.substring(0, commandStartPos);
    const afterCommand = input.substring(textareaRef.current.selectionStart);
    
    // Replace /quiz or /theme with the selected value
    const newInput = beforeCommand + value + ' ' + afterCommand;
    
    setInput(newInput);
    setShowCommandAutocomplete(false);
    setCommandType(null);
    
    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = beforeCommand.length + value.length + 1;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleConfirmDestructive = () => {
    setConfirmDialogOpen(false);
    executeGeneration(pendingPrompt);
    setPendingPrompt("");
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    
    // PDF files: show page selector
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      setPdfFile(file);
      setShowPageSelector(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Non-PDF files: parse directly as before
    setIsParsingFile(true);
    
    try {
      const result = await parseDocument(file);
      
      if (result.success) {
        setDocumentContext({
          fileName: result.fileName,
          text: result.text,
          characterCount: result.characterCount,
          wasTruncated: result.wasTruncated,
        });
        
        if (result.wasTruncated) {
          toast.warning("Document was truncated to 20,000 characters");
        } else {
          toast.success(`Document loaded: ${result.fileName}`);
        }
      } else {
        toast.error(result.error || "Failed to parse document");
      }
    } catch (error) {
      console.error("File parsing error:", error);
      toast.error("Failed to process document");
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle PDF page selection confirm
  const handlePdfPagesConfirm = async (selectedPages: number[]) => {
    if (!pdfFile) return;
    setShowPageSelector(false);
    setIsParsingFile(true);
    
    try {
      const text = await extractTextFromSelectedPages(pdfFile, selectedPages);
      
      if (!text || text.trim().length === 0) {
        toast.error("No text content found in selected pages");
        return;
      }
      
      const MAX_TEXT_LENGTH = 20000;
      const wasTruncated = text.length > MAX_TEXT_LENGTH;
      const finalText = wasTruncated
        ? text.substring(0, MAX_TEXT_LENGTH) + '...[truncated]'
        : text;
      
      setDocumentContext({
        fileName: pdfFile.name,
        text: finalText,
        characterCount: finalText.length,
        wasTruncated,
      });
      
      if (wasTruncated) {
        toast.warning("Document was truncated to 20,000 characters");
      } else {
        toast.success(`Loaded ${selectedPages.length} pages from ${pdfFile.name}`);
      }
    } catch (error) {
      console.error("PDF parsing error:", error);
      toast.error("Failed to extract text from selected pages");
    } finally {
      setIsParsingFile(false);
      setPdfFile(null);
    }
  };

  const handlePdfPagesCancel = () => {
    setShowPageSelector(false);
    setPdfFile(null);
  };

  // Handle document removal
  const handleRemoveDocument = () => {
    setDocumentContext(null);
    toast.success("Document removed");
  };

  // Handle upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle URL import
  const handleUrlFetch = async () => {
    if (!urlInput.trim()) return;
    
    setIsLoadingUrl(true);
    
    try {
      const result = await fetchUrlContent(urlInput.trim());
      
      if (result.success) {
        setUrlContext({
          url: result.url,
          hostname: result.hostname || '',
          title: result.title,
          text: result.text,
          characterCount: result.characterCount,
          wasTruncated: result.wasTruncated,
        });
        
        setUrlDialogOpen(false);
        setUrlInput("");
        
        if (result.wasTruncated) {
          toast.warning("Content was truncated to 20,000 characters");
        } else {
          toast.success(`Content loaded from ${result.hostname}`);
        }
      } else {
        toast.error(result.error || "Failed to fetch URL content");
      }
    } catch (error) {
      console.error("URL fetch error:", error);
      toast.error("Failed to fetch URL content");
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Handle URL removal
  const handleRemoveUrl = () => {
    setUrlContext(null);
    toast.success("URL content removed");
  };

  return (
    <>
      <div className="grid grid-rows-[auto_1fr_auto] h-full bg-card overflow-hidden">
        <div className="flex flex-col gap-2 px-6 py-4 border-b bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">AI Assistant</h3>
                {credits !== null && (
                  <p className="text-xs text-muted-foreground">
                    {credits} credits remaining
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {(canUndo || canRedo) && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onUndo}
                    disabled={!canUndo}
                    title="Undo"
                  >
                    <Undo2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRedo}
                    disabled={!canRedo}
                    title="Redo"
                  >
                    <Redo2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {onTogglePanel && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onTogglePanel}
                  title="Hide AI Assistant"
                  className="hidden lg:flex"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Source chip is now rendered inside the input container below */}
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4 min-h-0">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-md ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {message.attachment && (
                  <div className="mb-2">
                    <AttachmentChip attachment={message.attachment} interactive />
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-strong:font-bold prose-strong:text-inherit text-inherit [&_*]:text-inherit">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
              {message.role === "assistant" &&
                message.options &&
                message.options.length > 0 && (
                  <ClarifyCard
                    options={message.options}
                    mode={message.optionMode ?? "single"}
                    allowFreeText={message.allowFreeText !== false}
                    answeredWith={
                      message.answeredWith ??
                      (index < messages.length - 1 && messages[index + 1]?.role === "user"
                        ? messages[index + 1].content
                        : undefined)
                    }
                    disabled={isLoading}
                    onAnswer={handleQuickReply}
                  />
                )}

              {message.createdAt && (
                <MessageMeta ts={message.createdAt} align={message.role === "user" ? "right" : "left"} />
              )}
            </div>
          ))}
          {/* Lovable-style thinking indicator */}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start animate-fade-in pl-1">
              <ThinkingIndicator mode={isGenerating ? "generating" : "chat"} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t bg-card px-6 py-4 space-y-2">
          <SmartSuggestions 
            currentConfig={currentConfig}
            onSuggestionClick={handleSuggestionClick}
            documentContext={documentContext}
            urlContext={urlContext}
          />
          
          <div className="flex gap-2 relative">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {/* Attachment dropdown button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={isLoading || isParsingFile || isLoadingUrl}
                  className="h-11 w-11"
                >
                  {(isParsingFile || isLoadingUrl) ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Paperclip className="w-5 h-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={handleUploadClick}>
                  <FileText className="w-4 h-4 mr-2" />
                  <div className="flex-1">
                    <span>Upload Document</span>
                    <p className="text-xs text-muted-foreground">PDF, DOCX, TXT</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setUrlDialogOpen(true)}>
                  <Link className="w-4 h-4 mr-2" />
                  <div className="flex-1">
                    <span>Import from URL</span>
                    <p className="text-xs text-muted-foreground">Webpage content</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="relative flex-1">
              <CommandAutocomplete
                open={showCommandAutocomplete}
                commandType={commandType}
                onSelect={handleCommandSelect}
              />
              <div
                className={`flex flex-col rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0 ${
                  (documentContext || urlContext) ? "pt-2" : ""
                }`}
              >
                {(documentContext || urlContext) && (
                  <div className="px-2 pb-1.5">
                    <AttachmentChip
                      attachment={
                        documentContext
                          ? {
                              kind: "document",
                              label: documentContext.fileName,
                              sublabel: documentContext.wasTruncated ? "trimmed" : undefined,
                            }
                          : {
                              kind: "url",
                              label: urlContext!.title || urlContext!.hostname,
                              sublabel:
                                urlContext!.hostname && urlContext!.title
                                  ? urlContext!.hostname
                                  : undefined,
                              href: urlContext!.url,
                            }
                      }
                      onRemove={documentContext ? handleRemoveDocument : handleRemoveUrl}
                    />
                  </div>
                )}
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                    if (e.key === "Escape" && showCommandAutocomplete) {
                      e.preventDefault();
                      setShowCommandAutocomplete(false);
                      setCommandType(null);
                    }
                  }}
                  placeholder="Describe what you want to create... (try /quiz or /theme)"
                  className="min-h-[44px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-11 w-11"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* URL Input Dialog */}
      <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              Import from URL
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter a webpage URL to extract content and generate questions from it.
            </p>
            <Input
              placeholder="https://example.com/article"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleUrlFetch();
                }
              }}
              disabled={isLoadingUrl}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUrlDialogOpen(false)} disabled={isLoadingUrl}>
              Cancel
            </Button>
            <Button onClick={handleUrlFetch} disabled={isLoadingUrl || !urlInput.trim()}>
              {isLoadingUrl ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                "Fetch Content"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Page Selector */}
      {pdfFile && (
        <PdfPageSelector
          file={pdfFile}
          open={showPageSelector}
          onConfirm={handlePdfPagesConfirm}
          onCancel={handlePdfPagesCancel}
        />
      )}

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Confirm Major Changes"
        description="This will significantly change or replace your current app. Are you sure you want to continue?"
        onConfirm={handleConfirmDestructive}
      />
    </>
  );
};

export default ChatInterface;
