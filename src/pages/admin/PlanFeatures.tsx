import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Plus, Edit, Trash2, ArrowLeft, Hash, Type, ToggleLeft, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FeatureDialog } from "@/components/admin/FeatureDialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FEATURE_DEFINITIONS, getFeatureDefinition } from "@/lib/features";

interface Feature {
  id: string;
  feature_key: string;
  feature_value: string;
  feature_type: string;
  display_name: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
}

const PlanFeaturesPage = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);

  useEffect(() => {
    if (planId) {
      fetchPlanAndFeatures();
    }
  }, [planId]);

  const fetchPlanAndFeatures = async () => {
    try {
      const [planResult, featuresResult] = await Promise.all([
        supabase.from('subscription_plans').select('*').eq('id', planId).single(),
        supabase.from('plan_features').select('*').eq('plan_id', planId).order('display_name'),
      ]);

      if (planResult.error) throw planResult.error;
      if (featuresResult.error) throw featuresResult.error;

      setPlan(planResult.data);
      setFeatures(featuresResult.data || []);
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

  const handleDelete = async (featureId: string) => {
    if (!confirm('Are you sure you want to delete this feature?')) return;

    try {
      const { error } = await supabase
        .from('plan_features')
        .delete()
        .eq('id', featureId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Feature deleted successfully",
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

  const applyFeatureTemplate = async () => {
    if (!planId) return;

    try {
      setIsLoading(true);

      // Get existing features
      const { data: existingFeatures } = await supabase
        .from('plan_features')
        .select('feature_key')
        .eq('plan_id', planId);

      const existingKeys = new Set(existingFeatures?.map(f => f.feature_key) || []);

      // Add missing features
      const featuresToAdd = FEATURE_DEFINITIONS.filter(
        def => !existingKeys.has(def.key)
      ).map(def => ({
        plan_id: planId,
        feature_key: def.key,
        feature_value: def.defaultValue,
        feature_type: def.type,
        display_name: def.displayName,
      }));

      if (featuresToAdd.length === 0) {
        toast({
          title: "Info",
          description: "All features are already added to this plan",
        });
        return;
      }

      const { error } = await supabase
        .from('plan_features')
        .insert(featuresToAdd);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${featuresToAdd.length} features to the plan`,
      });

      fetchPlanAndFeatures();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (feature: Feature) => {
    setEditingFeature(feature);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingFeature(null);
    setDialogOpen(true);
  };

  const formatFeatureValue = (value: string, type: string) => {
    if (type === 'boolean') {
      return value === 'true' ? 'Enabled' : 'Disabled';
    }
    if (value === 'unlimited') {
      return 'Unlimited';
    }
    return value;
  };

  const getFeatureIcon = (type: string) => {
    switch (type) {
      case 'boolean':
        return ToggleLeft;
      case 'number':
        return Hash;
      case 'text':
      default:
        return Type;
    }
  };

  const getFeatureTypeColor = (type: string) => {
    switch (type) {
      case 'boolean':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'number':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'text':
      default:
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
    }
  };

  return (
    <AdminRoute>
      <AdminLayout>
        <TooltipProvider>
          <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin/plans')}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <div className="h-6 w-px bg-border" />
                  <div>
                    <h1 className="text-3xl font-bold">
                      {plan?.name} Features
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {plan?.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline"
                    onClick={applyFeatureTemplate}
                    disabled={isLoading}
                    size="sm"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Apply Template
                  </Button>
                  <Button onClick={handleCreate} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Feature
                  </Button>
                </div>
              </div>

              {!loading && features.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">{features.length} {features.length === 1 ? 'Feature' : 'Features'}</Badge>
                </div>
              )}
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                <p className="mt-4 text-muted-foreground">Loading features...</p>
              </div>
            ) : features.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No features yet</h3>
                  <p className="text-muted-foreground text-center max-w-sm mb-6">
                    Start building your plan by adding features that define what users can access.
                  </p>
                  <Button onClick={handleCreate} size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Feature
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => {
                  const FeatureIcon = getFeatureIcon(feature.feature_type);
                  return (
                    <Card key={feature.id} className="hover:border-foreground/30 transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <div className="rounded-lg bg-muted p-2 mt-1">
                              <FeatureIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg mb-1.5 break-words">
                                {feature.display_name}
                              </CardTitle>
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${getFeatureTypeColor(feature.feature_type)}`}
                              >
                                {feature.feature_type}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEdit(feature)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit feature</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => handleDelete(feature.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete feature</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                         <div className="space-y-3">
                           <div>
                             <div className="text-3xl font-bold text-primary">
                               {formatFeatureValue(feature.feature_value, feature.feature_type)}
                             </div>
                           </div>
                           <div className="pt-2 border-t space-y-2">
                             <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded break-all block">
                               {feature.feature_key}
                             </code>
                             {getFeatureDefinition(feature.feature_key) && (
                               <div className="flex items-center gap-2 text-xs">
                                 {getFeatureDefinition(feature.feature_key)!.enforced ? (
                                   <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                                     ✓ Enforced
                                   </Badge>
                                 ) : (
                                   <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                                     Not Enforced
                                   </Badge>
                                 )}
                               </div>
                             )}
                           </div>
                         </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {planId && (
              <FeatureDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                feature={editingFeature}
                planId={planId}
                onSuccess={fetchPlanAndFeatures}
              />
            )}
          </div>
        </TooltipProvider>
      </AdminLayout>
    </AdminRoute>
  );
};

export default PlanFeaturesPage;
