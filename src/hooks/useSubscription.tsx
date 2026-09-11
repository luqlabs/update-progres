import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface SubscriptionData {
  subscribed: boolean;
  plan_id?: string;
  plan_name?: string;
  product_id?: string;
  subscription_end?: string;
  billing_interval?: string;
  is_free_tier?: boolean;
}

interface UseSubscriptionReturn {
  subscription: SubscriptionData | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  isPremium: boolean;
  isFree: boolean;
}

const fetchSubscription = async (): Promise<SubscriptionData | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }

  const { data, error } = await supabase.functions.invoke('check-subscription', {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    console.error('Error checking subscription:', error);
    return null;
  }

  return data;
};

export const useSubscription = (): UseSubscriptionReturn => {
  const queryClient = useQueryClient();

  const { data: subscription = null, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: fetchSubscription,
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 30 * 60 * 1000,   // 30 minutes - keep in cache
    refetchOnWindowFocus: false,
  });

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    });

    return () => {
      authSub.unsubscribe();
    };
  }, [queryClient]);

  // Set up realtime subscription for user_subscriptions changes
  useEffect(() => {
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        realtimeChannel = supabase
          .channel('user-subscription-changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'user_subscriptions',
              filter: `user_id=eq.${session.user.id}`
            },
            (payload) => {
              console.log('[useSubscription] Detected subscription change:', payload);
              queryClient.invalidateQueries({ queryKey: ['subscription'] });
            }
          )
          .subscribe();
      }
    });

    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [queryClient]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['subscription'] });
  }, [queryClient]);

  const isPremium = subscription?.subscribed && !subscription?.is_free_tier;
  const isFree = subscription?.subscribed && subscription?.is_free_tier === true;

  return {
    subscription,
    isLoading,
    refresh,
    isPremium: isPremium || false,
    isFree: isFree || false,
  };
};
