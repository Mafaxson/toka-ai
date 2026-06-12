import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Wallet, ReceiptText } from "lucide-react";
import { getReportSummary } from "@/services/transaction-service";
import { formatMoney } from "@/lib/currencies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Period = "daily" | "weekly" | "monthly";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

const periodLabels: Record<Period, string> = {
  daily: "Today",
  weekly: "This week",
  monthly: "This month",
};

function ReportsPage() {
  const [period, setPeriod] = useState<Period>("daily");

  const { data, isLoading } = useQuery({
    queryKey: ["report", period],
    queryFn: () => getReportSummary(period),
  });

  const maxCategoryTotal = data?.byCategory[0]?.total ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Simple summaries of how your business is doing.
        </p>
      </div>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading || !data ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {periodLabels[period]} · since {format(new Date(data.periodStart), "d MMM yyyy")} ·{" "}
            {data.count} transaction{data.count === 1 ? "" : "s"}
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard
              label="Income"
              value={formatMoney(data.income, data.currency)}
              icon={<TrendingUp className="h-5 w-5 text-income" />}
              iconBg="bg-income-soft"
            />
            <SummaryCard
              label="Expenses"
              value={formatMoney(data.expenses, data.currency)}
              icon={<TrendingDown className="h-5 w-5 text-expense" />}
              iconBg="bg-expense-soft"
            />
            <SummaryCard
              label="Profit"
              value={formatMoney(data.profit, data.currency)}
              icon={<Wallet className="h-5 w-5 text-primary" />}
              iconBg="bg-accent"
            />
          </div>

          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Where the money went</CardTitle>
            </CardHeader>
            <CardContent>
              {data.byCategory.length === 0 ? (
                <div className="py-8 text-center">
                  <ReceiptText className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No transactions in this period yet. Tell TOKA about a sale or expense to see it
                    here.
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {data.byCategory.map((entry) => (
                    <li key={`${entry.type}-${entry.category}`}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {entry.category}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            ({entry.type})
                          </span>
                        </span>
                        <span
                          className={`font-semibold ${
                            entry.type === "income" ? "text-income" : "text-expense"
                          }`}
                        >
                          {formatMoney(entry.total, data.currency)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${
                            entry.type === "income" ? "bg-income" : "bg-expense"
                          }`}
                          style={{
                            width: `${maxCategoryTotal > 0 ? Math.max(4, (entry.total / maxCategoryTotal) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  iconBg,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <Card className="rounded-2xl shadow-soft">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="truncate font-display text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
