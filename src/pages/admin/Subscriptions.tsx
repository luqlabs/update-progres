import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, DollarSign, Users, TrendingUp, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { StatsCard } from "@/components/admin/StatsCard";

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  billing_interval: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  current_period_end: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
  plan_name?: string;
  plan_price_monthly?: number;
  plan_price_yearly?: number;
  plan_is_free_tier?: boolean;
}

export default function Subscriptions() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    mrr: 0,
    newThisMonth: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      // Fetch subscriptions with related data
      const { data: subsData, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name');

      if (profilesError) throw profilesError;

      // Fetch plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('id, name, price_monthly, price_yearly, is_free_tier');

      if (plansError) throw plansError;

      // Create lookup maps
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const plansMap = new Map(plansData?.map(p => [p.id, p]) || []);

      // Combine data
      const combined: Subscription[] = (subsData || []).map(sub => {
        const profile = profilesMap.get(sub.user_id);
        const plan = plansMap.get(sub.plan_id);
        return {
          ...sub,
          user_email: profile?.email,
          user_name: profile?.full_name,
          plan_name: plan?.name,
          plan_price_monthly: plan?.price_monthly,
          plan_price_yearly: plan?.price_yearly,
          plan_is_free_tier: plan?.is_free_tier,
        };
      });

      setSubscriptions(combined);

      // Calculate stats
      const activeCount = combined.filter(s => s.status === 'active').length;
      const mrr = combined.reduce((sum, sub) => {
        if (sub.status === 'active' && !sub.plan_is_free_tier) {
          const price = sub.billing_interval === 'yearly' 
            ? (sub.plan_price_yearly || 0) / 12 
            : (sub.plan_price_monthly || 0);
          return sum + price;
        }
        return sum;
      }, 0);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newCount = combined.filter(s => 
        new Date(s.created_at) > thirtyDaysAgo
      ).length;

      setStats({
        total: combined.length,
        active: activeCount,
        mrr: Math.round(mrr * 100) / 100,
        newThisMonth: newCount,
      });
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      canceled: "secondary",
      past_due: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const columns = [
    {
      header: "User",
      cell: (row: Subscription) => (
        <div>
          <p className="font-medium">{row.user_name || row.user_email || 'Unknown'}</p>
          <p className="text-sm text-muted-foreground">{row.user_email}</p>
        </div>
      ),
    },
    {
      header: "Plan",
      cell: (row: Subscription) => (
        <div>
          <p className="font-medium">{row.plan_name}</p>
          {row.plan_is_free_tier && (
            <Badge variant="outline" className="text-xs mt-1">Free Tier</Badge>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row: Subscription) => getStatusBadge(row.status),
    },
    {
      header: "Interval",
      cell: (row: Subscription) => (
        <span className="capitalize">{row.billing_interval || 'N/A'}</span>
      ),
    },
    {
      header: "Started",
      cell: (row: Subscription) => format(new Date(row.created_at), 'MMM d, yyyy'),
    },
    {
      header: "Next Billing",
      cell: (row: Subscription) => 
        row.current_period_end 
          ? format(new Date(row.current_period_end), 'MMM d, yyyy')
          : 'N/A',
    },
    {
      header: "Actions",
      cell: (row: Subscription) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/admin/users/${row.user_id}`)}
          >
            View User
          </Button>
          {row.stripe_customer_id && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(
                `https://dashboard.stripe.com/customers/${row.stripe_customer_id}`,
                '_blank'
              )}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Subscriptions</h1>
              <p className="text-muted-foreground">Monitor and manage user subscriptions</p>
            </div>
            <Button onClick={fetchSubscriptions} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <StatsCard
              title="Total Subscriptions"
              value={stats.total}
              icon={Users}
            />
            <StatsCard
              title="Active"
              value={stats.active}
              icon={TrendingUp}
              trend={{ value: 0, isPositive: true }}
            />
            <StatsCard
              title="Monthly Revenue"
              value={`$${stats.mrr.toFixed(2)}`}
              icon={DollarSign}
            />
            <StatsCard
              title="New This Month"
              value={stats.newThisMonth}
              icon={Users}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={subscriptions}
                isLoading={loading}
              />
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}