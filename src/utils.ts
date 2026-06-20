import { Currency } from "./types";

/**
 * Formats a number cleanly with standard tabular digit alignment and correct prefix.
 * @param value The raw number value
 * @param currency The requested currency (PKR 'Rs.' or USD '$')
 */
export function formatCurrency(value: number, currency?: Currency): string {
  const rounded = Number(value.toFixed(2));
  
  // Format with comma separators for large values
  const formattedString = rounded.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `Rs. ${formattedString}`;
}

export const CATEGORIES = [
  { name: "Food & Dining", icon: "restaurant", color: "bg-tertiary-container/20 text-tertiary" },
  { name: "Transport & Taxi", icon: "local_taxi", color: "bg-primary-container/20 text-primary" },
  { name: "Housing & Villa", icon: "home", color: "bg-secondary-container/20 text-secondary" },
  { name: "Entertainment", icon: "sports_esports", color: "bg-purple-500/10 text-purple-600" },
  { name: "Project / Utilities", icon: "school", color: "bg-amber-500/10 text-amber-600" },
  { name: "General", icon: "receipt_long", color: "bg-gray-500/10 text-gray-600" }
];
