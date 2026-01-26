import { Trash2 } from "lucide-react";

export default function ProductMatrixCard({ item, index, setItems }) {
  const product = item.product;

  /* ======================
     SIZE & COLOR
  ====================== */
  const sizes = product.sizeConfig
    ? product.sizeConfig.values
      ? product.sizeConfig.values
      : Array.from(
          {
            length:
              (product.sizeConfig.max - product.sizeConfig.min) /
                product.sizeConfig.step +
              1,
          },
          (_, i) =>
            String(product.sizeConfig.min + i * product.sizeConfig.step)
        )
    : ["NA"];

  const colors =
    product.hasVariant && product.colors?.length
      ? product.colors
      : ["NA"];

  /* ======================
     HELPERS
  ====================== */
  const updateItem = patch =>
    setItems(prev =>
      prev.map((it, i) => (i === index ? { ...it, ...patch } : it))
    );

  const findVariant = (size, color) =>
    item.variants.find(v => v.size === size && v.color === color);

  /* ======================
     VARIANT UPDATE (SAFE)
  ====================== */
  const updateVariant = (size, color, patch) => {
    const next = [...item.variants];
    const idx = next.findIndex(
      v => v.size === size && v.color === color
    );

    const base =
      idx !== -1
        ? next[idx]
        : { size, color, qty: 0, costPrice: 0, salePrice: 0 };

    const updated = { ...base, ...patch };

    if (idx === -1) next.push(updated);
    else next[idx] = updated;

    // ❗ DO NOT FILTER HERE
    updateItem({ variants: next });
  };

  /* ======================
     PRICING MODE SWITCH
  ====================== */
  const togglePricingMode = checked => {
    if (!checked && item.pricingMode === "GLOBAL") {
      // GLOBAL → VARIANT
      updateItem({
        pricingMode: "VARIANT",
        variants: item.variants.map(v => ({
          ...v,
          costPrice: item.globalPrice.costPrice,
          salePrice: item.globalPrice.salePrice,
        })),
      });
    } else {
      updateItem({
        pricingMode: "GLOBAL",
      });
    }
  };

  /* ======================
     UI
  ====================== */
  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h4 className="font-semibold">{product.name}</h4>
        <button
          type="button"
          onClick={() =>
            setItems(prev => prev.filter((_, i) => i !== index))
          }
        >
          <Trash2 className="text-red-500" />
        </button>
      </div>

      {/* PRICING MODE */}
      <label className="flex gap-2 text-sm items-center">
        <input
          type="checkbox"
          checked={item.pricingMode === "GLOBAL"}
          onChange={e => togglePricingMode(e.target.checked)}
        />
        Same price for all variants
      </label>

      {/* GLOBAL PRICE */}
      {item.pricingMode === "GLOBAL" && (
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Cost"
            className="border px-3 py-2 rounded"
            value={item.globalPrice.costPrice}
            onChange={e =>
              updateItem({
                globalPrice: {
                  ...item.globalPrice,
                  costPrice: Number(e.target.value),
                },
              })
            }
          />
          <input
            type="number"
            placeholder="Sale"
            className="border px-3 py-2 rounded"
            value={item.globalPrice.salePrice}
            onChange={e =>
              updateItem({
                globalPrice: {
                  ...item.globalPrice,
                  salePrice: Number(e.target.value),
                },
              })
            }
          />
        </div>
      )}

      {/* MATRIX */}
      <table className="w-full border text-sm">
        <thead>
          <tr>
            <th className="p-2">Size</th>
            {colors.map(c => (
              <th key={c} className="p-2">
                {c}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sizes.map(size => (
            <tr key={size}>
              <td className="p-2 font-medium">{size}</td>

              {colors.map(color => {
                const v = findVariant(size, color);

                return (
                  <td key={color} className="p-1 space-y-1">
                    {/* QTY */}
                    <input
                      type="number"
                      min="0"
                      placeholder="Qty"
                      className="w-16 border px-2 py-1 rounded"
                      value={v?.qty ?? ""}
                      onChange={e =>
                        updateVariant(size, color, {
                          qty: Math.max(Number(e.target.value), 0),
                        })
                      }
                    />

                    {/* VARIANT PRICE */}
                    {item.pricingMode === "VARIANT" && (
                      <>
                        <input
                          type="number"
                          min="0"
                          placeholder="Cost"
                          className="w-16 border px-2 py-1 rounded text-xs"
                          value={v?.costPrice ?? ""}
                          onChange={e =>
                            updateVariant(size, color, {
                              costPrice: Number(e.target.value),
                            })
                          }
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="Sale"
                          className="w-16 border px-2 py-1 rounded text-xs"
                          value={v?.salePrice ?? ""}
                          onChange={e =>
                            updateVariant(size, color, {
                              salePrice: Number(e.target.value),
                            })
                          }
                        />
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
