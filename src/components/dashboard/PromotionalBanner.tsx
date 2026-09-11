import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Promotion {
  id: string;
  title: string;
  description: string;
  code: string | null;
  discount: string | null;
  expiry_date: string | null;
  theme_color: string;
  display_locations: string[];
}

interface PromotionalBannerProps {
  location: "dashboard_banner" | "sidebar" | "pricing" | "upgrade";
  onUpgrade?: () => void;
}

const getThemeColors = (color: string) => {
  switch (color) {
    case "green":
      return {
        bg: "from-green-50 via-emerald-50 to-green-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-green-950/30",
        border: "border-green-200 dark:border-green-800",
        icon: "text-green-600 dark:text-green-400",
        text: "text-green-900 dark:text-green-100",
        textMuted: "text-green-700 dark:text-green-300",
        code: "bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-100",
        button: "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600",
        ghost: "text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100",
      };
    case "blue":
      return {
        bg: "from-blue-50 via-sky-50 to-blue-50 dark:from-blue-950/30 dark:via-sky-950/30 dark:to-blue-950/30",
        border: "border-blue-200 dark:border-blue-800",
        icon: "text-blue-600 dark:text-blue-400",
        text: "text-blue-900 dark:text-blue-100",
        textMuted: "text-blue-700 dark:text-blue-300",
        code: "bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100",
        button: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
        ghost: "text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100",
      };
    case "purple":
      return {
        bg: "from-purple-50 via-violet-50 to-purple-50 dark:from-purple-950/30 dark:via-violet-950/30 dark:to-purple-950/30",
        border: "border-purple-200 dark:border-purple-800",
        icon: "text-purple-600 dark:text-purple-400",
        text: "text-purple-900 dark:text-purple-100",
        textMuted: "text-purple-700 dark:text-purple-300",
        code: "bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100",
        button: "bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600",
        ghost: "text-purple-700 hover:text-purple-900 dark:text-purple-300 dark:hover:text-purple-100",
      };
    case "red":
      return {
        bg: "from-red-50 via-rose-50 to-red-50 dark:from-red-950/30 dark:via-rose-950/30 dark:to-red-950/30",
        border: "border-red-200 dark:border-red-800",
        icon: "text-red-600 dark:text-red-400",
        text: "text-red-900 dark:text-red-100",
        textMuted: "text-red-700 dark:text-red-300",
        code: "bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100",
        button: "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
        ghost: "text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-red-100",
      };
    case "pink":
      return {
        bg: "from-pink-50 via-rose-50 to-pink-50 dark:from-pink-950/30 dark:via-rose-950/30 dark:to-pink-950/30",
        border: "border-pink-200 dark:border-pink-800",
        icon: "text-pink-600 dark:text-pink-400",
        text: "text-pink-900 dark:text-pink-100",
        textMuted: "text-pink-700 dark:text-pink-300",
        code: "bg-pink-200 dark:bg-pink-900 text-pink-900 dark:text-pink-100",
        button: "bg-pink-600 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600",
        ghost: "text-pink-700 hover:text-pink-900 dark:text-pink-300 dark:hover:text-pink-100",
      };
    default: // amber
      return {
        bg: "from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-amber-950/30",
        border: "border-amber-200 dark:border-amber-800",
        icon: "text-amber-600 dark:text-amber-400",
        text: "text-amber-900 dark:text-amber-100",
        textMuted: "text-amber-700 dark:text-amber-300",
        code: "bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100",
        button: "bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600",
        ghost: "text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100",
      };
  }
};

export const PromotionalBanner = ({ location, onUpgrade }: PromotionalBannerProps) => {
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotion();
  }, [location]);

  useEffect(() => {
    if (promotion) {
      const dismissed = localStorage.getItem(`promo-dismissed-${promotion.id}`);
      if (dismissed === "true") {
        setIsDismissed(true);
      }
    }
  }, [promotion]);

  const fetchPromotion = async () => {
    try {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .contains("display_locations", [location])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      // Check if expired
      if (data && data.expiry_date && new Date(data.expiry_date) < new Date()) {
        setPromotion(null);
      } else {
        setPromotion(data);
      }
    } catch (error) {
      console.error("Error fetching promotion:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    if (promotion) {
      localStorage.setItem(`promo-dismissed-${promotion.id}`, "true");
      setIsDismissed(true);
    }
  };

  const copyCode = async () => {
    if (!promotion?.code) return;
    try {
      await navigator.clipboard.writeText(promotion.code);
      toast.success("Code copied to clipboard!");
    } catch {
      toast.error("Failed to copy code");
    }
  };

  if (loading || !promotion || isDismissed) return null;

  const colors = getThemeColors(promotion.theme_color);

  return (
    <div className={`bg-gradient-to-r ${colors.bg} border-b ${colors.border}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Sparkles className={`w-5 h-5 ${colors.icon} flex-shrink-0`} />
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm font-medium ${colors.text}`}>
                {promotion.title}: <span className="font-bold">{promotion.discount}</span> {promotion.description}
              </span>
              {promotion.code && (
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${colors.textMuted}`}>Code:</span>
                  <code className={`px-2 py-0.5 ${colors.code} rounded text-xs font-mono font-semibold`}>
                    {promotion.code}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyCode}
                    className={`h-6 px-2 ${colors.ghost}`}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onUpgrade && (
              <Button
                onClick={onUpgrade}
                size="sm"
                className={colors.button}
              >
                Upgrade Now
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className={`h-8 w-8 p-0 ${colors.ghost}`}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
