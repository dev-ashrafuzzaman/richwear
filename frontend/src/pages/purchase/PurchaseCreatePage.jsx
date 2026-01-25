// purchase/PurchaseCreatePage.jsx - Updated (removing isSubmitting)
import { useState } from "react";
import { useForm } from "react-hook-form";
import useApi from "../../hooks/useApi";
import useModalManager from "../../hooks/useModalManager";
import BarcodeModal from "../../components/barcode/BarcodeModal";

import PurchaseHeader from "./components/PurchaseHeader";
import SupplierInvoiceCard from "./components/SupplierInvoiceCard";
import ProductSearchCard from "./components/ProductSearchCard";
import ProductMatrixCard from "./components/ProductMatrixCard";
import PurchaseSummaryBar from "./components/PurchaseSummaryBar";

const today = () => new Date().toISOString().split("T")[0];

export default function PurchaseCreatePage() {
  const { request } = useApi();
  const { modals, openModal, closeModal } = useModalManager();

  const [supplier, setSupplier] = useState(null);
  const [items, setItems] = useState([]);
  const [barcodeItems, setBarcodeItems] = useState([]);

  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      invoiceNumber: "",
      invoiceDate: today(),
      paidAmount: 0,
      notes: "",
    },
  });

  const paidAmount = Number(watch("paidAmount")) || 0;

  const totalAmount = items.reduce((sum, item) => {
    let qty = 0;
    Object.values(item.sizes).forEach(c =>
      Object.values(c).forEach(q => (qty += q))
    );
    return sum + qty * item.costPrice;
  }, 0);

  const dueAmount = Math.max(totalAmount - paidAmount, 0);

  const onSubmit = async (data) => {
    if (!supplier) {
      alert("Please select a supplier");
      return;
    }
    if (!items.length) {
      alert("Please add at least one product");
      return;
    }

    const payload = {
      supplierId: supplier._id,
      ...data,
      items: items.map(({ productId, costPrice, salePrice, sizes }) => ({
        productId,
        costPrice,
        salePrice,
        sizes,
      })),
    };

    await request("/purchases", "POST", payload, {
      successMessage: "Purchase created successfully!",
      onSuccess: (res) => {
        const barcodes = res?.data?.barcodes || [];
        if (barcodes.length) {
          setBarcodeItems(barcodes);
          openModal("purchaseBarcode");
        }
        reset();
        setItems([]);
        setSupplier(null);
      },
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100">
      {modals.purchaseBarcode?.isOpen && (
        <BarcodeModal
          isOpen
          setIsOpen={() => closeModal("purchaseBarcode")}
          barcodes={barcodeItems}
        />
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6"
      >
        <PurchaseHeader />

        <SupplierInvoiceCard
          register={register}
          supplier={supplier}
          setSupplier={setSupplier}
        />

        <ProductSearchCard items={items} setItems={setItems} />

        {/* Products List */}
        {items.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Products ({items.length})
              </h2>
              <div className="text-sm text-gray-500">
                Total Items:{" "}
                <span className="font-semibold">
                  {items.reduce((sum, item) => {
                    let total = 0;
                    Object.values(item.sizes).forEach(c =>
                      Object.values(c).forEach(q => (total += q))
                    );
                    return sum + total;
                  }, 0)}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              {items.map((item, idx) => (
                <ProductMatrixCard
                  key={item.productId}
                  index={idx}
                  item={item}
                  setItems={setItems}
                />
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Products Added
              </h3>
              <p className="text-gray-600">
                Search and add products to start creating your purchase order
              </p>
            </div>
          </div>
        )}

        {items.length > 0 && (
          <PurchaseSummaryBar
            totalAmount={totalAmount}
            dueAmount={dueAmount}
          />
        )}
      </form>
    </div>
  );
}