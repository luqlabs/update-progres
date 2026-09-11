import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_TIME = 60 * 1000; // 1 minute minimum between updates

export const useLastSeen = () => {
  const lastUpdateRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateLastSeen = async () => {
    const now = Date.now();
    
    // Debounce: don't update if we updated recently
    if (now - lastUpdateRef.current < DEBOUNCE_TIME) {
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', user.id);
      
      lastUpdateRef.current = now;
    } catch (error) {
      console.error('Failed to update last_seen:', error);
    }
  };

  useEffect(() => {
    // Initial update on mount
    updateLastSeen();

    // Set up periodic updates
    intervalRef.current = setInterval(updateLastSeen, UPDATE_INTERVAL);

    // Update when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateLastSeen();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};
