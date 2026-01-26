// purchase/components/ProductSearchCard.jsx
import { useEffect, useState } from "react";
import useApi from "../../../hooks/useApi";

export default function ProductSearchCard({ items, setItems }) {
  const { request } = useApi();
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!search) return;

    request(`/products/purchase?search=${search}&limit=10`, "GET").then((res) =>
      setProducts(res?.data || []),
    );
  }, [search]);

  const buildVariantsFromPrices = (variantPrices = []) =>
    variantPrices.map((v) => ({
      size: v.size,
      color: v.color,
      qty: 0,
      costPrice: v.costPrice,
      salePrice: v.salePrice,
    }));

  const addProduct = (product) => {
    const isUniformVariantPrice = (variantPrices = []) => {
      if (!variantPrices.length) return false;

      const { costPrice, salePrice } = variantPrices[0];
      return variantPrices.every(
        (v) => v.costPrice === costPrice && v.salePrice === salePrice,
      );
    };

    const hasVariantPrices = product.variantPrices?.length > 0;
    const uniform = isUniformVariantPrice(product.variantPrices);

    const pricingMode =
      product.hasVariant && hasVariantPrices && uniform ? "GLOBAL" : "VARIANT";

    setItems((prev) =>
      prev.find((p) => p.productId === product._id)
        ? prev
        : [
            ...prev,
            {
              productId: product._id,
              product,
              pricingMode,

              globalPrice:
                pricingMode === "GLOBAL"
                  ? {
                      costPrice: product.variantPrices[0].costPrice,
                      salePrice: product.variantPrices[0].salePrice,
                    }
                  : { costPrice: 0, salePrice: 0 },

              // 🔥 IMPORTANT FIX
              variants:
                pricingMode === "VARIANT"
                  ? buildVariantsFromPrices(product.variantPrices)
                  : [],
            },
          ],
    );

    setSearch("");
    setProducts([]);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      <h3 className="text-lg font-semibold">Add Products</h3>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search product name / code"
        className="w-full px-4 py-3 border rounded-lg"
      />

      {products.map((p) => (
        <div
          key={p._id}
          onClick={() => addProduct(p)}
          className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer">
          {p.category.parent} - {p.name} ({p.productCode})
        </div>
      ))}
    </div>
  );
}
