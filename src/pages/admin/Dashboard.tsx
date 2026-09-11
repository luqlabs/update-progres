import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatsCard } from "@/components/admin/StatsCard";
import { Users, CreditCard, Gamepad2, TrendingUp, Activity, DollarSign, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Stats {
  totalUsers: number;
  activeSubscriptions: number;
  totalApps: number;
  totalSessions: number;
  newUsersThisMonth: number;
  revenue: number;
}

interface RecentActivity {
  type: string;
  message: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  const { data: stats = {
    totalUsers: 0,
    activeSubscriptions: 0,
    totalApps: 0,
    totalSessions: 0,
    newUsersThisMonth: 0,
    revenue: 0,
  }, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [usersRes, subsRes, appsRes, sessionsRes, newUsersRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase
          .from("user_subscriptions")
          .select("id, subscription_plans!inner(is_free_tier)", { count: "exact", head: true })
          .eq("status", "active")
          .eq("subscription_plans.is_free_tier", false),
        supabase.from("apps").select("id", { count: "exact", head: true }),
        supabase.from("student_sessions").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
      ]);

      return {
        totalUsers: usersRes.count || 0,
        activeSubscriptions: subsRes.count || 0,
        totalApps: appsRes.count || 0,
        totalSessions: sessionsRes.count || 0,
        newUsersThisMonth: newUsersRes.count || 0,
        revenue: 0, // Would be calculated from Stripe in production
      };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ["admin-dashboard-activity"],
    queryFn: async () => {
      // Get recent user signups
      const { data: recentUsers } = await supabase
        .from("profiles")
        .select("email, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      // Get recent apps
      const { data: recentApps } = await supabase
        .from("apps")
        .select("title, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      const activities: RecentActivity[] = [
        ...(recentUsers || []).map((u) => ({
          type: "signup",
          message: `New user: ${u.email}`,
          timestamp: u.created_at,
        })),
        ...(recentApps || []).map((a) => ({
          type: "app",
          message: `New app created: ${a.title}`,
          timestamp: a.created_at,
        })),
      ]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      return activities;
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard-activity"] });
    toast.success("Refreshing dashboard data...");
  };

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-muted-foreground">
                Overview of your Quizabl platform
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={statsLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${statsLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Users"
              value={stats.totalUsers}
              icon={Users}
              description="Registered users"
              trend={{
                value: stats.newUsersThisMonth,
                isPositive: stats.newUsersThisMonth > 0,
              }}
            />
            <StatsCard
              title="Active Subscriptions"
              value={stats.activeSubscriptions}
              icon={CreditCard}
              description="Paid subscribers"
            />
            <StatsCard
              title="Total Apps"
              value={stats.totalApps}
              icon={Gamepad2}
              description="Created by teachers"
            />
            <StatsCard
              title="Student Sessions"
              value={stats.totalSessions}
              icon={TrendingUp}
              description="All-time plays"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest user signups and app creations</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <div className="flex-1">
                          <p className="font-medium">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Platform Metrics
                </CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New Users (30d)</span>
                  <span className="font-bold">{stats.newUsersThisMonth}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Conversion Rate</span>
                  <span className="font-bold">
                    {stats.totalUsers > 0
                      ? ((stats.activeSubscriptions / stats.totalUsers) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Apps/User</span>
                  <span className="font-bold">
                    {stats.totalUsers > 0
                      ? (stats.totalApps / stats.totalUsers).toFixed(1)
                      : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Engagement Rate</span>
                  <span className="font-bold">
                    {stats.totalApps > 0
                      ? ((stats.totalSessions / stats.totalApps) * 100).toFixed(0)
                      : 0}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}
