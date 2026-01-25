// purchase/components/ProductMatrixCard.jsx
import { Trash2 } from "lucide-react";
import { useState } from "react";

export default function ProductMatrixCard({ item, index, setItems }) {
  const [isDeleting, setIsDeleting] = useState(false);
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

  const colors = product.colors?.length ? product.colors : ["NA"];

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

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      setItems(prev => prev.filter((_, i) => i !== index));
    }, 300);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6 transition-all duration-300 ${
      isDeleting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
    }`}>
      {/* Product Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-lg mb-1">
            {product.name}
          </h4>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              {product.productCode || "No Code"}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              {sizes.length} Sizes
            </span>
          </div>
        </div>
        
        <button
          onClick={handleDelete}
          className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
          type="button"
        >
          <Trash2
            size={20}
            className="text-red-400 group-hover:text-red-600 transition-colors"
          />
        </button>
      </div>

      {/* Price Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Cost Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
             TK
            </span>
            <input
              type="number"
              placeholder="0.00"
              value={item.costPrice || ""}
              onChange={(e) =>
                setItems(prev =>
                  prev.map((i, x) =>
                    x === index
                      ? { ...i, costPrice: Number(e.target.value) }
                      : i
                  )
                )
              }
              className="pl-8 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Sale Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
             TK
            </span>
            <input
              type="number"
              placeholder="0.00"
              value={item.salePrice || ""}
              onChange={(e) =>
                setItems(prev =>
                  prev.map((i, x) =>
                    x === index
                      ? { ...i, salePrice: Number(e.target.value) }
                      : i
                  )
                )
              }
              className="pl-8 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* Size-Color Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-gray-700">Size-Color Matrix</h5>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Enter quantities
          </span>
        </div>
        
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                  Size
                </th>
                {colors.map(c => (
                  <th 
                    key={c} 
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                      {c}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sizes.map(size => (
                <tr key={size} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {size}
                  </td>
                  {colors.map(color => (
                    <td key={color} className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        onChange={(e) => updateQty(size, color, e.target.value)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
