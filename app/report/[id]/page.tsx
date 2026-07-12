import { createClient } from "@supabase/supabase-js";
import ReportView from "@/components/ReportView";

export const dynamic = "force-dynamic";

type ReportProps = {
  params: Promise<{
    id: string;
  }>;
};

function createServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export default async function ReportPage({ params }: ReportProps) {
  const { id } = await params;

  const supabase = createServerSupabase();

  const { data: analysis, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !analysis) {
    return <ReportView analysis={null} />;
  }

  return <ReportView analysis={analysis} />;
}
