import { useEffect, useState } from "react";
import useApi from "../../../hooks/useApi";

export default function ProductSearchCard({ items, setItems }) {
  const { request } = useApi();
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);

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
              costPrice: 0,
              salePrice: 0,
              sizes: {},
            },
          ]
    );
    setSearch("");
    setProducts([]);
  };

  return (
    <div className="bg-white border rounded-lg p-5">
      <label className="text-sm font-medium text-gray-700">
        Add Product
      </label>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search product name / code"
        className="input mt-2 w-full"
      />

      {products.map(p => (
        <div
          key={p._id}
          onClick={() => addProduct(p)}
          className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
        >
          {p.name}
        </div>
      ))}
    </div>
  );
}
