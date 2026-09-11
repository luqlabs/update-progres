import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface BlackFridayBannerProps {
  onUpgrade: () => void;
}

export const BlackFridayBanner = ({ onUpgrade }: BlackFridayBannerProps) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const code = "BLACKFRIDAY";

  useEffect(() => {
    const dismissed = localStorage.getItem("bf-banner-dismissed-2024");
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("bf-banner-dismissed-2024", "true");
    setIsDismissed(true);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  if (isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-amber-950/30 border-b border-amber-200 dark:border-amber-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Black Friday Deal: <span className="font-bold">20% off</span> lifetime access!
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-700 dark:text-amber-300">Code:</span>
                <code className="px-2 py-0.5 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 rounded text-xs font-mono font-semibold">
                  {code}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyCode}
                  className="h-6 px-2 text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={onUpgrade}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
            >
              Upgrade Now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0 text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
