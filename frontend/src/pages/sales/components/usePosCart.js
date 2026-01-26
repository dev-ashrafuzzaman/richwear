import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

const LOW_STOCK_THRESHOLD = 3;

export default function usePosCart() {
  const [cart, setCart] = useState([]);
  const [billDiscount, setBillDiscount] = useState(0);
  const resetCart = () => {
    setCart([]);
    setBillDiscount(0);
  };
  /* ---------------- Add Item (SCAN / SELECT) ---------------- */
  const addItem = useCallback((item) => {
    setCart((prev) => {
      const found = prev.find(
        (i) => i.variantId === item.variantId
      );

      // 🔁 Same SKU scanned again
      if (found) {
        if (found.qty + 1 > found.stockQty) {
          toast.error(
            `Only ${found.stockQty} item(s) available`
          );
          return prev;
        }

        return prev.map((i) =>
          i.variantId === item.variantId
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }

      // ➕ New item
      return [
        ...prev,
        {
          productId: item.productId,
          variantId: item.variantId,
          sku: item.sku,
          productName: item.productName, // ✅ match backend
          salePrice: item.salePrice,
          stockQty: item.qty,            // 🔥 freeze stock
          qty: 1,

          discountType: null,             // FIXED | PERCENT
          discountValue: 0,
        },
      ];
    });
  }, []);

  /* ---------------- Update Qty ---------------- */
  const updateQty = useCallback((variantId, nextQty) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.variantId !== variantId) return i;

        let qty = Math.max(1, Number(nextQty) || 1);

        if (qty > i.stockQty) {
          toast.error(
            `Only ${i.stockQty} item(s) available`
          );
          qty = i.stockQty;
        }

        return { ...i, qty };
      })
    );
  }, []);

  /* ---------------- Update Discount ---------------- */
  const updateDiscount = useCallback((variantId, field, value) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.variantId !== variantId) return i;

        if (field === "discountType") {
          return {
            ...i,
            discountType: value || null,
            discountValue: 0,
          };
        }

        return {
          ...i,
          discountValue: Math.max(Number(value) || 0, 0),
        };
      })
    );
  }, []);

  /* ---------------- Remove Item ---------------- */
  const removeItem = useCallback((variantId) => {
    setCart((prev) =>
      prev.filter((i) => i.variantId !== variantId)
    );
  }, []);

  /* ---------------- Subtotal ---------------- */
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

  /* ---------------- Low Stock ---------------- */
  const isLowStock = useCallback(
    (item) =>
      item.stockQty - item.qty <= LOW_STOCK_THRESHOLD,
    []
  );

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
    resetCart
  };
}
