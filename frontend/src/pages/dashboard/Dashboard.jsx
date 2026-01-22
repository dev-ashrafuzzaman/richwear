import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  Download,
  Filter,
  MoreVertical,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  AlertCircle,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
} from "lucide-react";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/useAuth";

// Mock API response structure - Replace with actual API calls
const MOCK_API_RESPONSE = {
  summary: {
    revenue: { value: 45280, change: 12.5, trend: "up" },
    orders: { value: 1243, change: 8.2, trend: "up" },
    products: { value: 856, change: -3.1, trend: "down" },
    customers: { value: 2456, change: 15.7, trend: "up" },
  },
  salesData: [
    { date: "Mon", sales: 4200, orders: 45, returns: 3 },
    { date: "Tue", sales: 5200, orders: 52, returns: 2 },
    { date: "Wed", sales: 4800, orders: 49, returns: 5 },
    { date: "Thu", sales: 6100, orders: 58, returns: 4 },
    { date: "Fri", sales: 7500, orders: 67, returns: 6 },
    { date: "Sat", sales: 8900, orders: 82, returns: 8 },
    { date: "Sun", sales: 6800, orders: 61, returns: 5 },
  ],
  topCategories: [
    { name: "T-Shirts", value: 35, color: "#3B82F6", sales: 15800 },
    { name: "Jeans", value: 25, color: "#10B981", sales: 11200 },
    { name: "Dresses", value: 20, color: "#8B5CF6", sales: 8900 },
    { name: "Accessories", value: 15, color: "#F59E0B", sales: 6700 },
    { name: "Footwear", value: 5, color: "#EF4444", sales: 2800 },
  ],
  lowStockProducts: [
    {
      id: 1,
      name: "Classic White Tee",
      sku: "CT-WHT-M",
      stock: 3,
      threshold: 10,
      category: "T-Shirts",
    },
    {
      id: 2,
      name: "Slim Fit Jeans",
      sku: "JEANS-SL-BL",
      stock: 5,
      threshold: 15,
      category: "Jeans",
    },
    {
      id: 3,
      name: "Summer Dress",
      sku: "DRESS-SM-FL",
      stock: 2,
      threshold: 8,
      category: "Dresses",
    },
    {
      id: 4,
      name: "Leather Belt",
      sku: "BELT-LTH-BK",
      stock: 4,
      threshold: 12,
      category: "Accessories",
    },
  ],
  recentTransactions: [
    {
      id: "#INV-2024-001",
      customer: "John Smith",
      amount: 249.99,
      items: 3,
      status: "completed",
      time: "10:30 AM",
    },
    {
      id: "#INV-2024-002",
      customer: "Sarah Johnson",
      amount: 189.5,
      items: 2,
      status: "completed",
      time: "11:45 AM",
    },
    {
      id: "#INV-2024-003",
      customer: "Mike Wilson",
      amount: 425.0,
      items: 5,
      status: "pending",
      time: "1:15 PM",
    },
    {
      id: "#INV-2024-004",
      customer: "Emma Davis",
      amount: 99.99,
      items: 1,
      status: "completed",
      time: "2:30 PM",
    },
    {
      id: "#INV-2024-005",
      customer: "Robert Brown",
      amount: 312.75,
      items: 4,
      status: "refunded",
      time: "3:45 PM",
    },
  ],
  performance: {
    conversion: 4.2,
    avgOrder: 156.8,
    itemsPerOrder: 2.8,
  },
};

