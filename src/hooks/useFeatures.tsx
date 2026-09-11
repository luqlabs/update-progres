import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from './useSubscription';

interface Feature {
  feature_key: string;
  feature_value: string;
  feature_type: string;
}

interface UseFeatureReturn {
  features: Record<string, string>;
  isLoading: boolean;
  refresh: () => Promise<void>;
  // Helper functions
  getFeature: (key: string) => string | null;
  hasFeature: (key: string) => boolean;
  getNumberFeature: (key: string) => number | 'unlimited';
  getBooleanFeature: (key: string) => boolean;
  canCreateApp: () => Promise<boolean>;
  getRemainingApps: () => Promise<number | 'unlimited'>;
  canUseAI: () => Promise<boolean>;
  getRemainingAI: () => Promise<number | 'unlimited'>;
  getCredits: () => Promise<number | 'unlimited'>;
  getRemainingCredits: () => Promise<number | 'unlimited'>;
  canUploadStorage: (fileSizeBytes: number) => Promise<boolean>;
  getStorageUsage: () => Promise<{ usedMB: number; maxMB: number | 'unlimited' }>;
}

const fetchFeatures = async (planId: string): Promise<Record<string, string>> => {
  console.log('[useFeatures] Fetching features for plan_id:', planId);

  const { data, error } = await supabase
    .from('plan_features')
    .select('feature_key, feature_value, feature_type')
    .eq('plan_id', planId);

  if (error) throw error;

  // Convert array to key-value object
  const featuresObj: Record<string, string> = {};
  data?.forEach((f: Feature) => {
    featuresObj[f.feature_key] = f.feature_value;
  });

  console.log('[useFeatures] Fetched features:', featuresObj);
  return featuresObj;
};

