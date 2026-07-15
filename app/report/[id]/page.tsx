"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import ReportView, { type ReportAnalysis } from "@/components/ReportView";
import { supabase } from "@/lib/supabase";

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<
    ReportAnalysis | null | undefined
  >(undefined);

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      setAnalysis(undefined);

      const id = params?.id;
      if (!id) {
        setAnalysis(null);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace(
          `/login?next=${encodeURIComponent(`/report/${id}`)}`
        );
        return;
      }

      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (error || !data) {
        console.error("Failed to load analysis:", error);
        setAnalysis(null);
        return;
      }

      setAnalysis(data as ReportAnalysis);
    }

    void loadReport();

    return () => {
      cancelled = true;
    };
  }, [params?.id, router]);

  return (
    <ReportView
      analysis={analysis ?? null}
      loading={analysis === undefined}
    />
  );
}
