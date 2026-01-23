import Button from "../../../components/ui/Button";

export default function PosSummary({ subtotal, onPay }) {
  return (
    <div className="border rounded-lg p-4 sticky top-6">
      <h2 className="text-lg font-semibold mb-4">
        Summary
      </h2>

      <div className="flex justify-between mb-2">
        <span>Subtotal</span>
        <span>৳{subtotal}</span>
      </div>

      <hr className="my-3" />

      <Button className="w-full" onClick={onPay}>
        Proceed to Payment
      </Button>
    </div>
  );
}
