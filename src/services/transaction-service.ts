import { startOfDay, startOfMonth, startOfWeek } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import { requireAuthenticatedUser } from "./auth-service";

export type TransactionInput = {
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string | null;
  transactionDate: string;
};

export async function getProfile() {
  const user = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, business_name, preferred_language, currency, created_at")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDashboardSummary() {
  const user = await requireAuthenticatedUser();
  const [profile, transactionsRes] = await Promise.all([
    getProfile(),
    supabase
      .from("transactions")
      .select("id, type, amount, category, description, transaction_date, created_at")
      .eq("user_id", user.id)
      .gte("transaction_date", startOfMonth(new Date()).toISOString())
      .order("transaction_date", { ascending: false })
      .limit(8),
  ]);

  if (transactionsRes.error) throw transactionsRes.error;

  let income = 0;
  let expenses = 0;
  for (const transaction of transactionsRes.data) {
    const amount = Number(transaction.amount);
    if (transaction.type === "income") income += amount;
    else expenses += amount;
  }

  return {
    currency: profile?.currency ?? "USD",
    businessName: profile?.business_name ?? "Your business",
    fullName: profile?.full_name ?? null,
    monthIncome: income,
    monthExpenses: expenses,
    monthProfit: income - expenses,
    recent: transactionsRes.data,
  };
}

export async function listTransactions() {
  const user = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("transactions")
    .select("id, user_id, type, amount, category, description, transaction_date, created_at")
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false })
    .limit(500);
  if (error) throw error;
  return data;
}

export async function createTransaction(input: TransactionInput) {
  const user = await requireAuthenticatedUser();
  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    type: input.type,
    amount: input.amount,
    category: input.category,
    description: input.description,
    transaction_date: input.transactionDate,
  });
  if (error) throw error;
}

export async function editTransaction(id: string, input: TransactionInput) {
  const user = await requireAuthenticatedUser();
  const { error } = await supabase
    .from("transactions")
    .update({
      type: input.type,
      amount: input.amount,
      category: input.category,
      description: input.description,
      transaction_date: input.transactionDate,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
}

export async function removeTransaction(id: string) {
  const user = await requireAuthenticatedUser();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
}

export async function getReportSummary(period: "daily" | "weekly" | "monthly") {
  const user = await requireAuthenticatedUser();
  const now = new Date();
  const start =
    period === "daily"
      ? startOfDay(now)
      : period === "weekly"
        ? startOfWeek(now, { weekStartsOn: 1 })
        : startOfMonth(now);

  const { data, error } = await supabase
    .from("transactions")
    .select("id, type, amount, category, description, transaction_date, created_at")
    .eq("user_id", user.id)
    .gte("transaction_date", start.toISOString())
    .order("transaction_date", { ascending: false })
    .limit(1000);
  if (error) throw error;

  let income = 0;
  let expenses = 0;
  const byCategory = new Map<string, { category: string; type: string; total: number }>();

  for (const transaction of data) {
    const amount = Number(transaction.amount);
    if (transaction.type === "income") income += amount;
    else expenses += amount;

    const key = `${transaction.type}:${transaction.category}`;
    const entry = byCategory.get(key) ?? {
      category: transaction.category,
      type: transaction.type,
      total: 0,
    };
    entry.total += amount;
    byCategory.set(key, entry);
  }

  return {
    currency: (await getProfile())?.currency ?? "USD",
    periodStart: start.toISOString(),
    income,
    expenses,
    profit: income - expenses,
    count: data.length,
    byCategory: [...byCategory.values()].sort((a, b) => b.total - a.total),
    transactions: data.slice(0, 50),
  };
}