export const useFeatures = (): UseFeatureReturn => {
  const queryClient = useQueryClient();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();

  const { data: features = {}, isLoading: featuresLoading } = useQuery({
    queryKey: ['features', subscription?.plan_id],
    queryFn: () => fetchFeatures(subscription!.plan_id!),
    enabled: !!subscription?.plan_id,
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 30 * 60 * 1000,   // 30 minutes - keep in cache
    refetchOnWindowFocus: false,
  });

  const isLoading = subscriptionLoading || (!!subscription?.plan_id && featuresLoading);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['features'] });
  }, [queryClient]);

  // Helper: Get feature value
  const getFeature = useCallback((key: string): string | null => {
    return features[key] || null;
  }, [features]);

  // Helper: Check if feature exists and is not false
  const hasFeature = useCallback((key: string): boolean => {
    const value = features[key];
    if (!value) return false;
    if (value === 'false') return false;
    return true;
  }, [features]);

  // Helper: Get number feature (returns number or 'unlimited')
  const getNumberFeature = useCallback((key: string): number | 'unlimited' => {
    const value = features[key];
    if (!value) return 0;
    if (value === 'unlimited') return 'unlimited';
    const num = parseInt(value, 10);
    return isNaN(num) ? 0 : num;
  }, [features]);

  // Helper: Get boolean feature
  const getBooleanFeature = useCallback((key: string): boolean => {
    const value = features[key];
    return value === 'true';
  }, [features]);

  // Helper: Check if user can create more apps
  const canCreateApp = useCallback(async (): Promise<boolean> => {
    const maxApps = getNumberFeature('max_apps');
    console.log('[useFeatures] canCreateApp - maxApps:', maxApps);
    
    if (maxApps === 'unlimited') {
      console.log('[useFeatures] canCreateApp - unlimited, returning true');
      return true;
    }
    if (maxApps === 0) {
      console.log('[useFeatures] canCreateApp - maxApps is 0, returning false');
      return false;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.log('[useFeatures] canCreateApp - no session, returning false');
        return false;
      }

      const { count, error } = await supabase
        .from('apps')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', session.user.id);

      if (error) throw error;

      const canCreate = (count || 0) < maxApps;
      console.log('[useFeatures] canCreateApp - count:', count, 'maxApps:', maxApps, 'canCreate:', canCreate);
      return canCreate;
    } catch (error) {
      console.error('Error checking app limit:', error);
      return false;
    }
  }, [getNumberFeature]);

  // Helper: Get remaining apps
  const getRemainingApps = useCallback(async (): Promise<number | 'unlimited'> => {
    const maxApps = getNumberFeature('max_apps');
    if (maxApps === 'unlimited') return 'unlimited';
    if (maxApps === 0) return 0;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return 0;

      const { count, error } = await supabase
        .from('apps')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', session.user.id);

      if (error) throw error;

      const remaining = maxApps - (count || 0);
      return remaining > 0 ? remaining : 0;
    } catch (error) {
      console.error('Error getting remaining apps:', error);
      return 0;
    }
  }, [getNumberFeature]);

  // Helper: Check if user can use AI
  const canUseAI = useCallback(async (): Promise<boolean> => {
    const maxAI = getNumberFeature('max_ai_generations');
    if (maxAI === 'unlimited') return true;
    if (maxAI === 0) return false;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return false;

      const { data, error } = await supabase
        .from('usage_tracking')
        .select('ai_generations_used')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const used = data?.ai_generations_used || 0;
      return used < maxAI;
    } catch (error) {
      console.error('Error checking AI limit:', error);
      return false;
    }
  }, [getNumberFeature]);

  // Helper: Get remaining AI generations
  const getRemainingAI = useCallback(async (): Promise<number | 'unlimited'> => {
    const maxAI = getNumberFeature('max_ai_generations');
    if (maxAI === 'unlimited') return 'unlimited';
    if (maxAI === 0) return 0;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return 0;

      const { data, error } = await supabase
        .from('usage_tracking')
        .select('ai_generations_used')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const used = data?.ai_generations_used || 0;
      const remaining = maxAI - used;
      return remaining > 0 ? remaining : 0;
    } catch (error) {
      console.error('Error getting remaining AI:', error);
      return 0;
    }
  }, [getNumberFeature]);

  // Helper: Get total credits from plan
  const getCredits = useCallback(async (): Promise<number | 'unlimited'> => {
    const creditsLimit = getNumberFeature('credits');
    if (creditsLimit === 'unlimited') return 'unlimited';
    return creditsLimit;
  }, [getNumberFeature]);

  // Helper: Get remaining credits
  const getRemainingCredits = useCallback(async (): Promise<number | 'unlimited'> => {
    const creditsLimit = getNumberFeature('credits');
    if (creditsLimit === 'unlimited') return 'unlimited';
    if (creditsLimit === 0) return 0;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return 0;

      const { data, error } = await supabase
        .from('usage_tracking')
        .select('credits')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // No usage record exists yet, return full credits
        return creditsLimit;
      }

      const remaining = data?.credits || 0;
      return remaining > 0 ? remaining : 0;
    } catch (error) {
      console.error('Error getting remaining credits:', error);
      return 0;
    }
  }, [getNumberFeature]);

  // Helper: Check if user can upload more files (storage limit)
  const canUploadStorage = useCallback(async (fileSizeBytes: number): Promise<boolean> => {
    const maxStorageMB = getNumberFeature('max_storage_mb');
    if (maxStorageMB === 'unlimited') return true;
    if (maxStorageMB === 0) return false;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return false;

      const { data, error } = await supabase.rpc('get_user_storage_bytes', { 
        _user_id: session.user.id 
      });
      
      if (error) throw error;

      const currentBytes = data || 0;
      const maxBytes = maxStorageMB * 1024 * 1024;
      return (currentBytes + fileSizeBytes) <= maxBytes;
    } catch (error) {
      console.error('Error checking storage limit:', error);
      return false;
    }
  }, [getNumberFeature]);

  // Helper: Get storage usage
  const getStorageUsage = useCallback(async (): Promise<{ usedMB: number; maxMB: number | 'unlimited' }> => {
    const maxStorageMB = getNumberFeature('max_storage_mb');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return { usedMB: 0, maxMB: maxStorageMB };

      const { data, error } = await supabase.rpc('get_user_storage_bytes', { 
        _user_id: session.user.id 
      });
      
      if (error) throw error;

      const usedMB = Math.round(((data || 0) / (1024 * 1024)) * 100) / 100;
      return { usedMB, maxMB: maxStorageMB };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return { usedMB: 0, maxMB: maxStorageMB };
    }
  }, [getNumberFeature]);

  return {
    features,
    isLoading,
    refresh,
    getFeature,
    hasFeature,
    getNumberFeature,
    getBooleanFeature,
    canCreateApp,
    getRemainingApps,
    canUseAI,
    getRemainingAI,
    getCredits,
    getRemainingCredits,
    canUploadStorage,
    getStorageUsage,
  };
};
