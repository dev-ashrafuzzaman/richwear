import { useEffect, useRef, useState, useCallback } from "react";
import Page from "../../../components/common/Page";
import useApi from "../../../hooks/useApi";

import TransferHeader from "../components/TransferHeader";
import TransferItemSearch from "../components/TransferItemSearch";
import TransferFooter from "../components/TransferFooter";
import TransferItemsTable from "../components/TransferItemTable";
import { useNavigate } from "react-router-dom";

const CreateStockTransferPage = () => {
  const { request, loading } = useApi();
  const searchRef = useRef(null);
  const navigate = useNavigate();
  /* ===============================
     STATE
  =============================== */
  const [fromBranch, setFromBranch] = useState(null);
  const [toBranch, setToBranch] = useState(null);
  const [items, setItems] = useState([]);

  /* ===============================
     RESET ON SOURCE CHANGE
  =============================== */
  useEffect(() => {
    setItems([]);
    searchRef.current?.clearAndFocus();
  }, [fromBranch?._id]);

  /* ===============================
     ADD ITEM (SCAN / SEARCH)
  =============================== */
  const handleAddItem = useCallback((raw) => {
    if (!raw) return;

    const availableQty = Number(raw.qty) || 0;
    if (availableQty <= 0) return;

    setItems((prev) => {
      const index = prev.findIndex((i) => i.variantId === raw.variantId);

      /* ---------- Already Added ---------- */
      if (index !== -1) {
        const current = prev[index];

        if (current.qty >= current.availableQty) return prev;

        const updated = [...prev];
        updated[index] = {
          ...current,
          qty: Math.min(current.qty + 1, current.availableQty),
        };
        return updated;
      }

      /* ---------- New Entry ---------- */
      return [
        ...prev,
        {
          variantId: raw.variantId,
          sku: raw.sku,
          productName: raw.productName,
          attributes: raw.attributes,
          unit: raw.unit,

          availableQty, // 🔒 stock snapshot
          qty: 1,

          costPrice: raw.costPrice || 0, // 🔒 future accounting safe
        },
      ];
    });

    // POS speed
    searchRef.current?.clearAndFocus();
  }, []);

  /* ===============================
     SUBMIT TRANSFER
  =============================== */
  const submitTransfer = async () => {
    if (!fromBranch || !toBranch)
      return alert("Select both source and destination");

    if (fromBranch._id === toBranch._id)
      return alert("Source and destination cannot be same");

    if (!items.length) return alert("No items selected for transfer");

    const payload = {
      transferType: "BRANCH_TO_BRANCH", // 🔥 future-proof
      fromBranchId: fromBranch._id,
      toBranchId: toBranch._id,
      items: items.map((i) => ({
        variantId: i.variantId,
        sku: i.sku,
        qty: Number(i.qty),
        costPrice: i.costPrice,
      })),
    };

    await request("/stocks/transfers", "POST", payload, {
      successMessage:
        "Stock dispatched successfully. Awaiting receive confirmation.",
      onSuccess: () => {
        setItems([]);
        navigate("/manage-transfer")
        searchRef.current?.clearAndFocus();
      },
      onError: (err) => {
        if (
          err?.message?.includes("Insufficient stock") ||
          err?.message?.includes("stock")
        ) {
          alert("Stock has changed. Please re-scan items and try again.");
          setItems([]);
        }
      },
    });
  };

  /* ===============================
     RENDER
  =============================== */
  return (
    <Page
      title="Stock Transfer"
      subTitle="Branch to branch / warehouse stock transfer"
    >
      {/* -------- Header -------- */}
      <TransferHeader
        fromBranch={fromBranch}
        toBranch={toBranch}
        setFromBranch={setFromBranch}
        setToBranch={setToBranch}
      />

      {/* -------- Item Search -------- */}
      <div className="my-4">
        <TransferItemSearch
          ref={searchRef}
          fromBranchId={fromBranch?._id || null}
          disabled={!fromBranch}
          onSelect={handleAddItem}
        />
      </div>

      {/* -------- Items Table -------- */}
      <TransferItemsTable items={items} setItems={setItems} />

      {/* -------- Footer -------- */}
      <TransferFooter
        items={items}
        loading={loading}
        onSubmit={submitTransfer}
      />
    </Page>
  );
};

export default CreateStockTransferPage;
