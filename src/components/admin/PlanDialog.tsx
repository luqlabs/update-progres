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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ExternalLink } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string;
  billing_type?: 'subscription' | 'one_time' | 'credits';
  price_monthly: number;
  price_yearly: number;
  price_one_time?: number | null;
  is_free_tier?: boolean;
  show_on_landing?: boolean;
  stripe_product_id?: string;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
  stripe_price_id_one_time?: string | null;
  credits_amount?: number | null;
}

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan | null;
  onSuccess: () => void;
}

export const PlanDialog = ({ open, onOpenChange, plan, onSuccess }: PlanDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [fetchingStripe, setFetchingStripe] = useState(false);
  const [mode, setMode] = useState<'auto' | 'import'>('auto');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    billing_type: 'subscription' as 'subscription' | 'one_time' | 'credits',
    price_monthly: 0,
    price_yearly: 0,
    price_one_time: 0,
    credits_amount: null as number | null,
    is_free_tier: false,
    show_on_landing: true,
    stripe_price_id_monthly: '',
    stripe_price_id_yearly: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        description: plan.description || '',
        billing_type: plan.billing_type || 'subscription',
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly || 0,
        price_one_time: plan.price_one_time || 0,
        credits_amount: plan.credits_amount || null,
        is_free_tier: plan.is_free_tier || false,
        show_on_landing: plan.show_on_landing ?? true,
        stripe_price_id_monthly: plan.stripe_price_id_monthly || '',
        stripe_price_id_yearly: plan.stripe_price_id_yearly || '',
      });
      setMode(plan.stripe_price_id_monthly && !plan.is_free_tier ? 'import' : 'auto');
    } else {
      setFormData({
        name: '',
        description: '',
        billing_type: 'subscription',
        price_monthly: 0,
        price_yearly: 0,
        price_one_time: 0,
        credits_amount: null,
        is_free_tier: false,
        show_on_landing: true,
        stripe_price_id_monthly: '',
        stripe_price_id_yearly: '',
      });
      setMode('auto');
    }
  }, [plan, open]);

  const handleFetchFromStripe = async () => {
    if (!formData.stripe_price_id_monthly) {
      toast({
        title: "Error",
        description: "Please enter a monthly Price ID",
        variant: "destructive",
      });
      return;
    }

    setFetchingStripe(true);
    try {
      // We'll fetch this through Stripe in the import function
      toast({
        title: "Info",
        description: "Price details will be fetched when you save",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setFetchingStripe(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (plan) {
        // Update existing plan
        const { error } = await supabase.functions.invoke('admin-update-stripe-plan', {
          body: {
            plan_id: plan.id,
            name: formData.name,
            description: formData.description,
            price_monthly: formData.price_monthly,
            price_yearly: formData.price_yearly,
            show_on_landing: formData.show_on_landing,
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Plan updated successfully",
        });
      } else {
        // Create new plan
        if (mode === 'import' && !formData.is_free_tier) {
          // Import from Stripe
          const { error } = await supabase.functions.invoke('admin-import-stripe-plan', {
            body: {
              price_id_monthly: formData.stripe_price_id_monthly,
              price_id_yearly: formData.stripe_price_id_yearly || null,
            },
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          });

          if (error) throw error;

          toast({
            title: "Success",
            description: "Plan imported from Stripe successfully",
          });
        } else {
          // Auto-create or free tier
          const defaultFeatures = [
            { feature_key: 'max_apps', feature_value: '10', feature_type: 'number', display_name: 'Maximum Apps' },
            { feature_key: 'max_monthly_plays', feature_value: '1000', feature_type: 'number', display_name: 'Monthly Plays' },
            { feature_key: 'max_ai_generations', feature_value: '50', feature_type: 'number', display_name: 'AI Generations per Month' },
          ];

          const { error } = await supabase.functions.invoke('admin-create-stripe-plan', {
            body: {
              ...formData,
              billing_type: formData.billing_type,
              price_one_time: formData.price_one_time || null,
              features: defaultFeatures,
            },
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          });

          if (error) throw error;

          toast({
            title: "Success",
            description: formData.is_free_tier 
              ? "Free tier plan created successfully" 
              : "Plan created successfully with Stripe integration",
          });
        }
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{plan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
            <DialogDescription>
              {plan ? 'Update plan details and pricing' : 'Create a subscription plan with Stripe integration or free tier'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!plan && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_free_tier"
                    checked={formData.is_free_tier}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, is_free_tier: checked as boolean })
                    }
                  />
                  <Label htmlFor="is_free_tier">This is a free tier (no Stripe required)</Label>
                </div>

                {!formData.is_free_tier && (
                  <>
                    <div className="grid gap-2">
                      <Label>Billing Model</Label>
                      <select 
                        value={formData.billing_type} 
                        onChange={(e) => setFormData({...formData, billing_type: e.target.value as any})}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="subscription">🔄 Subscription (Recurring)</option>
                        <option value="one_time">💎 One-Time Purchase (Lifetime)</option>
                        <option value="credits">🪙 Credits Package (Future)</option>
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Creation Mode</Label>
                      <RadioGroup value={mode} onValueChange={(value: any) => setMode(value)}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="auto" id="auto" />
                          <Label htmlFor="auto" className="font-normal">Auto-create in Stripe</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="import" id="import" />
                          <Label htmlFor="import" className="font-normal">Import from Stripe (paste Price ID)</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </>
                )}
              </>
            )}

            {mode === 'import' && !formData.is_free_tier && !plan ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="stripe_price_id_monthly">
                    Stripe Price ID (Monthly) *
                    <a 
                      href="https://dashboard.stripe.com/prices" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 text-xs text-blue-500 hover:underline inline-flex items-center"
                    >
                      Find in Stripe <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </Label>
                  <Input
                    id="stripe_price_id_monthly"
                    placeholder="price_xxxxxxxxxxxxx"
                    value={formData.stripe_price_id_monthly}
                    onChange={(e) => setFormData({ ...formData, stripe_price_id_monthly: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stripe_price_id_yearly">Stripe Price ID (Yearly) - Optional</Label>
                  <Input
                    id="stripe_price_id_yearly"
                    placeholder="price_xxxxxxxxxxxxx"
                    value={formData.stripe_price_id_yearly}
                    onChange={(e) => setFormData({ ...formData, stripe_price_id_yearly: e.target.value })}
                  />
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleFetchFromStripe}
                  disabled={fetchingStripe || !formData.stripe_price_id_monthly}
                >
                  {fetchingStripe && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Fetch Details from Stripe
                </Button>
                <p className="text-sm text-muted-foreground">
                  Product name and prices will be imported from Stripe
                </p>
              </>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="name">Plan Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                {formData.billing_type === 'subscription' && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="price_monthly">Monthly Price ($) *</Label>
                      <Input
                        id="price_monthly"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price_monthly}
                        onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) })}
                        required
                        disabled={formData.is_free_tier}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="price_yearly">Yearly Price ($) - Optional</Label>
                      <Input
                        id="price_yearly"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price_yearly}
                        onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) })}
                        disabled={formData.is_free_tier}
                      />
                    </div>
                  </>
                )}

                {formData.billing_type === 'one_time' && (
                  <div className="grid gap-2">
                    <Label htmlFor="price_one_time">One-Time Price ($) *</Label>
                    <Input
                      id="price_one_time"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="299.00"
                      value={formData.price_one_time}
                      onChange={(e) => setFormData({ ...formData, price_one_time: parseFloat(e.target.value) })}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      💡 Lifetime plans get monthly credit refills forever (configured in Features)
                    </p>
                  </div>
                )}

                {formData.billing_type === 'credits' && (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">
                      🪙 <strong>Credits System</strong> - Coming soon: Allow users to purchase credit packages separately
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show_on_landing"
                    checked={formData.show_on_landing}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, show_on_landing: checked as boolean })
                    }
                  />
                  <Label
                    htmlFor="show_on_landing"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Show on landing page
                  </Label>
                </div>

                {!formData.is_free_tier && mode === 'auto' && !plan && (
                  <p className="text-sm text-muted-foreground">
                    💡 This will create a new Stripe product and prices automatically
                  </p>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {plan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};