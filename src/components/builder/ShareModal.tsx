import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import QRCode from "qrcode";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: string | null;
}

const ShareModal = ({ open, onOpenChange, appId }: ShareModalProps) => {
  const [shareUrl, setShareUrl] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [acceptingResponses, setAcceptingResponses] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchAppData = async () => {
      if (!appId) return;

      try {
        const { data, error } = await supabase
          .from("apps")
          .select("share_code, accepting_responses")
          .eq("id", appId)
          .single();

        if (error) throw error;

        const url = `${window.location.origin}/play/${data.share_code}`;
        setShareUrl(url);
        setAcceptingResponses(data.accepting_responses !== false);

        const qr = await QRCode.toDataURL(url, {
          width: 300,
          margin: 2,
        });
        setQrCodeUrl(qr);
      } catch (error) {
        console.error("Error fetching app data:", error);
      }
    };

    if (open && appId) {
      fetchAppData();
    }
  }, [open, appId]);

  const handleToggleResponses = async (checked: boolean) => {
    if (!appId) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("apps")
        .update({ accepting_responses: checked })
        .eq("id", appId);

      if (error) throw error;
      
      setAcceptingResponses(checked);
      toast.success(checked ? "Quiz is now accepting responses" : "Quiz is now closed");
    } catch (error) {
      console.error("Error updating accepting_responses:", error);
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Share with Students</DialogTitle>
            <Badge variant={acceptingResponses ? "default" : "destructive"}>
              {acceptingResponses ? "Live" : "Closed"}
            </Badge>
          </div>
          <DialogDescription>
            Students can access your activity using this link or QR code
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share Link */}
          <div className="space-y-2">
            <Label>Share Link</Label>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly />
              <Button size="icon" variant="outline" onClick={handleCopy}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* QR Code */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              QR Code
            </Label>
            {qrCodeUrl && (
              <div className="flex justify-center">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="border-4 border-border rounded-lg"
                />
              </div>
            )}
            <p className="text-xs text-center text-muted-foreground">
              Students can scan this code with their phones
            </p>
          </div>

          {/* Accepting Responses Toggle */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Accepting Responses</Label>
                <p className="text-xs text-muted-foreground">
                  When off, students will see a "quiz closed" message
                </p>
              </div>
              <Switch
                checked={acceptingResponses}
                onCheckedChange={handleToggleResponses}
                disabled={isUpdating}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
