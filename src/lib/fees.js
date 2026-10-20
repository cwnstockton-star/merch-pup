// Fan-paid service fee: 5% of the merch subtotal + $0.50, added at checkout.
// The real charge is calculated on the server — keep these in sync with
// SERVICE_FEE_* in supabase/functions/create-checkout-session/index.ts.
export const SERVICE_FEE_PERCENT = 0.05;
export const SERVICE_FEE_FLAT = 0.5;

export function serviceFeeFor(subtotal) {
  if (subtotal <= 0) return 0;
  // match the server: round the percentage to whole cents, then add the flat part
  return Math.round(subtotal * SERVICE_FEE_PERCENT * 100) / 100 + SERVICE_FEE_FLAT;
}
