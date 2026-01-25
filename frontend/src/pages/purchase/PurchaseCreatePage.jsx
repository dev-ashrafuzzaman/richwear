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
    if (!supplier) return alert("Select supplier");
    if (!items.length) return alert("Add product");

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
      successMessage: "Purchase created successfully",
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
    <div className="h-full overflow-y-auto bg-gray-100">
      {modals.purchaseBarcode?.isOpen && (
        <BarcodeModal
          isOpen
          setIsOpen={() => closeModal("purchaseBarcode")}
          barcodes={barcodeItems}
        />
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-7xl mx-auto p-6 space-y-6"
      >
        <PurchaseHeader />

        <SupplierInvoiceCard
          register={register}
          supplier={supplier}
          setSupplier={setSupplier}
        />

        <ProductSearchCard items={items} setItems={setItems} />

        {items.map((item, idx) => (
          <ProductMatrixCard
            key={item.productId}
            index={idx}
            item={item}
            setItems={setItems}
          />
        ))}

        <PurchaseSummaryBar
          totalAmount={totalAmount}
          dueAmount={dueAmount}
        />
      </form>
    </div>
  );
}
