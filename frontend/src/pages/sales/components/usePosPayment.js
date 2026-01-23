import { useCallback, useEffect, useMemo, useState } from "react";

const EMPTY_ROW = {
  method: "",
  accountId: "",
  amount: 0,
  reference: "",
};

export default function usePosPayment(
  totalAmount,
  defaultCashAccount // { accountId, method }
) {
  const [payments, setPayments] = useState([EMPTY_ROW]);

  /* ------------------------------------------------
   * Default Cash Auto Select
   * ------------------------------------------------ */
  useEffect(() => {
    if (!defaultCashAccount) return;

    setPayments([
      {
        ...EMPTY_ROW,
        method: defaultCashAccount.method || "CASH",
        accountId: defaultCashAccount.accountId,
        amount: totalAmount,
      },
    ]);
  }, [defaultCashAccount, totalAmount]);

  /* ------------------------------------------------
   * Paid & Change
   * ------------------------------------------------ */
  const paidAmount = useMemo(
    () =>
      payments.reduce(
        (sum, p) => sum + Math.max(Number(p.amount) || 0, 0),
        0
      ),
    [payments]
  );

  const changeAmount = Math.max(paidAmount - totalAmount, 0);
  const remaining = Math.max(totalAmount - paidAmount, 0);

  /* ------------------------------------------------
   * Add Payment (remaining auto-fill)
   * ------------------------------------------------ */
  const addPayment = useCallback(() => {
    setPayments((prev) => [
      ...prev,
      {
        ...EMPTY_ROW,
        amount: Math.max(
          totalAmount -
            prev.reduce(
              (s, p) => s + (Number(p.amount) || 0),
              0
            ),
          0
        ),
      },
    ]);
  }, [totalAmount]);

  /* ------------------------------------------------
   * Remove Payment
   * ------------------------------------------------ */
  const removePayment = useCallback((index) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /* ------------------------------------------------
   * Update Payment (safe)
   * ------------------------------------------------ */
  const updatePayment = useCallback(
    (index, field, value) => {
      setPayments((prev) =>
        prev.map((p, i) => {
          if (i !== index) return p;

          // prevent duplicate account
          if (
            field === "accountId" &&
            prev.some(
              (x, idx) =>
                idx !== index && x.accountId === value
            )
          ) {
            return p;
          }

          if (field === "amount") {
            value = Math.max(Number(value) || 0, 0);
          }

          return { ...p, [field]: value };
        })
      );
    },
    []
  );

  /* ------------------------------------------------
   * FINAL VALIDATION (NO DUE ALLOWED)
   * ------------------------------------------------ */
  const isValid = useMemo(() => {
    if (remaining > 0) return false; // ❌ no due

    return payments.every(
      (p) =>
        p.accountId &&
        p.method &&
        Number(p.amount) >= 0
    );
  }, [payments, remaining]);

  return {
    payments,
    addPayment,
    removePayment,
    updatePayment,
    paidAmount,
    remaining,
    changeAmount, // 🔥 NEW
    isValid,
  };
}
