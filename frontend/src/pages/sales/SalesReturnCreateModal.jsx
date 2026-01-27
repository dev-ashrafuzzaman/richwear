import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import Modal from "../../components/modals/Modal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import useApi from "../../hooks/useApi";

export default function SalesReturnCreateModal({
  open,
  setOpen,
  saleId,
  onSuccess,
}) {
  const { request } = useApi();
  const [sale, setSale] = useState(null);
  const [items, setItems] = useState([]);
  const [confirmed, setConfirmed] = useState(false);

  /* ---------- Load Sale ---------- */
  useEffect(() => {
    if (!open || !saleId) return;

    request(`/sales/${saleId}/return`, "GET", null, {
      onSuccess: (res) => {
        setSale(res.data);

        setItems(
          res.data.items.map((i) => ({
            saleItemId: i._id,
            sku: i.sku,
            name: i.productName || i.sku,
            soldQty: i.qty,
            returnQty: 0,
            reason: "",
            unitPrice: i.lineTotal / i.qty,
          })),
        );
      },
    });
  }, [open, saleId]);

  /* ---------- Total Refund ---------- */
  const totalRefund = useMemo(() => {
    return items.reduce((sum, i) => sum + i.returnQty * i.unitPrice, 0);
  }, [items]);

  /* ---------- Submit ---------- */
  const submitReturn = async () => {
    const payload = {
      refundMethod: "CASH",
      items: items
        .filter((i) => i.returnQty > 0)
        .map((i) => ({
          saleItemId: i.saleItemId,
          qty: i.returnQty,
          reason: i.reason || "Returned",
        })),
    };

    if (!payload.items.length) return;

    await request(`/sales/${saleId}/return`, "POST", payload, {
      successMessage: "Sales return completed",
      onSuccess: () => {
        setOpen(false);
        onSuccess?.();
      },
    });
  };

  if (!sale) {
    return (
      <Modal isOpen={open} setIsOpen={setOpen} title="Sales Return">
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={open}
      setIsOpen={setOpen}
      title="Sales Return"
      size="5xl"
      footer={
        <div className="flex justify-between items-center">
          <div className="text-lg font-semibold">
            Total Refund:{" "}
            <span className="text-red-600">BDT {totalRefund.toFixed(2)}</span>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitReturn}
              disabled={totalRefund <= 0 || !confirmed}
              variant="gradient">
              Confirm Return
            </Button>
          </div>
        </div>
      }>
      {/* ---------- Sale + Customer Info ---------- */}
      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg mb-4 text-sm">
        <div>
          <div className="flex justify-between">
            <span>Invoice:</span>
            <strong>{sale.invoiceNo}</strong>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <strong>{new Date(sale.createdAt).toLocaleDateString()}</strong>
          </div>
        </div>

        <div>
          <div className="flex justify-between">
            <span>Customer:</span>
            <strong>{sale.customer?.name || "Walk-in"}</strong>
          </div>
          <div className="flex justify-between">
            <span>Phone:</span>
            <strong>{sale.customer?.phone || "-"}</strong>
          </div>
        </div>
      </div>

      {/* ---------- Items ---------- */}
      <div className="space-y-3">
        {items.map((i, idx) => {
          const refund = i.returnQty * i.unitPrice;

          return (
            <div
              key={i.saleItemId}
              className="grid grid-cols-12 gap-3 items-center border p-3 rounded-lg">
              <div className="col-span-4">
                <div className="font-medium">{i.name}</div>
                <div className="text-xs text-gray-500">{i.sku}</div>
              </div>

              <div className="col-span-2 text-sm">
                Sold: <strong>{i.soldQty}</strong>
              </div>

              <div className="col-span-2">
                <Input
                  type="number"
                  min={0}
                  max={i.soldQty}
                  value={i.returnQty}
                  onChange={(e) => {
                    const v = Math.min(Number(e.target.value || 0), i.soldQty);
                    setItems((prev) =>
                      prev.map((x, j) =>
                        j === idx ? { ...x, returnQty: v } : x,
                      ),
                    );
                  }}
                />
              </div>

              <div className="col-span-2 text-sm">
                Refund:{" "}
                <strong className="text-red-600">
                  {refund > 0 ? `BDT ${refund.toFixed(2)}` : "-"}
                </strong>
              </div>

              <div className="col-span-2">
                <Input
                  placeholder="Reason"
                  value={i.reason}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((x, j) =>
                        j === idx ? { ...x, reason: e.target.value } : x,
                      ),
                    )
                  }
                />
              </div>
            </div>
          );
        })}
        {/* ---------- Confirmation ---------- */}
<div className="mt-6 border-t pt-4 flex items-center gap-2">
  <input
    type="checkbox"
    id="confirmReturn"
    checked={confirmed}
    onChange={(e) => setConfirmed(e.target.checked)}
    className="w-4 h-4"
  />
  <label
    htmlFor="confirmReturn"
    className="text-sm text-gray-700 select-none"
  >
    I confirm that the above return quantities and refund amount are correct
  </label>
</div>

      </div>
    </Modal>
  );
}
