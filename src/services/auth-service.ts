import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type SignUpInput = {
  email: string;
  password: string;
  fullName: string;
  businessName: string;
  preferredLanguage: string;
  currency: string;
};

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signUp(input: SignUpInput) {
  return supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`,
      data: {
        full_name: input.fullName.trim(),
        business_name: input.businessName.trim(),
        preferred_language: input.preferredLanguage,
        currency: input.currency,
      },
    },
  });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function sendPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
}

export async function updatePassword(password: string) {
  return supabase.auth.updateUser({ password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function requireAuthenticatedUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
