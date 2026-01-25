//purchase/components/ProductSearchCard.jsx
import { useEffect, useState } from "react";
import useApi from "../../../hooks/useApi";

export default function ProductSearchCard({ items, setItems }) {
  const { request } = useApi();
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
console.log(products)
  useEffect(() => {
    if (!search) return;
    request(`/products?search=${search}&limit=10`, "GET").then(res =>
      setProducts(res?.data || [])
    );
  }, [search]);

  const addProduct = (product) => {
  setItems(prev =>
    prev.find(p => p.productId === product._id)
      ? prev
      : [
          ...prev,
          {
            productId: product._id,
            product,

            costPrice: product.hasVariant
              ? product.defaultCostPrice || 0
              : 0,

            salePrice: product.hasVariant
              ? product.defaultSalePrice || 0
              : 0,

            sizes: {},
          },
        ]
  );

  setSearch("");
  setProducts([]);
};


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
 <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Add Products
          </h3>
          <span className="text-sm text-gray-500">
            {items.length} items added
          </span>
        </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search product name / code"
        className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
      />

      {products.map(p => (
        <div
          key={p._id}
          onClick={() => addProduct(p)}
          className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
        >
          {p.category.parent} - {p.name} - {p.productCode}
        </div>
      ))}
    </div>
  );
}