/* ---------- StatCard Component ---------- */
const StatCard = React.memo(
  ({ title, value, change, trend, icon, color = "blue" }) => {
    const colors = {
      blue: "from-blue-500 to-cyan-500",
      green: "from-emerald-500 to-green-500",
      purple: "from-purple-500 to-violet-500",
      orange: "from-orange-500 to-amber-500",
    };

    const bgColors = {
      blue: "bg-blue-50 dark:bg-blue-900/20",
      green: "bg-emerald-50 dark:bg-emerald-900/20",
      purple: "bg-purple-50 dark:bg-purple-900/20",
      orange: "bg-orange-50 dark:bg-orange-900/20",
    };

    return (
      <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="flex items-start justify-between">
          <div>
            <div
              className={`inline-flex p-3 rounded-xl ${bgColors[color]} mb-4`}>
              <div
                className={`p-2 rounded-lg bg-linear-to-br ${colors[color]}`}>
                {icon}
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {value}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              {trend === "up" ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${trend === "up" ? "text-emerald-600" : "text-red-600"}`}>
                {change > 0 ? "+" : ""}
                {change}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                from last month
              </span>
            </div>
          </div>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    );
  },
);

/* ---------- SalesChart Component ---------- */
const SalesChart = ({ data }) => {
  const [timeRange, setTimeRange] = useState("week");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sales Overview
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Total revenue & order trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {["day", "week", "month", "year"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                  timeRange === range
                    ? "bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}>
                {range}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="w-4 h-4" />
            Date Range
          </Button>
        </div>
      </div>

      <div className="relative w-full min-h-75">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E5E7EB"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              valueFormatter={(value) => [value, "Sales"]}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#colorSales)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ strokeWidth: 2, r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Sales
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Orders
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>
    </div>
  );
};

/* ---------- RecentTransactions Component ---------- */
const RecentTransactions = ({ transactions }) => {
  const [filter, setFilter] = useState("all");

  const statusColors = {
    completed:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    pending:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    refunded: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Transactions
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Latest sales and returns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {["all", "completed", "pending"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                  filter === status
                    ? "bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}>
                {status}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <th className="text-left pb-3 font-medium text-gray-500 dark:text-gray-400">
                Invoice
              </th>
              <th className="text-left pb-3 font-medium text-gray-500 dark:text-gray-400">
                Customer
              </th>
              <th className="text-left pb-3 font-medium text-gray-500 dark:text-gray-400">
                Amount
              </th>
              <th className="text-left pb-3 font-medium text-gray-500 dark:text-gray-400">
                Items
              </th>
              <th className="text-left pb-3 font-medium text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="text-left pb-3 font-medium text-gray-500 dark:text-gray-400">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="py-4">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {transaction.id}
                  </p>
                </td>
                <td className="py-4">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {transaction.customer}
                  </p>
                </td>
                <td className="py-4">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {transaction.amount}
                  </p>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {transaction.items}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      items
                    </span>
                  </div>
                </td>
                <td className="py-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColors[transaction.status]}`}>
                    {transaction.status.charAt(0).toUpperCase() +
                      transaction.status.slice(1)}
                  </span>
                </td>
                <td className="py-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {transaction.time}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {transactions.length} recent transactions
        </p>
        <Button variant="ghost" size="sm">
          View All Transactions
          <ArrowUpRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

/* ---------- CategoryDistribution Component ---------- */
const CategoryDistribution = ({ data }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Category Distribution
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sales by product category
          </p>
        </div>
        <Button variant="ghost" size="sm">
          <PieChartIcon className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative w-full min-h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, "Share"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          {data.map((category, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {category.value}% of total
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {category.sales}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sales
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------- LowStockAlert Component ---------- */
const LowStockAlert = ({ products, onRefresh }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Low Stock Alert
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Products needing restock
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="btn gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="primary" size="sm" className="gap-2">
            <Package className="w-4 h-4" />
            Order Stock
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between p-4 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-900/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {product.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  SKU: {product.sku} • {product.category}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {product.stock}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  / {product.threshold} min
                </div>
              </div>
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                Low Stock
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- PerformanceMetrics Component ---------- */
const PerformanceMetrics = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Conversion Rate
          </span>
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {metrics.conversion}%
        </div>
        <div className="flex items-center gap-2 mt-2">
          <TrendingUpIcon className="w-4 h-4 text-emerald-500" />
          <span className="text-sm text-emerald-600 dark:text-emerald-400">
            +0.8% from last week
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Avg. Order Value
          </span>
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {metrics.avgOrder}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <TrendingUpIcon className="w-4 h-4 text-emerald-500" />
          <span className="text-sm text-emerald-600 dark:text-emerald-400">
            +2.5% from last week
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <ShoppingBag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Items per Order
          </span>
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {metrics.itemsPerOrder}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <TrendingDownIcon className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400">
            -0.3 from last week
          </span>
        </div>
      </div>
    </div>
  );
};

/* ---------- API Integration Helper ---------- */
const useDashboardData = () => {
  const [data, setData] = useState(MOCK_API_RESPONSE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      // const response = await fetch('/api/dashboard');
      // const result = await response.json();
      // setData(result);

      // Simulating API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setData(MOCK_API_RESPONSE);
      setError(null);
    } catch (err) {
      setError("Failed to fetch dashboard data");
      console.error("Dashboard API error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/* ---------- Main Dashboard Component ---------- */
export default function Dashboard() {
  const { user } = useAuth?.() ?? {};
  const { data, loading, error, refetch } = useDashboardData();

  const quickActions = [
    {
      label: "New Sale",
      icon: ShoppingBag,
      color: "bg-emerald-500",
      path: "/pos",
    },
    {
      label: "Add Product",
      icon: Package,
      color: "bg-blue-500",
      path: "/products/create",
    },
    {
      label: "View Reports",
      icon: BarChart3,
      color: "bg-purple-500",
      path: "/reports",
    },
    {
      label: "Manage Inventory",
      icon: Package,
      color: "bg-amber-500",
      path: "/inventory",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 dark:text-white font-medium mb-2">
            Failed to load data
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={refetch} variant="primary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex bg-white rounded-xl p-4 flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.name || "Admin"}!
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your store today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={refetch} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="primary" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => (window.location.href = action.path)}
            className="group bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-md">
            <div className="flex flex-col items-center text-center">
              <div
                className={`p-3 rounded-lg ${action.color} mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <p className="font-medium text-gray-900 dark:text-white">
                {action.label}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={data.summary.revenue.value}
          change={data.summary.revenue.change}
          trend={data.summary.revenue.trend}
          icon={<DollarSign className="w-5 h-5 text-white" />}
          color="green"
        />
        <StatCard
          title="Total Orders"
          value={data.summary.orders.value}
          change={data.summary.orders.change}
          trend={data.summary.orders.trend}
          icon={<ShoppingBag className="w-5 h-5 text-white" />}
          color="blue"
        />
        <StatCard
          title="Products"
          value={data.summary.products.value}
          change={data.summary.products.change}
          trend={data.summary.products.trend}
          icon={<Package className="w-5 h-5 text-white" />}
          color="purple"
        />
        <StatCard
          title="Customers"
          value={data.summary.customers.value}
          change={data.summary.customers.change}
          trend={data.summary.customers.trend}
          icon={<Users className="w-5 h-5 text-white" />}
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6 min-h-0">
          <SalesChart data={data.salesData} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryDistribution data={data.topCategories} />
            <PerformanceMetrics metrics={data.performance} />
          </div>
        </div>
        <RecentTransactions transactions={data.recentTransactions} />
        {/* Right Column - Alerts & Transactions */}
        <div className="space-y-6">
          <LowStockAlert products={data.lowStockProducts} onRefresh={refetch} />
        </div>
      </div>
    </div>
  );
}
