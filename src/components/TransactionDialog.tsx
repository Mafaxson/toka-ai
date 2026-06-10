import { useEffect, useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface TransactionFormValues {
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string | null;
  occurred_at: string;
}

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initial?: Partial<TransactionFormValues> | null;
  onSubmit: (values: TransactionFormValues) => void;
  submitting: boolean;
}

export function TransactionDialog({
  open,
  onOpenChange,
  title,
  initial,
  onSubmit,
  submitting,
}: TransactionDialogProps) {
  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    if (!open) return;
    setType(initial?.type ?? "income");
    setAmount(initial?.amount != null ? String(initial.amount) : "");
    setCategory(initial?.category ?? "");
    setDescription(initial?.description ?? "");
    setDate(
      initial?.occurred_at
        ? format(new Date(initial.occurred_at), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
    );
  }, [open, initial]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    onSubmit({
      type,
      amount: parsedAmount,
      category: category.trim() || "Other",
      description: description.trim() || null,
      occurred_at: new Date(`${date}T12:00:00`).toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tx-amount">Amount</Label>
              <Input
                id="tx-amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tx-category">Category</Label>
            <Input
              id="tx-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Sales, Stock, Transport…"
              required
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tx-description">Note (optional)</Label>
            <Textarea
              id="tx-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tx-date">Date</Label>
            <Input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
