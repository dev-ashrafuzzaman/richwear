import { useCallback,  useMemo, useState } from "react";

const EMPTY_ROW = {
  method: "",
  accountId: "",
  option: null, // 🔥 store SmartSelect option
  amount: 0,
  reference: "",
  manualClear: false,
};

export default function usePosPayment(totalAmount) {
  const [payments, setPayments] = useState([EMPTY_ROW]);
  const resetPayment = () => {
    setPayments([EMPTY_ROW]);
  };

  const paidAmount = useMemo(
    () =>
      payments.reduce(
        (s, p) => s + Math.max(Number(p.amount) || 0, 0),
        0
      ),
    [payments]
  );

  const remaining = Math.max(totalAmount - paidAmount, 0);
  const changeAmount = Math.max(paidAmount - totalAmount, 0);

  const addPayment = useCallback(() => {
    setPayments((prev) => [
      ...prev,
      {
        ...EMPTY_ROW,
        amount: Math.max(
          totalAmount -
            prev.reduce((s, p) => s + (Number(p.amount) || 0), 0),
          0
        ),
      },
    ]);
  }, [totalAmount]);

  const removePayment = useCallback((index) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const markManualClear = useCallback((index) => {
    setPayments((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, manualClear: true } : p
      )
    );
  }, []);

  const clearManualClear = useCallback((index) => {
    setPayments((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, manualClear: false } : p
      )
    );
  }, []);

  const updatePayment = useCallback((index, field, value) => {
    setPayments((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;

        if (
          field === "accountId" &&
          prev.some((x, idx) => idx !== index && x.accountId === value)
        ) {
          return p;
        }

        if (field === "amount") {
          value = Math.max(Number(value) || 0, 0);
        }

        return { ...p, [field]: value };
      })
    );
  }, []);

  const isValid = useMemo(() => {
    if (!payments.length) return false;
    if (paidAmount < totalAmount) return false;

    return payments.every(
      (p) => p.accountId && p.method && p.amount >= 0
    );
  }, [payments, paidAmount, totalAmount]);

  return {
    payments,
    addPayment,
    removePayment,
    updatePayment,
    paidAmount,
    remaining,
    changeAmount,
    isValid,
    markManualClear,
    clearManualClear,
    resetPayment,
  };
}
