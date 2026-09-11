import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseCreditsReturn {
  credits: number | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook to manage user credits with automatic monthly reset check.
 * Calling this hook triggers the database's credit reset logic if needed.
 */
export const useCredits = (): UseCreditsReturn => {
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCredits = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      // This RPC call triggers the monthly reset logic in the database
      // if more than a month has passed since last_reset_date
      const { data, error } = await supabase.rpc('get_user_credits', {
        _user_id: session.user.id
      });

      if (!error && data !== null) {
        setCredits(data);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  return {
    credits,
    isLoading,
    refresh: fetchCredits,
  };
};
