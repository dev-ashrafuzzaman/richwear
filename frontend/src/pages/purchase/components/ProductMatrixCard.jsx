import { Trash2 } from "lucide-react";

export default function ProductMatrixCard({ item, index, setItems }) {
  const product = item.product;

  const sizes =
    product.sizeType === "TEXT"
      ? product.sizeConfig.values
      : Array.from(
          { length: (product.sizeConfig.max - product.sizeConfig.min) /
            product.sizeConfig.step + 1 },
          (_, i) =>
            String(product.sizeConfig.min + i * product.sizeConfig.step)
        );

  const colors =
    product.colors?.length ? product.colors : ["NA"];

  const updateQty = (size, color, qty) => {
    setItems(prev =>
      prev.map((it, idx) =>
        idx !== index
          ? it
          : {
              ...it,
              sizes: {
                ...it.sizes,
                [size]: {
                  ...(it.sizes[size] || {}),
                  [color]: Number(qty),
                },
              },
            }
      )
    );
  };

  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-800">
          {product.name}
        </h4>
        <Trash2
          size={18}
          className="text-red-500 cursor-pointer"
          onClick={() =>
            setItems(prev => prev.filter((_, i) => i !== index))
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input
          type="number"
          placeholder="Cost Price"
          value={item.costPrice}
          onChange={(e) =>
            setItems(prev =>
              prev.map((i, x) =>
                x === index
                  ? { ...i, costPrice: Number(e.target.value) }
                  : i
              )
            )
          }
          className="input"
        />

        <input
          type="number"
          placeholder="Sale Price"
          value={item.salePrice}
          onChange={(e) =>
            setItems(prev =>
              prev.map((i, x) =>
                x === index
                  ? { ...i, salePrice: Number(e.target.value) }
                  : i
              )
            )
          }
          className="input"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-3 py-2">Size</th>
              {colors.map(c => (
                <th key={c} className="border px-3 py-2">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sizes.map(size => (
              <tr key={size}>
                <td className="border px-3 py-2 font-medium">{size}</td>
                {colors.map(color => (
                  <td key={color} className="border px-2 py-1">
                    <input
                      type="number"
                      min="0"
                      className="w-20 input text-center"
                      onChange={(e) =>
                        updateQty(size, color, e.target.value)
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
