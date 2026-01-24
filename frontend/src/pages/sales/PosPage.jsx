import { useState } from "react";
import usePosCart from "./components/usePosCart";
import PosItemSearch from "./components/PosItemSearch";
import PosCart from "./components/PosCart";
import PosSummary from "./components/PosSummary";
import PosCustomerSelect from "./components/PosCustomerSelect";
import PosSalesmanSelect from "./components/PosSalesmanSelect";
import PosPaymentModal from "./components/PosPaymentModal";
import useApi from "../../hooks/useApi";
import useModalManager from "../../hooks/useModalManager";
import PosInvoiceModal from "./components/invoice/PosInvoiceModal";

export default function PosPage() {
  const { request } = useApi();
  const { modals, openModal, closeModal } = useModalManager();
  const {
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
  } = usePosCart();

  const [customer, setCustomer] = useState(null);
  const [salesman, setSalesman] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [modalData, setModalData] = useState({});

  /* ---------------- Confirm Sale ---------------- */
  const confirmSale = async (payments) => {
    console.log("payments", payments);
    const payload = {
      type: "RETAIL",
      customerId: customer,
      salesmanId: salesman,

      items: cart.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        qty: i.qty,
        sku: i.sku,
        salePrice: i.salePrice,
        discountType: i.discountType || undefined,
        discountValue: i.discountValue || undefined,
      })),

      billDiscount,
      payments,
    };
    const res = await request("/sales", "POST", payload);
    console.log("after sales",res)
    setModalData(res.data);
    openModal("printPosInvoice");
    setPayOpen(false);
  };

  return (
    <>
      {modals.printPosInvoice?.isOpen && (
        <PosInvoiceModal
          isOpen={modals.printPosInvoice.isOpen}
          setIsOpen={() => closeModal("printPosInvoice")}
          data={modalData}
        />
      )}
      <div className="p-6 grid grid-cols-12 gap-6">
        {/* LEFT */}
        <div className="col-span-7 space-y-4">
          <PosItemSearch onSelect={addItem} />
          <PosCart
            cart={cart}
            updateQty={updateQty}
            updateDiscount={updateDiscount}
            removeItem={removeItem}
            isLowStock={isLowStock}
          />
        </div>

        {/* RIGHT */}
        <div className="col-span-5 space-y-4">
          <PosCustomerSelect value={customer} onChange={setCustomer} />
          <PosSalesmanSelect value={salesman} onChange={setSalesman} />

          <PosSummary
            subtotal={subtotal}
            billDiscount={billDiscount}
            setBillDiscount={setBillDiscount}
            grandTotal={grandTotal}
            onPay={() => setPayOpen(true)}
          />
        </div>

        <PosPaymentModal
          open={payOpen}
          totalAmount={grandTotal}
          onClose={() => setPayOpen(false)}
          onConfirm={confirmSale}
        />
      </div>
    </>
  );
}
