import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Plus,
  Trash2,
  Search,
  Calculator,
  FileText,
  Truck,
  Calendar,
  User,
} from "lucide-react";
import useApi from "../../hooks/useApi";

/* ---------------------------------------
 Utility
---------------------------------------- */
const today = () => new Date().toISOString().split("T")[0];

export default function PurchaseCreatePage() {
  const { request, loading } = useApi();

  const [supplier, setSupplier] = useState(null);
  const [variantSearch, setVariantSearch] = useState("");
  const [variants, setVariants] = useState([]);
  const [items, setItems] = useState([]);

  /* ---------------------------------------
   Form
  ---------------------------------------- */
  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      invoiceNumber: "",
      invoiceDate: today(),
      paidAmount: 0,
      notes: "",
    },
  });

  const paidAmount = Number(watch("paidAmount")) || 0;

  /* ---------------------------------------
   Calculations
  ---------------------------------------- */
  const totalAmount = useMemo(
    () => items.reduce((sum, i) => sum + i.qty * i.costPrice, 0),
    [items],
  );

  const dueAmount = Math.max(totalAmount - paidAmount, 0);

  /* ---------------------------------------
   Fetch variants (search)
  ---------------------------------------- */
  useEffect(() => {
    if (!variantSearch) return;

    const load = async () => {
      const res = await request(
        `/variants?search=${variantSearch}&limit=10`,
        "GET",
      );
      setVariants(res?.data || []);
    };

    load();
  }, [request, variantSearch]);

  /* ---------------------------------------
   Add Variant
  ---------------------------------------- */
  const addItem = (variant) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.variantId === variant._id);
      if (exists) {
        return prev.map((i) =>
          i.variantId === variant._id ? { ...i, qty: i.qty + 1 } : i,
        );
      }

      return [
        ...prev,
        {
          variantId: variant._id,
          name: variant.name,
          sku: variant.sku,
          qty: 1,
          costPrice: variant.costPrice || 0,
          salePrice: variant.salePrice || 0,
        },
      ];
    });

    setVariantSearch("");
    setVariants([]);
  };

  /* ---------------------------------------
   Update Item
  ---------------------------------------- */
  const updateItem = (index, key, value) => {
    setItems((prev) =>
      prev.map((i, idx) =>
        idx === index ? { ...i, [key]: Number(value) } : i,
      ),
    );
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  /* ---------------------------------------
   Submit
  ---------------------------------------- */
  const onSubmit = async (data) => {
    if (!supplier) return alert("Select supplier");
    if (!items.length) return alert("Add items");

    const payload = {
      supplierId: supplier._id,
      ...data,
      items: items.map(({ variantId, qty, costPrice, salePrice }) => ({
        variantId,
        qty,
        costPrice,
        salePrice,
      })),
    };

    await request("/purchases", "POST", payload, {
      successMessage: "Purchase created successfully",
      onSuccess: () => {
        reset();
        setItems([]);
        setSupplier(null);
      },
    });
  };

  /* ---------------------------------------
   UI
  ---------------------------------------- */
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-8 space-y-8 bg-linear-to-b from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Create Purchase</h1>
          <p className="text-gray-500 text-sm mt-1">
            Add new purchase order and manage inventory
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-8">
        {/* Supplier + Invoice Section */}
        <div className="bg-linear-to-r from-blue-50 to-indigo-50/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-800">
              Supplier & Invoice Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier <span className="text-red-500">*</span>
              </label>
              <SupplierSelect value={supplier} onChange={setSupplier} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Number <span className="text-red-500">*</span>
              </label>
              <input
                {...register("invoiceNumber", { required: true })}
                placeholder="INV-001"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  {...register("invoiceDate", { required: true })}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paid Amount
              </label>
              <input
                type="number"
                {...register("paidAmount")}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Product Search Section */}
        <div className="bg-linear-to-r from-emerald-50 to-teal-50/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-gray-800">Add Products</h2>
          </div>

          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                value={variantSearch}
                onChange={(e) => setVariantSearch(e.target.value)}
                placeholder="Search product by name / scan barcode"
                className="w-full pl-12 pr-4 py-3.5 rounded-lg border border-gray-300 bg-white text-gray-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all shadow-sm"
              />
            </div>

            {variants.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {variants.map((v) => (
                  <div
                    key={v._id}
                    onClick={() => addItem(v)}
                    className="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors group">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-800 group-hover:text-emerald-700">
                          {v.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          SKU: {v.sku}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        {v.costPrice?.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Item Table */}
        {items.length > 0 && (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-linear-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-800">Purchase Items</h3>
                <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {items.length} items
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      Item
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      Qty
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      Cost Price
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      Sale Price
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      Total
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-gray-800">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            SKU: {item.sku}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) =>
                            updateItem(idx, "qty", e.target.value)
                          }
                          className="w-24 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none transition-all text-center"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.costPrice}
                            onChange={(e) =>
                              updateItem(idx, "costPrice", e.target.value)
                            }
                            className="w-32 pl-7 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none transition-all"
                          />
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.salePrice}
                            onChange={(e) =>
                              updateItem(idx, "salePrice", e.target.value)
                            }
                            className="w-32 pl-7 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none transition-all"
                          />
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-800">
                        {(item.qty * item.costPrice).toFixed(2)}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-2 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary & Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-linear-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-800 mb-4">
                Payment Summary
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="text-xl font-bold text-gray-800">
                    {totalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-gray-600">
                  <span>Paid Amount</span>
                  <span className="text-lg font-bold text-green-600">
                    {paidAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="font-semibold text-gray-700">
                    Due Amount
                  </span>
                  <span
                    className={`text-lg font-bold ${dueAmount > 0 ? "text-orange-600" : "text-green-600"}`}>
                    {dueAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          <div className="lg:col-span-2">
            <div className="bg-linear-to-br from-violet-50 to-indigo-50/50 border border-gray-200 rounded-xl p-5 h-full">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-violet-600" />
                <h3 className="font-semibold text-gray-800">
                  Additional Notes
                </h3>
              </div>

              <textarea
                {...register("notes")}
                placeholder="Add any notes about this purchase..."
                rows="4"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white/80 text-gray-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={!supplier || items.length === 0}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all ${
              !supplier || items.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            }`}>
            <Plus size={18} />
            Create Purchase
          </button>
        </div>
      </div>
    </form>
  );
}

/* ---------------------------------------
 Supplier Select (Async)
---------------------------------------- */
function SupplierSelect({ value, onChange }) {
  const { request } = useApi();
  const [list, setList] = useState([]);

  useEffect(() => {
    request("/suppliers?limit=20", "GET").then((res) =>
      setList(res?.data || []),
    );
  }, []);

  return (
    <div className="relative">
      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <select
        value={value?._id || ""}
        onChange={(e) => onChange(list.find((s) => s._id === e.target.value))}
        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none">
        <option value="" className="text-gray-400">
          Select Supplier
        </option>
        {list.map((s) => (
          <option key={s._id} value={s._id} className="text-gray-800">
            {s.name}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
    </div>
  );
}
