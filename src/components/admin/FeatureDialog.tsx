import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { FEATURE_DEFINITIONS, getFeatureDefinition } from "@/lib/features";

interface Feature {
  id: string;
  feature_key: string;
  feature_value: string;
  feature_type: string;
  display_name: string;
}

interface FeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: Feature | null;
  planId: string;
  onSuccess: () => void;
}

export const FeatureDialog = ({ open, onOpenChange, feature, planId, onSuccess }: FeatureDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    feature_key: '',
    feature_value: '',
    feature_type: 'number' as 'number' | 'boolean' | 'text',
    display_name: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (feature) {
      setFormData({
        feature_key: feature.feature_key,
        feature_value: feature.feature_value,
        feature_type: feature.feature_type as 'number' | 'boolean' | 'text',
        display_name: feature.display_name,
      });
    } else {
      setFormData({
        feature_key: '',
        feature_value: '',
        feature_type: 'number',
        display_name: '',
      });
    }
  }, [feature]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (feature) {
        const { error } = await supabase
          .from('plan_features')
          .update(formData)
          .eq('id', feature.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Feature updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('plan_features')
          .insert({
            ...formData,
            plan_id: planId,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Feature created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{feature ? 'Edit Feature' : 'Add New Feature'}</DialogTitle>
            <DialogDescription>
              Configure feature limits and settings for this plan
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="e.g., Maximum Apps"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feature_key">Feature Key</Label>
              <Select
                value={formData.feature_key}
                onValueChange={(value) => {
                  const definition = getFeatureDefinition(value);
                  if (definition) {
                    setFormData({
                      ...formData,
                      feature_key: value,
                      display_name: definition.displayName,
                      feature_type: definition.type,
                      feature_value: definition.defaultValue,
                    });
                  } else {
                    setFormData({ ...formData, feature_key: value });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a feature" />
                </SelectTrigger>
                <SelectContent>
                  {FEATURE_DEFINITIONS.map((feature) => (
                    <SelectItem key={feature.key} value={feature.key}>
                      <div className="flex flex-col">
                        <span>{feature.displayName}</span>
                        <span className="text-xs text-muted-foreground">
                          {feature.description}
                          {feature.enforced ? ' ✓' : ' (not enforced)'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.feature_key && getFeatureDefinition(formData.feature_key)?.description}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feature_type">Feature Type</Label>
              <Select
                value={formData.feature_type}
                onValueChange={(value: 'number' | 'boolean' | 'text') =>
                  setFormData({ ...formData, feature_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feature_value">Feature Value</Label>
              {formData.feature_type === 'boolean' ? (
                <Select
                  value={formData.feature_value}
                  onValueChange={(value) => setFormData({ ...formData, feature_value: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">True</SelectItem>
                    <SelectItem value="false">False</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="feature_value"
                  value={formData.feature_value}
                  onChange={(e) => setFormData({ ...formData, feature_value: e.target.value })}
                  placeholder={formData.feature_type === 'number' ? 'e.g., 10 or unlimited' : 'Enter value'}
                  required
                />
              )}
              {formData.feature_type === 'number' && (
                <p className="text-xs text-muted-foreground">
                  Use "unlimited" for unlimited access
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {feature ? 'Update Feature' : 'Create Feature'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
