import { useCallback, useMemo, useState } from "react";

const LOW_STOCK_THRESHOLD = 5;

export default function usePosCart() {
  const [cart, setCart] = useState([]);
  const [billDiscount, setBillDiscount] = useState(0);

  /* ---------------- Add Item ---------------- */
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
          productId: item.productId,
          variantId: item.variantId,
          sku: item.sku,
          name: item.name,
          salePrice: item.salePrice,
          stockQty: item.qty,
          qty: 1,
          discountType: null,     // FIXED | PERCENT
          discountValue: 0,
        },
      ];
    });
  }, []);

  /* ---------------- Update Qty ---------------- */
  const updateQty = (variantId, qty) => {
    setCart((prev) =>
      prev.map((i) =>
        i.variantId === variantId
          ? { ...i, qty: Math.max(1, qty) }
          : i
      )
    );
  };

  /* ---------------- Update Discount ---------------- */
const updateDiscount = (variantId, field, value) => {
  setCart((prev) =>
    prev.map((i) => {
      if (i.variantId !== variantId) return i;

      if (field === "discountType") {
        return {
          ...i,
          discountType: value,
          discountValue: 0,
        };
      }

      return {
        ...i,
        [field]: Math.max(Number(value) || 0, 0),
      };
    })
  );
};

  /* ---------------- Remove Item ---------------- */
  const removeItem = (variantId) => {
    setCart((prev) =>
      prev.filter((i) => i.variantId !== variantId)
    );
  };

  /* ---------------- Subtotal (Item Discount Applied) ---------------- */
  const subtotal = useMemo(() => {
    return cart.reduce((sum, i) => {
      let lineTotal = i.qty * i.salePrice;

      if (i.discountType === "FIXED") {
        lineTotal -= i.discountValue;
      }

      if (i.discountType === "PERCENT") {
        lineTotal -= (lineTotal * i.discountValue) / 100;
      }

      return sum + Math.max(lineTotal, 0);
    }, 0);
  }, [cart]);

  /* ---------------- Grand Total ---------------- */
  const grandTotal = Math.max(subtotal - billDiscount, 0);

  /* ---------------- Stock Warning ---------------- */
  const isLowStock = (item) =>
    item.stockQty - item.qty <= LOW_STOCK_THRESHOLD;

  return {
    cart,
    addItem,
    updateQty,
    updateDiscount,
    removeItem,
    subtotal,
    billDiscount,
    setBillDiscount,
    grandTotal,
    isLowStock,
  };
}
