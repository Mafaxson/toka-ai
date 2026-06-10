export const CURRENCIES = [
  { code: "USD", label: "US Dollar ($)" },
  { code: "SLE", label: "Sierra Leonean Leone (Le)" },
  { code: "NGN", label: "Nigerian Naira (₦)" },
  { code: "GHS", label: "Ghanaian Cedi (₵)" },
  { code: "KES", label: "Kenyan Shilling (KSh)" },
  { code: "TZS", label: "Tanzanian Shilling (TSh)" },
  { code: "UGX", label: "Ugandan Shilling (USh)" },
  { code: "ZAR", label: "South African Rand (R)" },
  { code: "XOF", label: "West African CFA Franc" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "INR", label: "Indian Rupee (₹)" },
] as const;

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en")}`;
  }
}
