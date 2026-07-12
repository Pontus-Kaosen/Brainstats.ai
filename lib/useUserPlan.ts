"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type UserPlan = "free" | "pro" | "elite";

type UseUserPlanResult = {
  plan: UserPlan;
  loading: boolean;
  userId: string | null;
  email: string | null;
  isPremium: boolean;
  isElite: boolean;
  refreshPlan: () => Promise<void>;
};

export function useUserPlan(): UseUserPlanResult {
  const [plan, setPlan] = useState<UserPlan>("free");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  async function loadPlan() {
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setPlan("free");
        setUserId(null);
        setEmail(null);
        return;
      }

      setUserId(user.id);
      setEmail(user.email || null);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Kunde inte hämta användarplan:", profileError);
        setPlan("free");
        return;
      }

      const profilePlan = profile?.plan;

      if (
        profilePlan === "pro" ||
        profilePlan === "elite" ||
        profilePlan === "free"
      ) {
        setPlan(profilePlan);
      } else {
        setPlan("free");
      }
    } catch (error) {
      console.error("Fel när användarplanen hämtades:", error);
      setPlan("free");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlan();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadPlan();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    plan,
    loading,
    userId,
    email,
    isPremium: plan === "pro" || plan === "elite",
    isElite: plan === "elite",
    refreshPlan: loadPlan,
  };
}