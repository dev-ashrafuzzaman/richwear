export default function PurchaseSummaryBar({ totalAmount, dueAmount }) {
  return (
    <div className="sticky bottom-0 bg-white border-t p-4 flex justify-between items-center">
      <div className="text-sm">
        <div>Total: <b>{totalAmount.toFixed(2)}</b></div>
        <div>Due: <b>{dueAmount.toFixed(2)}</b></div>
      </div>

      <button
        type="submit"
        className="px-6 py-2 bg-blue-600 text-white rounded-md"
      >
        Create Purchase
      </button>
    </div>
  );
}
