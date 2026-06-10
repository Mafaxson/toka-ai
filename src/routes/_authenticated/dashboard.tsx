import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Wallet, MessagesSquare, ArrowRight } from "lucide-react";
import { getDashboard } from "@/lib/transactions.functions";
import { formatMoney } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const getDashboardFn = useServerFn(getDashboard);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardFn(),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {data?.businessName ? data.businessName : "Your business"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "MMMM yyyy")} overview
          </p>
        </div>
        <Button asChild>
          <Link to="/chat">
            <MessagesSquare className="h-4 w-4" /> Talk to TOKA
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {isLoading || !data ? (
          <>
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </>
        ) : (
          <>
            <StatCard
              label="Total Revenue"
              value={formatMoney(data.monthIncome, data.currency)}
              icon={<TrendingUp className="h-5 w-5 text-income" />}
              iconBg="bg-income-soft"
            />
            <StatCard
              label="Total Expenses"
              value={formatMoney(data.monthExpenses, data.currency)}
              icon={<TrendingDown className="h-5 w-5 text-expense" />}
              iconBg="bg-expense-soft"
            />
            <StatCard
              label="Estimated Profit"
              value={formatMoney(data.monthProfit, data.currency)}
              icon={<Wallet className="h-5 w-5 text-primary" />}
              iconBg="bg-accent"
              highlight
            />
          </>
        )}
      </div>

      {/* Recent transactions */}
      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/transactions">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : !data || data.recent.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-medium">No transactions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tell TOKA about your first sale — try “I sold rice today for 1000”.
              </p>
              <Button className="mt-4" asChild>
                <Link to="/chat">Start a conversation</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.recent.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        t.type === "income" ? "bg-income-soft" : "bg-expense-soft"
                      }`}
                    >
                      {t.type === "income" ? (
                        <TrendingUp className="h-4 w-4 text-income" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-expense" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.category}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.description || format(new Date(t.occurred_at), "d MMM, h:mm a")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${
                      t.type === "income" ? "text-income" : "text-expense"
                    }`}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {formatMoney(Number(t.amount), data.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  highlight?: boolean;
}) {
  return (
    <Card className={`rounded-2xl shadow-soft ${highlight ? "border-primary/30" : ""}`}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="truncate font-display text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
