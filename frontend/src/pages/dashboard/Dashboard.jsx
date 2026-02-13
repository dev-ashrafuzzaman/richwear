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
import useApi from "../../hooks/useApi";

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
              className={`inline-flex p-3 rounded-xl ${bgColors[color]} mb-4`}
            >
              <div
                className={`p-2 rounded-lg bg-linear-to-br ${colors[color]}`}
              >
                {icon}
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {typeof value === "number"
                ? title.includes("Revenue")
                  ? `${value.toLocaleString()}`
                  : value.toLocaleString()
                : value}
            </h3>
          </div>
        </div>
      </div>
    );
  },
);

/* ---------- SalesChart Component ---------- */
const SalesChart = ({ data }) => {
  const [timeRange, setTimeRange] = useState("week");

  // Format sales data for the chart
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    return data.map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-US", {
        weekday: "short",
      }),
      sales: item.sales,
      orders: item.orders,
    }));
  }, [data]);

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
      </div>

      <div className="relative w-full min-h-75">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
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
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value, name) => {
                if (name === "sales")
                  return [`${value.toLocaleString()}`, "Sales"];
                return [value, name];
              }}
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
    </div>
  );
};

/* ---------- CategoryDistribution Component ---------- */
const CategoryDistribution = ({ data }) => {
  // Default colors if not provided in API
  const defaultColors = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"];

  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      // Return empty array or placeholder data
      return [];
    }

    return data.map((item, index) => ({
      ...item,
      color: item.color || defaultColors[index % defaultColors.length],
    }));
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Category Distribution
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No category data available
        </p>
      </div>
    );
  }

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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative w-full h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, "Share"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          {chartData?.map((category, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                ></div>
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
                  {category.sales?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------- RecentTransactions Component ---------- */
const RecentTransactions = ({ transactions }) => {
  const statusColors = {
    COMPLETED:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    PENDING:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    REFUNDED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };

  // Format transactions for display
  const formattedTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return [];

    return transactions.map((t) => ({
      id: t.id,
      customer: t.customerId?.substring(0, 8) + "..." || "Unknown",
      amount: `${t.amount.toLocaleString()}`,
      status: t.status,
      time: new Date(t.createdAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
  }, [transactions]);

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
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <th className="text-left pb-3 font-medium text-gray-500 dark:text-gray-400">
                Invoice
              </th>
              {/* <th className="text-left pb-3 font-medium text-gray-500 dark:text-gray-400">
                Customer
              </th> */}
              <th className="text-left pb-3 font-medium text-gray-500 dark:text-gray-400">
                Amount
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
            {formattedTransactions?.map((transaction) => (
              <tr
                key={transaction.id}
                className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
              >
                <td className="py-4">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {transaction.id}
                  </p>
                </td>
                {/* <td className="py-4">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {transaction.customer}
                  </p>
                </td> */}
                <td className="py-4">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {transaction.amount}
                  </p>
                </td>
                <td className="py-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColors[transaction.status] || "bg-gray-100 text-gray-700"}`}
                  >
                    {transaction.status.charAt(0).toUpperCase() +
                      transaction.status.slice(1).toLowerCase()}
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
          Showing {formattedTransactions?.length} recent transactions
        </p>
      </div>
    </div>
  );
};

/* ---------- LowStockAlert Component ---------- */
const LowStockAlert = ({ products, onRefresh }) => {
  if (!products || products.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
            <Package className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Low Stock Alert
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              All products are well stocked
            </p>
          </div>
        </div>
      </div>
    );
  }

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
        <Button variant="ghost" size="sm" onClick={onRefresh} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {products?.map((product, index) => (
          <div
            key={product.id || index}
            className="flex items-center justify-between p-4 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-900/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {product.name || "Unknown Product"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  SKU: {product.sku || "N/A"} •{" "}
                  {product.category || "Uncategorized"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {product.stock || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  / {product.threshold || 10} min
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- PerformanceMetrics Component ---------- */
const PerformanceMetrics = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6"
          >
            <p className="text-gray-400 dark:text-gray-500">
              No data available
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Avg. Order Value
          </span>
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          ${metrics?.avgOrder?.toLocaleString() || 0}
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Items per Order
          </span>
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {metrics?.itemsPerOrder || 0}
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total Orders
          </span>
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {metrics?.orders || 0}
        </div>
      </div>
    </div>
  );
};

/* ---------- API Integration Helper ---------- */
const useDashboardData = () => {
  const { request, loading } = useApi();

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await request(
        "/dashboard",
        "GET",
        {},
        {
          retries: 2,
          useToast: false,
        },
      );

      // Handle the response structure based on your actual API
      setData(res?.data || res || null);
      setError(null);
    } catch (err) {
      console.error("Dashboard API error:", err);
      setError("Failed to fetch dashboard data");
    }
  }, [request]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
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
      path: "/products",
    },
    {
      label: "View Reports",
      icon: BarChart3,
      color: "bg-purple-500",
      path: "/reports/sales",
    },
    {
      label: "Manage Inventory",
      icon: Package,
      color: "bg-amber-500",
      path: "/reports/stocks",
    },
  ];

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
          <Button variant="outline" onClick={refetch} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {quickActions?.map((action, index) => (
          <button
            key={index}
            onClick={() => (window.location.href = action.path)}
            className="group bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex flex-col items-center text-center">
              <div
                className={`p-3 rounded-lg ${action.color} mb-3 group-hover:scale-110 transition-transform`}
              >
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
          value={data?.summary?.revenue?.value}
          icon={<DollarSign className="w-5 h-5 text-white" />}
          color="green"
        />
        <StatCard
          title="Total Orders"
          value={data?.summary?.orders?.value}
          icon={<ShoppingBag className="w-5 h-5 text-white" />}
          color="blue"
        />
        <StatCard
          title="Products"
          value={data?.summary?.products?.value}
          icon={<Package className="w-5 h-5 text-white" />}
          color="purple"
        />
        <StatCard
          title="Customers"
          value={data?.summary?.customers?.value}
          icon={<Users className="w-5 h-5 text-white" />}
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <SalesChart data={data?.salesData} />
          <RecentTransactions transactions={data?.recentTransactions} />
        </div>

        {/* Right Column - Alerts & Transactions (1/3 width) */}
        <div className="space-y-6">
          <LowStockAlert
            products={data?.lowStockProducts}
            onRefresh={refetch}
          />
          <CategoryDistribution data={data?.topCategories} />
        </div>
      </div>

      {/* Performance Metrics - Full Width */}
      <div className="mt-6">
        <PerformanceMetrics metrics={data?.performance} />
      </div>
    </div>
  );
}
