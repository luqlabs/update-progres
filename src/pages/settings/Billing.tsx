import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SettingsLayout from "@/components/settings/SettingsLayout";
import { Loader2, CreditCard, TrendingUp, Calendar, Check, X } from "lucide-react";
import { useFeatures } from "@/hooks/useFeatures";
import { useSubscription } from "@/hooks/useSubscription";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useCrisp } from "@/hooks/useCrisp";

const Billing = () => {
  useCrisp();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [appsCount, setAppsCount] = useState(0);
  const [monthlyPlays, setMonthlyPlays] = useState(0);
  const [storageUsed, setStorageUsed] = useState(0);
  const [portalLoading, setPortalLoading] = useState(false);
  const { toast } = useToast();
  const { 
    getNumberFeature, 
    getBooleanFeature,
    getRemainingApps, 
    getRemainingAI,
    getStorageUsage,
    isLoading: featuresLoading 
  } = useFeatures();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setSession(session);
        loadBillingInfo(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadBillingInfo = async (userId: string) => {
    try {
      // Calculate start of current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [creditsResult, appsResult, userAppsResult, storageResult] = await Promise.all([
        supabase.rpc("get_user_credits", { _user_id: userId }),
        supabase.from('apps').select('*', { count: 'exact', head: true }).eq('teacher_id', userId),
        supabase.from('apps').select('id').eq('teacher_id', userId),
        getStorageUsage(),
      ]);

      if (!creditsResult.error && creditsResult.data !== null) {
        setCredits(creditsResult.data);
      }

      if (!appsResult.error) {
        setAppsCount(appsResult.count || 0);
      }

      setStorageUsed(storageResult.usedMB);

      // Calculate monthly plays
      if (userAppsResult.data && userAppsResult.data.length > 0) {
        const appIds = userAppsResult.data.map(app => app.id);
        const { count } = await supabase
          .from('student_sessions')
          .select('*', { count: 'exact', head: true })
          .in('app_id', appIds)
          .gte('started_at', startOfMonth.toISOString());
        
        setMonthlyPlays(count || 0);
      } else {
        setMonthlyPlays(0);
      }
    } catch (error: any) {
      console.error("Error loading billing info:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!session || loading || featuresLoading || subscriptionLoading) {
    return (
      <SettingsLayout>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SettingsLayout>
    );
  }

  const handleManageBilling = async () => {
    try {
      setPortalLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to manage billing",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const maxApps = getNumberFeature('max_apps');
  const maxCredits = getNumberFeature('credits');
  const maxMonthlyPlays = getNumberFeature('max_monthly_plays');
  const maxStorageMB = getNumberFeature('max_storage_mb');
  const hasCustomBranding = getBooleanFeature('custom_branding');
  const hasAdvancedAnalytics = getBooleanFeature('advanced_analytics');
  
  const appsPercentage = maxApps === 'unlimited' ? 0 : (appsCount / maxApps) * 100;
  const creditsPercentage = maxCredits === 'unlimited' ? 0 : credits !== null ? (credits / maxCredits) * 100 : 0;
  const playsPercentage = maxMonthlyPlays === 'unlimited' ? 0 : (monthlyPlays / maxMonthlyPlays) * 100;
  const storagePercentage = maxStorageMB === 'unlimited' ? 0 : (storageUsed / maxStorageMB) * 100;

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Billing & Subscription</h3>
          <p className="text-sm text-muted-foreground">
            Manage your subscription plan and billing information
          </p>
        </div>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>
                  {subscription?.subscribed 
                    ? 'Your active subscription' 
                    : 'You don\'t have an active subscription'}
                </CardDescription>
              </div>
              {subscription?.subscribed && (
                <Badge variant={subscription.is_free_tier ? "secondary" : "default"}>
                  {subscription.is_free_tier ? 'Free' : 'Premium'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {subscription?.subscribed ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Plan Name</p>
                      <p className="text-sm text-muted-foreground">
                        {subscription.plan_name || 'Current Plan'}
                      </p>
                    </div>
                  </div>

                  {subscription.billing_interval && !subscription.is_free_tier && (
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Billing Interval</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {subscription.billing_interval}
                        </p>
                      </div>
                    </div>
                  )}

                  {subscription.subscription_end && !subscription.is_free_tier && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Next Billing Date</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(subscription.subscription_end), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  {!subscription.is_free_tier && (
                    <Button 
                      variant="outline" 
                      onClick={handleManageBilling}
                      disabled={portalLoading}
                    >
                      {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Manage Billing
                    </Button>
                  )}
                  <Button onClick={() => navigate('/upgrade')}>
                    {subscription.is_free_tier ? 'Upgrade Plan' : 'Change Plan'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  You don't have an active subscription yet
                </p>
                <Button onClick={() => navigate('/upgrade')}>
                  View Available Plans
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Usage & Limits</CardTitle>
            <CardDescription>Track your feature usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Apps Created */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Apps Created</span>
                  <span className="text-muted-foreground">
                    {appsCount} / {maxApps === 'unlimited' ? '∞' : maxApps}
                  </span>
                </div>
                {maxApps !== 'unlimited' && (
                  <Progress value={appsPercentage} className="h-2" />
                )}
              </div>

              {/* AI Credits */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">AI Credits Remaining</span>
                  <span className="text-muted-foreground">
                    {credits !== null ? `${credits} / ${maxCredits === 'unlimited' ? '∞' : maxCredits}` : "Loading..."}
                  </span>
                </div>
                {credits !== null && maxCredits !== 'unlimited' && (
                  <Progress value={creditsPercentage} className="h-2" />
                )}
              </div>

              {/* Monthly Plays */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Monthly Plays</span>
                  <span className="text-muted-foreground">
                    {monthlyPlays} / {maxMonthlyPlays === 'unlimited' ? '∞' : maxMonthlyPlays}
                  </span>
                </div>
                {maxMonthlyPlays !== 'unlimited' && (
                  <Progress value={playsPercentage} className="h-2" />
                )}
              </div>

              {/* Storage Used */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Storage Used</span>
                  <span className="text-muted-foreground">
                    {storageUsed.toFixed(2)} MB / {maxStorageMB === 'unlimited' ? '∞' : `${maxStorageMB} MB`}
                  </span>
                </div>
                {maxStorageMB !== 'unlimited' && (
                  <Progress value={storagePercentage} className="h-2" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Access */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Access</CardTitle>
            <CardDescription>Premium features available on your plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Custom Branding */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Hide Powered by Quizable</span>
                <div className="flex items-center gap-2">
                  {hasCustomBranding ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <Badge variant="outline" className="text-green-500 border-green-500">
                        Enabled
                      </Badge>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-muted-foreground">
                        Not Available
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Advanced Analytics */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Advanced Analytics</span>
                <div className="flex items-center gap-2">
                  {hasAdvancedAnalytics ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <Badge variant="outline" className="text-green-500 border-green-500">
                        Enabled
                      </Badge>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-muted-foreground">
                        Not Available
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>View your past transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              No payment history available
            </p>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
};

export default Billing;
