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
    <div className="border-2 border-gray-300 rounded-xl p-5 bg-white shadow-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">Order Summary</h2>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-medium">Subtotal</span>
          <span className="text-lg font-semibold text-gray-900">৳{subtotal}</span>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Bill Discount</label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={billDiscount}
              onChange={(e) => setBillDiscount(Number(e.target.value))}
              className="flex-1 border-2 border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-200 text-lg"
            />
            <span className="px-4 py-2 bg-gray-100 border-2 border-gray-300 rounded-lg font-medium text-gray-700">
              ৳
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-300">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total Payable</span>
            <span className="text-2xl font-bold text-blue-700">৳{grandTotal}</span>
          </div>
        </div>

        <Button 
          className="w-full py-4 mt-4 text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
          onClick={onPay}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
}