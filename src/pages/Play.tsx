import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import QuizPreview from "@/components/builder/previews/QuizPreview";
import FlashcardsPreview from "@/components/builder/previews/FlashcardsPreview";
import MatchingGamePreview from "@/components/builder/previews/MatchingGamePreview";
import { AppConfig } from "@/pages/Builder";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, User, Lock, Eye } from "lucide-react";

const Play = () => {
  const { shareCode } = useParams();
  const [searchParams] = useSearchParams();
  const isPreviewMode = searchParams.get("preview") === "true";
  
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState(isPreviewMode ? "Preview Mode" : "");
  const [nameSubmitted, setNameSubmitted] = useState(isPreviewMode);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showBranding, setShowBranding] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [acceptingResponses, setAcceptingResponses] = useState(true);

  useEffect(() => {
    const fetchApp = async () => {
      if (!shareCode) {
        setError("No share code provided");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke("validate-play-session", {
          body: { share_code: shareCode },
        });

        if (fnError) throw fnError;

        if (data?.error) {
          setError(data.error);
        } else {
          setAppConfig(data.config as unknown as AppConfig);
          setAppId(data.app_id);
          setAcceptingResponses(data.accepting_responses !== false);
          setShowBranding(data.show_branding !== false);
        }
      } catch (error: any) {
        console.error("Error fetching app:", error);
        setError(error.message || "Failed to load activity");
      } finally {
        setLoading(false);
      }
    };

    fetchApp();
  }, [shareCode]);

  const handleStartSession = async () => {
    const trimmedName = studentName.trim();
    
    if (!trimmedName || !appId || !appConfig) return;
    
    if (trimmedName.length > 50) {
      setError("Name must be 50 characters or less");
      return;
    }
    
    const namePattern = /^[a-zA-Z0-9\s\-']+$/;
    if (!namePattern.test(trimmedName)) {
      setError("Name can only contain letters, numbers, spaces, hyphens, and apostrophes");
      return;
    }

    setIsStarting(true);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke("validate-play-session", {
        body: { share_code: shareCode, student_name: trimmedName },
      });

      if (fnError) throw fnError;

      if (data?.error) {
        setError(data.error);
        return;
      }

      setSessionId(data.session_id);
      setNameSubmitted(true);
    } catch (error: any) {
      console.error("Error starting session:", error);
      setError(error.message || "Failed to start session");
    } finally {
      setIsStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-lg">Loading your activity...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !appConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Oops!</h2>
          <p className="text-muted-foreground">
            {error || "This activity could not be found."}
          </p>
        </Card>
      </div>
    );
  }

  if (!nameSubmitted) {
    if (!acceptingResponses) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{appConfig.title}</h2>
            <p className="text-muted-foreground">
              This quiz is no longer accepting responses.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Contact your teacher if you believe this is an error.
            </p>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{appConfig.title}</h2>
            <p className="text-muted-foreground">
              Let's get started! What's your name?
            </p>
          </div>

          <div className="space-y-4">
            <Input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleStartSession();
                }
              }}
              placeholder="Enter your name"
              className="text-center text-lg"
            />
            <Button
              onClick={handleStartSession}
              disabled={!studentName.trim() || isStarting}
              className="w-full"
              size="lg"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Getting Ready...
                </>
              ) : (
                "Start"
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {isPreviewMode && (
        <div className="bg-primary/10 border-b border-primary/20 py-2 px-4 flex items-center justify-center gap-2 text-sm text-primary">
          <Eye className="w-4 h-4" />
          <span className="font-medium">Preview Mode</span>
          <span className="text-muted-foreground">– No data is being saved</span>
        </div>
      )}
      
      <div className="flex-1 overflow-auto">
        {appConfig.type === "quiz" && (
          <QuizPreview 
            config={appConfig} 
            sessionId={isPreviewMode ? null : sessionId} 
            studentName={studentName}
            appId={appId}
          />
        )}
        {appConfig.type === "flashcards" && (
          <FlashcardsPreview 
            config={appConfig} 
            sessionId={isPreviewMode ? null : sessionId}
            studentName={studentName}
          />
        )}
        {appConfig.type === "matching" && (
          <MatchingGamePreview 
            config={appConfig} 
            sessionId={isPreviewMode ? null : sessionId}
            studentName={studentName}
          />
        )}
      </div>
      
      {showBranding && (
        <div className="bg-muted/50 border-t py-2 text-center text-sm text-muted-foreground">
          Powered by <span className="font-semibold">Quizabl</span>
        </div>
      )}
    </div>
  );
};

export default Play;
