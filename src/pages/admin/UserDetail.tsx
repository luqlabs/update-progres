import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RoleManager } from "@/components/admin/RoleManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Mail, Calendar, CreditCard, Trash2, FileText, Play, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DeleteUserDialog } from "@/components/admin/DeleteUserDialog";

interface UserDetail {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  last_seen: string | null;
  role: "admin" | "user";
  credits: number;
  apps_created: number;
  monthly_plays: number;
  plan_name: string | null;
  plan_id: string | null;
  subscription_status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  is_free_tier: boolean;
}

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState("");
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserDetail();
      fetchPlans();
    }
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-get-users", {
        body: { userId },
      });

      if (error) throw error;

      if (data.users && data.users.length > 0) {
        const userData = data.users[0];
        setUser(userData);
        setCredits(String(userData.credits));
      }
    } catch (error: any) {
      console.error("Error fetching user:", error);
      toast.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("id, name, description, is_free_tier")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to fetch subscription plans");
    }
  };

  const handleRoleChange = async (userId: string, newRole: "admin" | "user") => {
    try {
      const { error } = await supabase.functions.invoke("admin-manage-user", {
        body: {
          userId,
          action: "update_role",
          role: newRole,
        },
      });

      if (error) throw error;

      await fetchUserDetail();
    } catch (error) {
      throw error;
    }
  };

  const handleCreditsUpdate = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase.functions.invoke("admin-manage-user", {
        body: {
          userId,
          action: "update_credits",
          credits: parseInt(credits),
        },
      });

      if (error) throw error;

      toast.success("Credits updated successfully");
      await fetchUserDetail();
    } catch (error: any) {
      console.error("Error updating credits:", error);
      toast.error("Failed to update credits");
    }
  };

  const handlePlanUpdate = async () => {
    if (!userId || !selectedPlan) return;

    try {
      const { error } = await supabase.functions.invoke("admin-manage-user", {
        body: {
          userId,
          action: "update_plan",
          planId: selectedPlan,
        },
      });

      if (error) throw error;

      toast.success("Plan updated successfully");
      setSelectedPlan("");
      await fetchUserDetail();
    } catch (error: any) {
      console.error("Error updating plan:", error);
      toast.error("Failed to update plan");
    }
  };

  const handleDeleteUser = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase.functions.invoke("admin-manage-user", {
        body: {
          userId,
          action: "delete_user",
        },
      });

      if (error) throw error;

      toast.success("User deleted successfully");
      navigate("/admin/users");
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <AdminRoute>
        <AdminLayout>
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Loading user details...</p>
          </div>
        </AdminLayout>
      </AdminRoute>
    );
  }

  if (!user) {
    return (
      <AdminRoute>
        <AdminLayout>
          <div className="text-center py-12">
            <p className="text-muted-foreground">User not found</p>
            <Button variant="outline" onClick={() => navigate("/admin/users")} className="mt-4">
              Back to Users
            </Button>
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
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/users")}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">User Details</h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Basic user details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                {user.last_seen && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      Last seen {new Date(user.last_seen).toLocaleDateString()} at{' '}
                      {new Date(user.last_seen).toLocaleTimeString()}
                    </span>
                  </div>
                )}
                <div>
                  <Label>Full Name</Label>
                  <p className="text-sm mt-1">{user.full_name || "Not set"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription & Plan</CardTitle>
                <CardDescription>Current plan details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{user.plan_name || "Free Plan"}</span>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={user.subscription_status === "active" ? "default" : "secondary"}>
                      {user.subscription_status || "Free"}
                    </Badge>
                    {!user.stripe_subscription_id && user.plan_id && (
                      <Badge variant="outline" className="text-xs">
                        Manual
                      </Badge>
                    )}
                  </div>
                </div>
                {user.current_period_end && (
                  <div>
                    <Label>Period Ends</Label>
                    <p className="text-sm mt-1">{new Date(user.current_period_end).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
                <CardDescription>User activity metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Apps Created</span>
                  </div>
                  <span className="font-semibold">{user.apps_created}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Monthly Plays</span>
                  </div>
                  <span className="font-semibold">{user.monthly_plays}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Credits</span>
                  </div>
                  <span className="font-semibold">{user.credits}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
                <CardDescription>Manage user account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>User Role</Label>
                  <div className="mt-2">
                    <RoleManager
                      userId={user.id}
                      currentRole={user.role}
                      onRoleChange={handleRoleChange}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="credits">Update Credits</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="credits"
                      type="number"
                      value={credits}
                      onChange={(e) => setCredits(e.target.value)}
                      placeholder="Enter new credit amount"
                    />
                    <Button onClick={handleCreditsUpdate}>Update</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Plan Management</CardTitle>
                <CardDescription>Manually assign subscription plans for promotions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Current Plan</Label>
                    <p className="text-sm font-medium mt-1">
                      {user.plan_name || "Free Plan"}
                    </p>
                    {user.subscription_status && (
                      <Badge variant="outline" className="mt-1">
                        {user.subscription_status}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="plan-select">Assign New Plan</Label>
                    <div className="space-y-2">
                      <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                        <SelectTrigger id="plan-select">
                          <SelectValue placeholder="Select a plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name} {plan.is_free_tier && "(Free Tier)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedPlan && (
                        <p className="text-xs text-muted-foreground">
                          Will be set to active for 30 days from now
                        </p>
                      )}
                      <Button onClick={handlePlanUpdate} disabled={!selectedPlan} className="w-full md:w-auto">
                        Update Plan
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    variant="destructive" 
                    onClick={() => setDeleteDialogOpen(true)}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete User Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DeleteUserDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteUser}
          userEmail={user.email}
        />
      </AdminLayout>
    </AdminRoute>
  );
}
