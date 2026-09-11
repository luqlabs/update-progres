import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ArrowLeft, Plus, Edit, Trash2, Star, GripVertical } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface PricingFeature {
  id: string;
  plan_id: string;
  feature_text: string;
  display_order: number;
  is_highlighted: boolean;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
}

const PlanPricingFeaturesPage = () => {
  const { planId } = useParams<{ planId: string }>();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [features, setFeatures] = useState<PricingFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<PricingFeature | null>(null);
  const [formData, setFormData] = useState({
    feature_text: "",
    is_highlighted: false,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchPlanAndFeatures();
  }, [planId]);

  useEffect(() => {
    if (editingFeature) {
      setFormData({
        feature_text: editingFeature.feature_text,
        is_highlighted: editingFeature.is_highlighted,
      });
    } else {
      setFormData({
        feature_text: "",
        is_highlighted: false,
      });
    }
  }, [editingFeature]);

  const fetchPlanAndFeatures = async () => {
    try {
      const { data: planData, error: planError } = await supabase
        .from("subscription_plans")
        .select("id, name, description")
        .eq("id", planId)
        .single();

      if (planError) throw planError;
      setPlan(planData);

      const { data: featuresData, error: featuresError } = await supabase
        .from("plan_pricing_features")
        .select("*")
        .eq("plan_id", planId)
        .order("display_order");

      if (featuresError) throw featuresError;
      setFeatures(featuresData || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (featureId: string) => {
    if (!confirm("Are you sure you want to delete this pricing feature?")) return;

    try {
      const { error } = await supabase
        .from("plan_pricing_features")
        .delete()
        .eq("id", featureId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pricing feature deleted successfully",
      });
      fetchPlanAndFeatures();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (feature: PricingFeature) => {
    setEditingFeature(feature);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingFeature(null);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.feature_text.trim()) {
        toast({
          title: "Error",
          description: "Feature text is required",
          variant: "destructive",
        });
        return;
      }

      if (editingFeature) {
        const { error } = await supabase
          .from("plan_pricing_features")
          .update({
            feature_text: formData.feature_text,
            is_highlighted: formData.is_highlighted,
          })
          .eq("id", editingFeature.id);

        if (error) throw error;
      } else {
        const maxOrder = features.length > 0 ? Math.max(...features.map(f => f.display_order)) : -1;
        const { error } = await supabase
          .from("plan_pricing_features")
          .insert({
            plan_id: planId,
            feature_text: formData.feature_text,
            is_highlighted: formData.is_highlighted,
            display_order: maxOrder + 1,
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Pricing feature ${editingFeature ? "updated" : "created"} successfully`,
      });
      
      setDialogOpen(false);
      fetchPlanAndFeatures();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const moveFeature = async (featureId: string, direction: "up" | "down") => {
    const currentIndex = features.findIndex(f => f.id === featureId);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === features.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const newFeatures = [...features];
    [newFeatures[currentIndex], newFeatures[newIndex]] = [newFeatures[newIndex], newFeatures[currentIndex]];

    try {
      const updates = newFeatures.map((feature, index) => ({
        id: feature.id,
        display_order: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("plan_pricing_features")
          .update({ display_order: update.display_order })
          .eq("id", update.id);

        if (error) throw error;
      }

      setFeatures(newFeatures);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AdminRoute>
        <AdminLayout>
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </AdminLayout>
      </AdminRoute>
    );
  }

  if (!plan) {
    return (
      <AdminRoute>
        <AdminLayout>
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Plan not found</p>
          </div>
        </AdminLayout>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/plans")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h2 className="text-3xl font-bold tracking-tight">{plan.name}</h2>
              <p className="text-muted-foreground">Manage pricing page features</p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Feature
            </Button>
          </div>

          {features.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No pricing features yet</p>
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Feature
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {features.map((feature, index) => (
                <Card key={feature.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveFeature(feature.id, "up")}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                        >
                          <GripVertical className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveFeature(feature.id, "down")}
                          disabled={index === features.length - 1}
                          className="h-6 w-6 p-0"
                        >
                          <GripVertical className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {feature.is_highlighted && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                      
                      <p className="flex-1 text-sm">{feature.feature_text}</p>
                      
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(feature)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(feature.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFeature ? "Edit" : "Add"} Pricing Feature</DialogTitle>
              <DialogDescription>
                Add marketing-friendly text that will appear on the pricing page
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feature_text">Feature Text</Label>
                <Input
                  id="feature_text"
                  placeholder="e.g., Create up to 10 interactive quizzes"
                  value={formData.feature_text}
                  onChange={(e) =>
                    setFormData({ ...formData, feature_text: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_highlighted"
                  checked={formData.is_highlighted}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_highlighted: checked })
                  }
                />
                <Label htmlFor="is_highlighted">Highlight this feature (show star icon)</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingFeature ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </AdminRoute>
  );
};

export default PlanPricingFeaturesPage;
