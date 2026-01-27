import { Trash2 } from "lucide-react";

const TransferItemsTable = ({ items, setItems }) => {
  const updateQty = (variantId, value, max) => {
    const qty = Number(value);

    if (Number.isNaN(qty)) return;
    if (qty < 1) return;

    setItems((prev) =>
      prev.map((i) =>
        i.variantId === variantId
          ? {
              ...i,
              qty: Math.min(qty, max), // 🔒 HARD GUARD
            }
          : i
      )
    );
  };

  const removeItem = (variantId) => {
    setItems((prev) =>
      prev.filter((i) => i.variantId !== variantId)
    );
  };

  if (!items.length) {
    return (
      <div className="border rounded-lg py-10 text-center text-muted">
        No items added
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Item</th>
            <th className="p-2 text-center">Size</th>
            <th className="p-2 text-center">Color</th>
            <th className="p-2 text-center">Available</th>
            <th className="p-2 text-center">Transfer Qty</th>
            <th className="p-2 w-10"></th>
          </tr>
        </thead>

        <tbody>
          {items.map((i) => {
            const isMax = i.qty === i.availableQty;

            return (
              <tr
                key={i.variantId}
                className="border-t hover:bg-gray-50"
              >
                {/* Item */}
                <td className="p-2">
                  <strong>{i.productName}</strong>
                  <div className="text-xs text-muted">
                    {i.sku}
                  </div>
                </td>

                {/* Size */}
                <td className="p-2 text-center">
                  {i.attributes?.size || "-"}
                </td>

                {/* Color */}
                <td className="p-2 text-center">
                  {i.attributes?.color || "-"}
                </td>

                {/* Available Qty */}
                <td className="p-2 text-center">
                  <span className="font-semibold">
                    {i.availableQty}
                  </span>
                </td>

                {/* Transfer Qty Input */}
                <td className="p-2 text-center">
                  <input
                    type="number"
                    min={1}
                    max={i.availableQty}
                    value={i.qty}
                    onChange={(e) =>
                      updateQty(
                        i.variantId,
                        e.target.value,
                        i.availableQty
                      )
                    }
                    className={`
                      w-20 px-2 py-1 rounded border text-center
                      ${
                        isMax
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-300"
                      }
                    `}
                  />

                  {isMax && (
                    <div className="text-xs text-orange-600 mt-0.5">
                      Max available
                    </div>
                  )}
                </td>

                {/* Remove */}
                <td className="p-2 text-center">
                  <button
                    onClick={() =>
                      removeItem(i.variantId)
                    }
                    className="text-red-600 hover:text-red-700"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TransferItemsTable;
