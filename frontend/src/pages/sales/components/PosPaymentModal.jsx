import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SmartSelect from "../../../components/common/SmartSelect";
import usePosPayment from "./usePosPayment";

/**
 * Props:
 * - open: boolean
 * - totalAmount: number
 * - defaultCashAccount: { accountId, method }
 * - onClose: fn
 * - onConfirm: fn(payments[])
 */
export default function PosPaymentModal({
  open,
  totalAmount,
  defaultCashAccount,
  onClose,
  onConfirm,
}) {
  const {
    payments,
    addPayment,
    removePayment,
    updatePayment,
    paidAmount,
    remaining,
    changeAmount,
    isValid,
  } = usePosPayment(totalAmount, defaultCashAccount);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-140 p-5 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">
          Payment
        </h2>

        {/* ---------------- Payment Rows ---------------- */}
        <div className="space-y-3">
          {payments.map((p, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 items-center"
            >
              {/* Method */}
              <div className="col-span-4">
                <SmartSelect
                  customRoute="/sales/payment-methods"
                  extraParams={{ parentCode: "1002" }} // BANK / CASH group
                  displayField={["code", "name"]}
                  idField="_id"
                  placeholder="Method"
                  barcode={false}
                  value={
                    p.accountId
                      ? {
                          value: p.accountId,
                          label: p.method || "Cash",
                        }
                      : null
                  }
                  onChange={(opt) => {
                    updatePayment(
                      index,
                      "method",
                      opt?.raw?.subType || ""
                    );
                    updatePayment(
                      index,
                      "accountId",
                      opt?.value || ""
                    );
                  }}
                />
              </div>

              {/* Amount */}
              <div className="col-span-3">
                <Input
                  type="number"
                  min={0}
                  placeholder="Amount"
                  value={p.amount}
                  onChange={(e) =>
                    updatePayment(
                      index,
                      "amount",
                      Number(e.target.value)
                    )
                  }
                />
              </div>

              {/* Reference */}
              <div className="col-span-4">
                <Input
                  placeholder="Reference"
                  value={p.reference}
                  onChange={(e) =>
                    updatePayment(
                      index,
                      "reference",
                      e.target.value
                    )
                  }
                />
              </div>

              {/* Remove */}
              <div className="col-span-1 text-center">
                {payments.length > 1 && (
                  <button
                    onClick={() => removePayment(index)}
                    className="text-red-500"
                    title="Remove"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ---------------- Add Payment ---------------- */}
        <button
          onClick={addPayment}
          className="text-sm text-blue-600 mt-3"
        >
          + Add payment method
        </button>

        {/* ---------------- Summary ---------------- */}
        <div className="mt-5 text-sm space-y-1">
          <div className="flex justify-between">
            <span>Total Bill</span>
            <span>৳{totalAmount}</span>
          </div>

          <div className="flex justify-between">
            <span>Paid</span>
            <span>৳{paidAmount}</span>
          </div>

          {remaining > 0 && (
            <div className="flex justify-between font-medium text-red-600">
              <span>Remaining</span>
              <span>৳{remaining}</span>
            </div>
          )}

          {changeAmount > 0 && (
            <div className="flex justify-between font-medium text-green-600">
              <span>Change</span>
              <span>৳{changeAmount}</span>
            </div>
          )}
        </div>

        {/* ---------------- Actions ---------------- */}
        <div className="mt-6 flex gap-2">
          <Button
            className="w-full"
            disabled={!isValid}
            onClick={() => onConfirm(payments)}
          >
            Confirm Sale
          </Button>

          <Button
            variant="secondary"
            className="w-full"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
