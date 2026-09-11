import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Plus, Edit, Trash2, Settings, Users, DollarSign, Tag, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { PlanDialog } from "@/components/admin/PlanDialog";

interface Plan {
  id: string;
  name: string;
  description: string;
  billing_type: 'subscription' | 'one_time' | 'credits';
  price_monthly: number;
  price_yearly: number;
  price_one_time: number | null;
  stripe_product_id: string;
  stripe_price_id_one_time: string | null;
  credits_amount: number | null;
  is_active: boolean;
  show_on_landing: boolean;
  display_order: number;
  subscriber_count?: number;
}

const PlansPage = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (plansError) throw plansError;

      // Get subscriber count for each plan
      const plansWithStats = await Promise.all(
        (plansData || []).map(async (plan) => {
          const { count } = await supabase
            .from("user_subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("plan_id", plan.id)
            .eq("status", "active");

          return {
            ...plan,
            billing_type: (plan.billing_type || 'subscription') as 'subscription' | 'one_time' | 'credits',
            subscriber_count: count || 0,
          };
        })
      );

      setPlans(plansWithStats);
    } catch (error: any) {
      console.error("Error fetching plans:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('admin-delete-plan', {
        body: { plan_id: planId },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Plan deleted successfully",
      });
      fetchPlans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setDialogOpen(true);
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("subscription_plans")
        .update({ is_active: !currentStatus })
        .eq("id", planId);

      if (error) throw error;

      sonnerToast.success(`Plan ${currentStatus ? "deactivated" : "activated"}`);
      fetchPlans();
    } catch (error: any) {
      console.error("Error updating plan:", error);
      sonnerToast.error("Failed to update plan");
    }
  };

  const toggleLandingVisibility = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("subscription_plans")
        .update({ show_on_landing: !currentStatus })
        .eq("id", planId);

      if (error) throw error;

      sonnerToast.success(`Plan ${!currentStatus ? "shown on" : "hidden from"} landing page`);
      fetchPlans();
    } catch (error: any) {
      console.error("Error toggling landing visibility:", error);
      sonnerToast.error("Failed to update landing visibility");
    }
  };

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Subscription Plans</h2>
              <p className="text-muted-foreground">Manage pricing plans and features</p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Plan
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-muted-foreground">Loading plans...</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className={`flex flex-col ${!plan.is_active ? 'opacity-60' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {plan.name}
                          <Badge variant={plan.billing_type === 'subscription' ? 'default' : 'secondary'}>
                            {plan.billing_type === 'subscription' && '🔄 Subscription'}
                            {plan.billing_type === 'one_time' && '💎 Lifetime'}
                            {plan.billing_type === 'credits' && '🪙 Credits'}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">{plan.description || "No description"}</CardDescription>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge variant={plan.is_active ? "default" : "secondary"}>
                          {plan.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {plan.show_on_landing ? (
                          <Badge variant="outline" className="gap-1">
                            <Eye className="h-3 w-3" />
                            On Landing
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <EyeOff className="h-3 w-3" />
                            Hidden
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        {plan.billing_type === 'subscription' ? (
                          <>
                            <div className="flex items-baseline gap-2">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <span className="text-2xl font-bold">
                                ${plan.price_monthly}
                              </span>
                              <span className="text-muted-foreground">/month</span>
                            </div>
                            {plan.price_yearly && plan.price_yearly > 0 && (
                              <div className="flex items-baseline gap-2 text-sm">
                                <span className="text-muted-foreground">or</span>
                                <span className="font-semibold">
                                  ${plan.price_yearly}/year
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-baseline gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="text-2xl font-bold">
                              ${plan.price_one_time}
                            </span>
                            <span className="text-muted-foreground">one-time</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {plan.subscriber_count || 0} {plan.billing_type === 'subscription' ? 'active subscriber' : 'lifetime purchase'}{plan.subscriber_count !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/plans/${plan.id}/features`)}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Features
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/plans/${plan.id}/pricing-features`)}
                        >
                          <Tag className="mr-2 h-4 w-4" />
                          Pricing
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(plan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-2">
                      <Button
                        variant={plan.is_active ? "destructive" : "default"}
                        size="sm"
                        className="w-full"
                        onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                      >
                        {plan.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant={plan.show_on_landing ? "outline" : "secondary"}
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => toggleLandingVisibility(plan.id, plan.show_on_landing)}
                      >
                        {plan.show_on_landing ? (
                          <>
                            <EyeOff className="h-4 w-4" />
                            Hide from Landing
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            Show on Landing
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <PlanDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            plan={editingPlan}
            onSuccess={fetchPlans}
          />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default PlansPage;
