import { useCallback } from "react";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import useApi from "../../../hooks/useApi";
import usePosPayment from "./usePosPayment";
import AsyncSelectPos from "../../../components/ui/AsyncSelectPos";

export default function PosPaymentModal({
  open,
  totalAmount,
  onClose,
  onConfirm,
}) {
  const { request } = useApi();

  const {
    payments,
    addPayment,
    removePayment,
    updatePayment,
    paidAmount,
    remaining,
    changeAmount,
    isValid,
  } = usePosPayment(totalAmount);

  const loadPaymentMethods = useCallback(
    async (search) => {
      const res = await request(
        "/sales/payment-methods",
        "GET",
        {
          search,
          parentCode: "1002",
          limit: 10,
        },
        { useToast: false },
      );
      return res?.data?.map((m) => ({
        label: `${m.code} - ${m.name}`,
        value: m._id,
        method: m.name,
      }));
    },
    [request],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white w-full max-w-2xl rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Payment</h2>
              <p className="text-blue-100 mt-1">Complete the sale transaction</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-blue-500/30 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Payment Methods */}
          <div className="space-y-4">
            {payments.map((p, index) => (
              <div 
                key={index} 
                className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-50 rounded-lg border-2 border-gray-200"
              >
                <div className="col-span-4">
                  <AsyncSelectPos
                    loadOptions={loadPaymentMethods}
                    value={
                      p.accountId ? { value: p.accountId, label: p.method } : null
                    }
                    onChange={(opt) => {
                      updatePayment(index, "accountId", opt.value);
                      updatePayment(index, "method", opt.method);
                    }}
                    className="border-2 border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-200"
                  />
                </div>

                <div className="col-span-3">
                  <Input
                    type="number"
                    min={0}
                    placeholder="Amount"
                    value={p.amount}
                    onChange={(e) =>
                      updatePayment(index, "amount", Number(e.target.value))
                    }
                    className="border-2 border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-200 text-lg"
                  />
                </div>

                <div className="col-span-4">
                  <Input
                    placeholder="Reference"
                    value={p.reference}
                    onChange={(e) =>
                      updatePayment(index, "reference", e.target.value)
                    }
                    className="border-2 border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-200"
                  />
                </div>

                <div className="col-span-1">
                  {payments.length > 1 && (
                    <button
                      onClick={() => removePayment(index)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-red-100 text-gray-500 hover:text-red-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Payment Button */}
          <button
            onClick={addPayment}
            className="mt-4 flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Add Payment Method
          </button>

          {/* Summary */}
          <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-gray-50 rounded-xl border-2 border-gray-200">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Total Bill:</span>
                <span className="text-2xl font-bold text-gray-900">৳{totalAmount}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Paid Amount:</span>
                <span className="text-xl font-semibold text-green-600">৳{paidAmount}</span>
              </div>
              
              {remaining > 0 && (
                <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                  <span className="text-gray-700 font-medium">Due Amount:</span>
                  <span className="text-xl font-bold text-red-600">৳{remaining}</span>
                </div>
              )}
              
              {changeAmount > 0 && (
                <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                  <span className="text-gray-700 font-medium">Change:</span>
                  <span className="text-xl font-bold text-green-600">৳{changeAmount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            <Button 
              className="flex-1 py-4 text-lg font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              onClick={() => onConfirm(payments)}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Confirm Sale
            </Button>
            
            <Button 
              variant="secondary" 
              className="flex-1 py-4 text-lg border-2"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}