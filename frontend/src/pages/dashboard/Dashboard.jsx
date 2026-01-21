import React, { useMemo, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import Button from "../../components/ui/Button";
import MainLayout from "../../layouts/MainLayout";
import { useAuth } from "../../context/useAuth";

/**
 * Mock data: replace with real API calls as needed.
 */
const SALES_DATA = [
  { date: "10 Mar", sales: 400, visitors: 240 },
  { date: "11 Mar", sales: 300, visitors: 200 },
  { date: "12 Mar", sales: 520, visitors: 160 },
  { date: "13 Mar", sales: 420, visitors: 300 },
  { date: "14 Mar", sales: 350, visitors: 140 },
  { date: "15 Mar", sales: 480, visitors: 320 },
  { date: "16 Mar", sales: 600, visitors: 240 },
  { date: "17 Mar", sales: 430, visitors: 310 },
  { date: "18 Mar", sales: 540, visitors: 360 },
  { date: "19 Mar", sales: 380, visitors: 190 },
  { date: "20 Mar", sales: 650, visitors: 420 },
  { date: "21 Mar", sales: 300, visitors: 180 },
];

const PRODUCTS_MOCK = new Array(8).fill(0).map((_, i) => ({
  id: i + 1,
  name: [
    "Copier",
    "Clock",
    "Curling iron",
    "Headphone",
    "Keyboard",
    "Mouse",
    "Monitor",
    "Camera",
  ][i],
  sku: "SKU" + (1000 + i),
  category: [
    "Tablets",
    "Tablets",
    "Gaming consoles",
    "Accessories",
    "Peripherals",
    "Peripherals",
    "Displays",
    "Cameras",
  ][i],
  brand: [
    "BrandA",
    "BrandB",
    "BrandC",
    "BrandD",
    "BrandE",
    "BrandF",
    "BrandG",
    "BrandH",
  ][i],
  price: (Math.random() * 900 + 50).toFixed(2),
  stock: Math.round(Math.random() * 200),
  views: Math.round(Math.random() * 80_000) / 1000 + "k",
  status: Math.random() > 0.85 ? "Limited" : "Available",
}));

/* ---------- Small UI pieces ---------- */

const StatCard = React.memo(({ title, value, accent, trend }) => {
  const accentBg = {
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  }[accent || "blue"];

  return (
    <div className="group relative rounded-2xl p-5 border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all">
      <div
        className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${accentBg} mb-2`}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className="opacity-90">
          <path
            d="M4 19h16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"></path>
          <path
            d="M8 12l3 3 6-6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"></path>
        </svg>
      </div>

      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
      {trend && <p className="text-xs text-green-500 mt-2">{trend}</p>}
    </div>
  );
});

/* ---------- Chart Component ---------- */
const SalesChart = ({ data = SALES_DATA }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold">Sales Report</h4>
        <div className="flex items-center gap-2">
          <button className="text-sm px-3 py-1 rounded-md bg-gray-100">
            Daily
          </button>
          <button className="text-sm px-3 py-1 rounded-md bg-gray-200">
            Monthly
          </button>
          <button className="text-sm px-3 py-1 rounded-md bg-gray-100">
            Yearly
          </button>
        </div>
      </div>

      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 12, left: -8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="sales"
              name="Sales"
              stackId="a"
              radius={[8, 8, 0, 0]}
              barSize={18}
            />
            <Bar
              dataKey="visitors"
              name="Visitors"
              stackId="a"
              radius={[8, 8, 0, 0]}
              barSize={12}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ---------- Widgets Column ---------- */
const RightWidgets = React.memo(() => {
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Earning</p>
            <h3 className="text-2xl font-bold">$16.4k</h3>
          </div>
          <div className="space-y-1">
            <div className="w-12 h-12 rounded-md bg-gradient-to-br from-blue-400 to-indigo-600"></div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          {[60, 80, 50, 70, 40].map((v, i) => (
            <div
              key={i}
              className="flex-1 h-16 rounded-md bg-gray-100 flex items-end">
              <div
                style={{ height: `${(v / 100) * 100}%` }}
                className="w-full bg-blue-400 rounded-b-md"></div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Closed Orders</p>
          <h3 className="text-xl font-bold">45%</h3>
        </div>
        <div className="w-14 h-14 rounded-full border-4 border-green-200 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-sm font-semibold">
            45%
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-sm text-gray-500">Orders</p>
        <h3 className="text-xl font-bold">22.6k</h3>
        <div className="mt-3 h-16">
          <svg viewBox="0 0 200 50" className="w-full h-full">
            <path
              d="M0 40 Q40 10 80 30 T200 25"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
});

/* ---------- Products Table ---------- */
const ProductsTable = ({ products = PRODUCTS_MOCK }) => {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );

    list.sort((a, b) => {
      const av = String(a[sortKey] ?? "").toLowerCase();
      const bv = String(b[sortKey] ?? "").toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [products, query, sortKey, sortDir]);

  const toggleSort = useCallback(
    (key) => {
      if (key === sortKey) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey]
  );

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-semibold">Products Table</h4>
        <div className="flex gap-2 items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="px-3 py-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-200"
          />
          <Button
            className="btn-primary"
            onClick={() => alert("Add product (demo)")}>
            Add
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              <th className="p-3">
                <input type="checkbox" />
              </th>
              <th
                className="p-3 cursor-pointer"
                onClick={() => toggleSort("name")}>
                Name
              </th>
              <th
                className="p-3 cursor-pointer"
                onClick={() => toggleSort("category")}>
                Category
              </th>
              <th className="p-3">Brand</th>
              <th
                className="p-3 cursor-pointer"
                onClick={() => toggleSort("price")}>
                Price
              </th>
              <th
                className="p-3 cursor-pointer"
                onClick={() => toggleSort("stock")}>
                Stock
              </th>
              <th className="p-3">Views</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">
                  <input type="checkbox" />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-sm">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.sku}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-sm text-gray-600">{p.category}</td>
                <td className="p-3 text-sm">{p.brand}</td>
                <td className="p-3 font-medium">${p.price}</td>
                <td className="p-3 text-sm">
                  <div
                    className={`${
                      p.status === "Available"
                        ? "text-emerald-600"
                        : "text-orange-500"
                    }`}>
                    {p.status === "Available" ? "Available" : "Limited Supply"}
                    <div className="text-xs text-gray-400">{p.stock} stock</div>
                  </div>
                </td>
                <td className="p-3 text-sm text-gray-600">{p.views}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button className="action-view px-2 py-1 rounded">
                      View
                    </button>
                    <button className="action-edit px-2 py-1 rounded">
                      Edit
                    </button>
                    <button className="action-delete px-2 py-1 rounded">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-400">
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------- Main Dashboard Page ---------- */

export default function Dashboard() {
  const { user } = useAuth?.() ?? {};
  // compute totals quickly
  const totals = useMemo(() => {
    const revenue = 120000;
    const expenses = 85000;
    const active = 1254;
    const pending = 12300;
    return { revenue, expenses, active, pending };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.username ?? "User"} 👋
        </h1>
        <p className="text-gray-500 mt-2">
          Here’s an overview of your latest financial activity.
        </p>
      </div>

      {/* Quick stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${(totals.revenue / 1000).toFixed(1)}k`}
          accent="blue"
          trend="↑ 4.3%"
        />
        <StatCard
          title="Total Expenses"
          value={`$${(totals.expenses / 1000).toFixed(1)}k`}
          accent="red"
          trend="↓ 1.4%"
        />
        <StatCard
          title="Active Accounts"
          value={totals.active.toLocaleString()}
          accent="green"
          trend="↑ 7.2%"
        />
        <StatCard
          title="Pending Payments"
          value={`$${(totals.pending / 1000).toFixed(1)}k`}
          accent="amber"
          trend="↑ 3.6%"
        />
      </section>

      {/* Main grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SalesChart data={SALES_DATA} />

          <ProductsTable products={PRODUCTS_MOCK} />
        </div>

        <aside className="space-y-6">
          <RightWidgets />
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h4 className="text-lg font-semibold">Quick Actions</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                className="btn-primary"
                onClick={() => alert("Create invoice demo")}>
                Create Invoice
              </Button>
              <Button
                className="btn-outlined"
                onClick={() => alert("Export demo")}>
                Export
              </Button>
              <Button
                className="btn-ghost"
                onClick={() => alert("Settings demo")}>
                Settings
              </Button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
