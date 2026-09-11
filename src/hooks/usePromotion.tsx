import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Promotion {
  id: string;
  title: string;
  description: string;
  code: string | null;
  discount: string | null;
  expiry_date: string | null;
  theme_color: string;
  display_locations: string[];
}

export function usePromotion(location: "dashboard_banner" | "sidebar" | "pricing" | "upgrade") {
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    fetchPromotion();
  }, [location]);

  useEffect(() => {
    if (promotion) {
      const dismissed = localStorage.getItem(`promo-dismissed-${promotion.id}`);
      if (dismissed === "true") {
        setIsDismissed(true);
      }
    }
  }, [promotion]);

  const fetchPromotion = async () => {
    try {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .contains("display_locations", [location])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      // Check if expired
      if (data && data.expiry_date && new Date(data.expiry_date) < new Date()) {
        setPromotion(null);
      } else {
        setPromotion(data);
      }
    } catch (error) {
      console.error("Error fetching promotion:", error);
    } finally {
      setLoading(false);
    }
  };

  const dismiss = () => {
    if (promotion) {
      localStorage.setItem(`promo-dismissed-${promotion.id}`, "true");
      setIsDismissed(true);
    }
  };

  return {
    promotion: isDismissed ? null : promotion,
    loading,
    dismiss,
    expiryDate: promotion?.expiry_date ? new Date(promotion.expiry_date) : null,
  };
}
