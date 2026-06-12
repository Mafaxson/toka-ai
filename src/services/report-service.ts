import { supabase } from "@/integrations/supabase/client";
import { requireAuthenticatedUser } from "./auth-service";

export async function listReports() {
  const user = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("reports")
    .select("id, user_id, report_type, content, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}

export async function createReport(reportType: string, content: string) {
  const user = await requireAuthenticatedUser();
  const { error } = await supabase.from("reports").insert({
    user_id: user.id,
    report_type: reportType,
    content,
  });
  if (error) throw error;
}
