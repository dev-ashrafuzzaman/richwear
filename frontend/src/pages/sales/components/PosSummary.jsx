import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

export default function PosSummary({
  subtotal,
  billDiscount,
  setBillDiscount,
  grandTotal,
  onPay,
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
      <div className="mb-6 pb-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Order Summary</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review your purchase details
        </p>
      </div>

      <div className="space-y-4">
        {/* Subtotal */}
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-700 font-medium">Subtotal</span>
          <span className="text-base font-semibold text-gray-900">
            TK {subtotal}
          </span>
        </div>

        {/* Discount Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Bill Discount
          </label>
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={billDiscount}
            onChange={(e) => setBillDiscount(Number(e.target.value))}
            className="w-full text-base border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-100"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-700">
                Total Payable
              </div>
              {billDiscount > 0 && (
                <div className="text-xs text-green-600 mt-1">
                  Saved TK {billDiscount}
                </div>
              )}
            </div>
            <span className="text-xl font-bold text-green-600">
              TK {grandTotal}
            </span>
          </div>
        </div>

        {/* Payment Button */}
        <Button
        variant="gradient"
          className="w-full py-3"
          onClick={onPay}>
          <svg
            className="w-5 h-5 mr-2 inline"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
}
