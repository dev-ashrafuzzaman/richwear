import { useEffect, useRef, useState } from "react";
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
import PosCustomerInfo from "./components/PosCustomerInfo";

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
    resetCart,
    applyMembershipPricing,
  } = usePosCart();

  const [customer, setCustomer] = useState(null);
  const [customerSummary, setCustomerSummary] = useState(null);
  const [salesman, setSalesman] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [modalData, setModalData] = useState({});
  const searchRef = useRef(null);
  const salesmanRef = useRef(null);
  console.log(customerSummary);
  /* ---------------- Confirm Sale ---------------- */
  const confirmSale = async (payments, resetPayment) => {
    const payload = {
      type: "RETAIL",
      customerId: customer?._id,
      salesmanId: salesman?._id,

      items: cart.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        qty: i.qty,
        sku: i.sku,
        salePrice: i.salePrice,
        ...(i.discountId && {
          discountId: i.discountId,
          discountType: i.discountType,
          discountValue: Number(i.discountValue),
        }),
      })),

      billDiscount,
      payments: payments.map((p) => ({
        method: p.method,
        accountId: p.accountId,
        amount: Number(p.amount),
        reference: p.method === "Cash" ? "Hand Cash" : p.reference,
      })),
    };

    console.log("sales", payload);
    const res = await request("/sales", "POST", payload);
    setModalData(res.data);
    openModal("printPosInvoice");
    resetCart();
    setCustomer(null);
    setCustomerSummary(null);
    setSalesman(null);
    setPayOpen(false);
    resetPayment();

    requestAnimationFrame(() => {
      searchRef.current?.clearAndFocus();
    });
  };

  useEffect(() => {
    if (!customer?._id) {
      setCustomerSummary(null);
      return;
    }

    request(`/customers/${customer._id}/summary`, "GET")
      .then((res) => {
        setCustomerSummary(res);
      })
      .catch(() => {
        setCustomerSummary(null);
      });
  }, [customer, request]);

  useEffect(() => {
    if (customer) {
      // slight delay to avoid race with modal close / re-render
      requestAnimationFrame(() => {
        salesmanRef.current?.focus?.();
      });
    }
  }, [customer]);

  const loyalty = customerSummary?.loyalty;
  const settings = customerSummary?.settings;

  /* ---------------- REWARD STATES ---------------- */
  const isRewardStep =
    !!loyalty && !!settings && loyalty.current + 1 === settings.requiredCount;

  const meetsMinPurchase = subtotal >= (settings?.minDailyPurchase || 0);

  const rewardEligible = isRewardStep && meetsMinPurchase;

  /* 🔒 Can proceed to payment? */
  const canProceed = !isRewardStep || meetsMinPurchase;

  useEffect(() => {
    if (rewardEligible) {
      setBillDiscount(Math.min(settings.maxRewardValue, subtotal));
    } else {
      setBillDiscount(0); // 🔒 ensure no leftover discount
    }
  }, [rewardEligible, subtotal, settings?.maxRewardValue, setBillDiscount]);

  useEffect(() => {
    const handleKey = (e) => {
      // Ctrl + Enter → Pay
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();

        // ❌ If any modal already open → ignore
        if (Object.values(modals).some((m) => m?.isOpen)) return;

        // ❌ If cart empty → ignore
        if (!cart.length) return;
        if (!canProceed) return;

        setPayOpen(true);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [canProceed, cart.length, modals]);

  useEffect(() => {
    if (!customerSummary) return;

    const isMember = customerSummary.membership?.status === "ACTIVE";

    const membershipPercent =
      customerSummary.settings?.productDiscountPercent || 0;

    applyMembershipPricing({
      isMember,
      membershipPercent,
    });
  }, [customerSummary, applyMembershipPricing]);

  return (
    <>
      {modals.printPosInvoice?.isOpen && (
        <PosInvoiceModal
          isOpen={modals.printPosInvoice.isOpen}
          setIsOpen={() => closeModal("printPosInvoice")}
          data={modalData}
          onAfterClose={() => {
            requestAnimationFrame(() => {
              searchRef.current?.clearAndFocus();
            });
          }}
        />
      )}
      {/* POS Header – Professional UI/UX */}
      <section className="">
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-gray-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between px-8 py-5">
            {/* Left Section */}
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                  Point of Sale
                </h1>
                <div className="mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-600 text-sm font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live Session Active
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-900 tracking-wide">
                RICHWEAR
              </h2>
              <p className="mt-1 text-sm font-medium text-blue-600 uppercase tracking-wider">
                Jhikargachha Outlet
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="py-2 grid grid-cols-12 gap-2">
        {/* LEFT */}
        <div className="col-span-8 space-y-2">
          <PosItemSearch ref={searchRef} onSelect={addItem} />
          <PosCart
            cart={cart}
            customerSummary={customerSummary}
            updateQty={updateQty}
            updateDiscount={updateDiscount}
            removeItem={removeItem}
            isLowStock={isLowStock}
          />
        </div>

        {/* RIGHT */}
        <div className="col-span-4 space-y-2">
          <div className="w-full bg-white border border-gray-200 rounded-xl p-4 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
              <PosCustomerSelect value={customer} onChange={setCustomer} />
              <PosSalesmanSelect
                ref={salesmanRef}
                value={salesman}
                onChange={setSalesman}
              />
            </div>
          </div>
          {customerSummary && <PosCustomerInfo summary={customerSummary} />}
          <PosSummary
            canProceed={canProceed}
            customerSummary={customerSummary}
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
