import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Promotion {
  id: string;
  title: string;
  description: string;
  code: string | null;
  discount: string | null;
  expiry_date: string | null;
  theme_color: string;
}

interface DiscountBannerProps {
  location?: "pricing" | "upgrade";
  className?: string;
}

const getThemeColors = (color: string) => {
  switch (color) {
    case "green":
      return { primary: "hsl(142, 71%, 45%)", light: "hsl(142, 71%, 95%)" };
    case "blue":
      return { primary: "hsl(217, 91%, 60%)", light: "hsl(217, 91%, 95%)" };
    case "purple":
      return { primary: "hsl(271, 91%, 65%)", light: "hsl(271, 91%, 95%)" };
    case "red":
      return { primary: "hsl(0, 84%, 60%)", light: "hsl(0, 84%, 95%)" };
    case "pink":
      return { primary: "hsl(330, 81%, 60%)", light: "hsl(330, 81%, 95%)" };
    default: // amber
      return { primary: "hsl(38, 92%, 50%)", light: "hsl(38, 92%, 95%)" };
  }
};

export function DiscountBanner({ location = "pricing", className = "" }: DiscountBannerProps) {
  const [copied, setCopied] = useState(false);
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPromotion();
  }, [location]);

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

  const copyCode = async () => {
    if (!promotion?.code) return;
    try {
      await navigator.clipboard.writeText(promotion.code);
      setCopied(true);
      toast({
        title: "Code copied!",
        description: `${promotion.code} has been copied to your clipboard.`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the code manually.",
        variant: "destructive",
      });
    }
  };

  if (loading || !promotion) {
    return null;
  }

  const colors = getThemeColors(promotion.theme_color);

  return (
    <div 
      className={`relative overflow-hidden rounded-md border shadow-none max-w-2xl mx-auto ${className}`}
      style={{ 
        background: `linear-gradient(to right, ${colors.light}, hsl(var(--background)), ${colors.light})`,
        borderColor: `${colors.primary}33`
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.02),transparent_50%)]" />
      <div className="relative px-4 py-2 flex flex-col sm:flex-row items-center justify-center gap-2">
        <div className="flex items-center gap-4">
          <div className="text-center sm:text-left">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              {promotion.discount ? `Get ${promotion.discount} off with code` : promotion.title}
            </div>
            {promotion.code && (
              <div 
                className="font-bold text-xl tracking-wide"
                style={{ color: colors.primary }}
              >
                {promotion.code}
              </div>
            )}
          </div>
          
          {promotion.code && (
            <Button
              onClick={copyCode}
              variant="default"
              size="sm"
              className="gap-2 font-semibold shadow-md hover:border-foreground/30 transition-all"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Code
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
