import { useEffect, useRef, useState } from "react";
import Page from "../../components/common/Page";
import useApi from "../../hooks/useApi";

import TransferHeader from "./components/TransferHeader";
import TransferItemSearch from "./components/TransferItemSearch";
import TransferFooter from "./components/TransferFooter";
import TransferItemsTable from "./components/TransferItemTable";

const StockTransfer = () => {
  const { request, loading } = useApi();
  const searchRef = useRef(null);

  const [fromBranch, setFromBranch] = useState(null);
  const [toBranch, setToBranch] = useState(null);
  const [items, setItems] = useState([]);

  /* ---------------- Reset on Branch Change ---------------- */
  useEffect(() => {
    setItems([]);
    searchRef.current?.clearAndFocus();
  }, [fromBranch?._id]);

  /* ---------------- Add Item ---------------- */
  const handleAddItem = (raw) => {
    if (!raw) return;

    setItems((prev) => {
      const availableQty = Number(raw.qty) || 0;
      if (availableQty <= 0) return prev;

      const index = prev.findIndex((i) => i.variantId === raw.variantId);

      /* ---------- Already Exists ---------- */
      if (index !== -1) {
        const current = prev[index];

        // 🚫 Already at max available
        if (current.qty >= current.availableQty) {
          // optional: toast.warning("Max available quantity reached");
          return prev;
        }

        const updated = [...prev];
        updated[index] = {
          ...current,
          qty: Math.min(current.qty + 1, current.availableQty),
        };
        return updated;
      }

      /* ---------- New Item ---------- */
      return [
        ...prev,
        {
          variantId: raw.variantId,
          sku: raw.sku,
          productName: raw.productName,
          attributes: raw.attributes,
          unit: raw.unit,
          availableQty, // 🔒 snapshot at add time
          qty: 1,
        },
      ];
    });

    // 🔥 POS flow: instantly ready for next scan
    searchRef.current?.clearAndFocus();
  };

  /* ---------------- Submit Transfer ---------------- */
  const submitTransfer = async () => {
    if (!fromBranch || !toBranch) return alert("Select both branches");

    if (fromBranch._id === toBranch._id)
      return alert("Source and destination cannot be same");

    if (!items.length) return alert("No items to transfer");

    const payload = {
      fromBranchId: fromBranch._id,
      toBranchId: toBranch._id,
      items: items.map((i) => ({
        variantId: i.variantId,
        qty: Number(i.qty),
      })),
    };

    await request("/stocks/transfers", "POST", payload, {
      successMessage: "Stock transferred successfully",
      onSuccess: () => {
        setItems([]);
        searchRef.current?.clearAndFocus();
      },
    });
  };

  return (
    <Page
      title="Stock Transfer"
      subTitle="Warehouse to warehouse stock transfer">
      <TransferHeader
        fromBranch={fromBranch}
        toBranch={toBranch}
        setFromBranch={setFromBranch}
        setToBranch={setToBranch}
      />

      <div className="my-4">
        <TransferItemSearch
          ref={searchRef}
          fromBranchId={fromBranch?._id || null}
          disabled={!fromBranch}
          onSelect={handleAddItem}
        />
      </div>

      <TransferItemsTable items={items} setItems={setItems} />

      <TransferFooter
        items={items}
        loading={loading}
        onSubmit={submitTransfer}
      />
    </Page>
  );
};

export default StockTransfer;
