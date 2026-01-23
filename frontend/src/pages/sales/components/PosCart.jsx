import Input from "../../../components/ui/Input";

export default function PosCart({
  cart,
  updateQty,
  removeItem,
  isLowStock,
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Item</th>
            <th className="p-2 w-20 text-center">Qty</th>
            <th className="p-2 w-24 text-right">Price</th>
            <th className="p-2 w-24 text-right">Total</th>
            <th className="p-2 w-10"></th>
          </tr>
        </thead>

        <tbody>
          {cart.map((item) => (
            <tr key={item.variantId} className="border-t">
              <td className="p-2">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-gray-500">
                  {item.sku}
                </div>
                {isLowStock(item) && (
                  <div className="text-xs text-red-500">
                    ⚠ Low stock
                  </div>
                )}
              </td>

              <td className="p-2 text-center">
                <Input
                  type="number"
                  min={1}
                  value={item.qty}
                  onChange={(e) =>
                    updateQty(
                      item.variantId,
                      Number(e.target.value)
                    )
                  }
                  className="w-16 text-center"
                />
              </td>

              <td className="p-2 text-right">
                ৳{item.salePrice}
              </td>

              <td className="p-2 text-right">
                ৳{item.salePrice * item.qty}
              </td>

              <td className="p-2 text-center">
                <button
                  onClick={() =>
                    removeItem(item.variantId)
                  }
                  className="text-red-500"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}

          {cart.length === 0 && (
            <tr>
              <td
                colSpan="5"
                className="p-4 text-center text-gray-400"
              >
                No items added
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
