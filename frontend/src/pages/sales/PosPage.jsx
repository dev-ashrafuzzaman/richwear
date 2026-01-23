import { useState } from "react";
import usePosCart from "./components/usePosCart";
import PosItemSearch from "./components/PosItemSearch";
import PosCart from "./components/PosCart";
import PosSummary from "./components/PosSummary";
import PosCustomerSelect from "./components/PosCustomerSelect";
import PosSalesmanSelect from "./components/PosSalesmanSelect";
import PosPaymentModal from "./components/PosPaymentModal";

export default function PosPage() {
  const { cart, addItem, updateQty, removeItem, subtotal, isLowStock } =
    usePosCart();

  const [customer, setCustomer] = useState(null);
  const [salesman, setSalesman] = useState(null);
  const [payOpen, setPayOpen] = useState(false);

  return (
    <div className="p-6 grid grid-cols-12 gap-6">
      {/* LEFT */}
      <div className="col-span-7 space-y-4">
        <PosItemSearch onSelect={addItem} />
        <PosCart
          cart={cart}
          updateQty={updateQty}
          removeItem={removeItem}
          isLowStock={isLowStock}
        />
      </div>

      {/* RIGHT */}
      <div className="col-span-5 space-y-4">
        <PosCustomerSelect value={customer} onChange={setCustomer} />
        <PosSalesmanSelect value={salesman} onChange={setSalesman} />
        <PosSummary subtotal={subtotal} onPay={() => setPayOpen(true)} />
      </div>

      <PosPaymentModal
        open={payOpen}
        totalAmount={subtotal}
        defaultCashAccount={{
          accountId: "null",
          method: "CASH",
        }}
        onClose={() => setPayOpen(false)}
        onConfirm={(payments) => {
          // send to backend
          console.log("PAYMENTS", payments);
        }}
      />
    </div>
  );
}
