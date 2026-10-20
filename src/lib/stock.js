// Stock helpers for merch items.
// quantity_available = total stock; size_stock = optional per-size counts,
// e.g. { S: 10, M: 0 }. Sizes missing from size_stock fall back to the total.

export function stockLeft(item, size) {
  const total = Math.max(0, item?.quantity_available ?? 0);
  const bySize = item?.size_stock || {};
  if (size && Object.prototype.hasOwnProperty.call(bySize, size)) {
    return Math.max(0, Math.min(total, bySize[size]));
  }
  return total;
}

export function isSoldOut(item) {
  return stockLeft(item) <= 0;
}

// Show an "Only N left" nudge at or below this many
export const LOW_STOCK_THRESHOLD = 5;
