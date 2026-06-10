import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import {
  listTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/transactions.functions";
import { formatMoney } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  TransactionDialog,
  type TransactionFormValues,
} from "@/components/TransactionDialog";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<"transactions">;

export const Route = createFileRoute("/_authenticated/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listTransactions);
  const addFn = useServerFn(addTransaction);
  const updateFn = useServerFn(updateTransaction);
  const deleteFn = useServerFn(deleteTransaction);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => listFn(),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["report"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: TransactionFormValues) => {
      if (editing) {
        await updateFn({ data: { ...values, id: editing.id } });
      } else {
        await addFn({ data: values });
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Transaction updated" : "Transaction added");
      setDialogOpen(false);
      setEditing(null);
      invalidateAll();
    },
    onError: () => toast.error("Could not save the transaction. Please try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Transaction deleted");
      setDeleting(null);
      invalidateAll();
    },
    onError: () => toast.error("Could not delete the transaction. Please try again."),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Everything TOKA has recorded for your business.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add transaction
        </Button>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : !data || data.transactions.length === 0 ? (
            <div className="py-14 text-center">
              <p className="font-medium">No transactions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add one manually or just tell TOKA what you sold or spent.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.transactions.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3">
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
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.category}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {format(new Date(t.occurred_at), "d MMM yyyy")}
                      {t.description ? ` · ${t.description}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${
                      t.type === "income" ? "text-income" : "text-expense"
                    }`}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {formatMoney(Number(t.amount), data.currency)}
                  </span>
                  <div className="flex shrink-0 items-center">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit transaction"
                      onClick={() => {
                        setEditing(t);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete transaction"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleting(t)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? "Edit transaction" : "Add transaction"}
        initial={
          editing
            ? {
                type: editing.type as "income" | "expense",
                amount: Number(editing.amount),
                category: editing.category,
                description: editing.description,
                occurred_at: editing.occurred_at,
              }
            : null
        }
        onSubmit={(values) => saveMutation.mutate(values)}
        submitting={saveMutation.isPending}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `${deleting.category} — this will permanently remove it from your records.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
