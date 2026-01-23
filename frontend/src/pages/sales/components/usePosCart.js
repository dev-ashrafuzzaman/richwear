import { useCallback, useMemo, useState } from "react";

const LOW_STOCK_THRESHOLD = 5;

export default function usePosCart() {
  const [cart, setCart] = useState([]);

  /* Add / Scan Item */
  const addItem = useCallback((item) => {
    setCart((prev) => {
      const found = prev.find(
        (i) => i.variantId === item.variantId
      );

      if (found) {
        return prev.map((i) =>
          i.variantId === item.variantId
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }

      return [
        ...prev,
        {
          variantId: item.variantId,
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          salePrice: item.salePrice,
          stockQty: item.qty,
          qty: 1,
        },
      ];
    });
  }, []);

  /* Qty Update */
  const updateQty = (variantId, qty) => {
    setCart((prev) =>
      prev.map((i) =>
        i.variantId === variantId
          ? { ...i, qty: Math.max(1, qty) }
          : i
      )
    );
  };

  /* Remove */
  const removeItem = (variantId) => {
    setCart((prev) =>
      prev.filter((i) => i.variantId !== variantId)
    );
  };

  /* Totals */
  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, i) => sum + i.qty * i.salePrice,
        0
      ),
    [cart]
  );

  /* Stock Warning */
  const isLowStock = (item) =>
    item.stockQty - item.qty <= LOW_STOCK_THRESHOLD;

  return {
    cart,
    addItem,
    updateQty,
    removeItem,
    subtotal,
    isLowStock,
  };
}
