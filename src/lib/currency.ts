/**
 * Currency & Financial calculation helpers for Toto Elite Mart
 * Currency: Bangladeshi Taka (BDT, ৳)
 * Designed to prevent floating-point inaccuracies by computing in integer paisa (minor units)
 * where 1 BDT = 100 Paisa.
 */

export const CURRENCY_CODE = 'BDT';
export const CURRENCY_SYMBOL = '৳';

/**
 * Converts a decimal amount (e.g. 1500.50) to integer paisa (minor units: 150050)
 */
export function toPaisa(amount: number | string): number {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numeric)) return 0;
  return Math.round(numeric * 100);
}

/**
 * Converts integer paisa (minor units: 150050) back to formatted decimal string (1500.50)
 */
export function fromPaisa(paisa: number): number {
  return Math.round(paisa) / 100;
}

/**
 * Formats a monetary number in standard Bangladeshi formatting
 * e.g., formatBDT(12500) => "৳12,500"
 */
export function formatBDT(amount: number | string | null | undefined, showSymbol = true): string {
  if (amount === null || amount === undefined) {
    return showSymbol ? `${CURRENCY_SYMBOL}0` : '0';
  }
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return showSymbol ? `${CURRENCY_SYMBOL}0` : '0';

  // Format with commas according to Bangladesh/Indian numbering (or international standard)
  const formatted = new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);

  return showSymbol ? `${CURRENCY_SYMBOL}${formatted}` : formatted;
}

/**
 * Accurately calculate order subtotal, discount, delivery, and total using integer math
 */
export function calculateOrderTotals(params: {
  items: Array<{ unitPrice: number | string; quantity: number }>;
  discountAmount?: number | string;
  deliveryFee?: number | string;
}) {
  const subtotalPaisa = params.items.reduce((sum, item) => {
    const itemUnitPricePaisa = toPaisa(item.unitPrice);
    return sum + itemUnitPricePaisa * Math.max(0, item.quantity);
  }, 0);

  const discountPaisa = Math.min(subtotalPaisa, toPaisa(params.discountAmount || 0));
  const deliveryPaisa = toPaisa(params.deliveryFee || 0);
  const totalPaisa = Math.max(0, subtotalPaisa - discountPaisa + deliveryPaisa);

  return {
    subtotal: fromPaisa(subtotalPaisa),
    discount: fromPaisa(discountPaisa),
    deliveryFee: fromPaisa(deliveryPaisa),
    totalAmount: fromPaisa(totalPaisa),
    // Minor units for storage or verification
    subtotalPaisa,
    discountPaisa,
    deliveryPaisa,
    totalPaisa,
  };
}
