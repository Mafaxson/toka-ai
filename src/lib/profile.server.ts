import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Claims = Record<string, unknown> & {
  user_metadata?: Record<string, unknown>;
};

/**
 * Ensures a profile row exists for the authenticated user.
 * Creates one from the signup metadata (name, business, currency) when missing.
 */
export async function ensureProfileRow(
  supabase: SupabaseClient<Database>,
  userId: string,
  claims: Claims,
) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (existing) return existing;

  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const insert = {
    id: userId,
    full_name: typeof meta.full_name === "string" ? meta.full_name : null,
    business_name: typeof meta.business_name === "string" ? meta.business_name : null,
    currency: typeof meta.currency === "string" && meta.currency ? meta.currency : "USD",
  };

  const { data, error } = await supabase.from("profiles").insert(insert).select().single();

  if (error) {
    // Possible race with a concurrent request — re-read before failing.
    const { data: again } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (again) return again;
    throw new Error(`Could not load profile: ${error.message}`);
  }

  return data;
}
