import { useForm, Controller, useWatch } from "react-hook-form";
import { useMemo, useState } from "react";
import Page from "../../components/common/Page";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import ReportSmartSelect from "../../components/common/ReportSmartSelect";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import {
  BarChart3,
  RefreshCw,
  Printer,
  Calendar,
  Building2,
  Tags,
  User,
  TrendingUp,
  Package,
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Users,
  ShoppingCart,
  Receipt,
  FileText,
} from "lucide-react";

export default function SalesReportPage() {
  const { axiosSecure } = useAxiosSecure();

  const { control, reset } = useForm({
    defaultValues: {
      groupBy: "product",
    },
  });

  const filters = useWatch({ control });

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [salespersonAnalytics, setSalespersonAnalytics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("products");

  /* ================= GENERATE ================= */

  const handleGenerate = async () => {
    if (!filters.from || !filters.to) {
      setError("Date range is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        branchId: filters.branch?._id,
        from: filters.from,
        to: filters.to,
        groupBy: filters.groupBy,
        categoryId: filters.category?._id,
        salespersonId: filters.salesperson?._id,
        compareFrom: filters.compareFrom,
        compareTo: filters.compareTo,
      };

      const res = await axiosSecure.post("sales/reports", payload);
      setRows(res.data.rows || []);
      setSummary(res.data.summary || null);
      setComparison(res.data.comparison || null);
      setSalespersonAnalytics(res.data.salespersonAnalytics || []);
      setGenerated(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to generate report",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    reset({
      groupBy: "product",
      branch: null,
      category: null,
      salesperson: null,
      from: "",
      to: "",
      compareFrom: "",
      compareTo: "",
    });
    setRows([]);
    setSummary(null);
    setComparison(null);
    setSalespersonAnalytics([]);
    setGenerated(false);
    setError(null);
  };

  /* ================= FORMATTERS ================= */

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "-";
    return `${Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return "-";
    return Number(value).toLocaleString();
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return "-";
    return `${Number(value).toFixed(2)}%`;
  };

  /* ================= SUMMARY CARDS ================= */

  const summaryItems = useMemo(() => {
    if (!summary) return [];

    return [
      {
        label: "Total Revenue",
        value: summary.totalRevenue,
        icon: <DollarSign className="w-5 h-5" />,
        color: "emerald",
        prefix: "",
        format: "currency",
      },
      {
        label: "Total Orders",
        value: summary.totalOrders,
        icon: <ShoppingCart className="w-5 h-5" />,
        color: "blue",
        format: "number",
      },
      {
        label: "Products Sold",
        value: summary.totalProductsSold,
        icon: <Package className="w-5 h-5" />,
        color: "purple",
        format: "number",
      },
      {
        label: "Avg Order Value",
        value: summary.avgOrderValue,
        icon: <Receipt className="w-5 h-5" />,
        color: "amber",
        prefix: "",
        format: "currency",
      },
      {
        label: "Gross Margin",
        value: summary.grossMargin,
        icon: <Percent className="w-5 h-5" />,
        color: "green",
        suffix: "%",
        format: "percent",
      },
      {
        label: "Total COGS",
        value: summary.totalCOGS,
        icon: <FileText className="w-5 h-5" />,
        color: "gray",
        prefix: "",
        format: "currency",
      },
      {
        label: "Total Returns",
        value: summary.totalReturns,
        icon: <ArrowDownRight className="w-5 h-5" />,
        color: "rose",
        prefix: "",
        format: "currency",
      },
      {
        label: "Return Rate",
        value: summary.returnRate,
        icon: <Percent className="w-5 h-5" />,
        color: "orange",
        suffix: "%",
        format: "percent",
      },
    ];
  }, [summary]);

  /* ================= TABLE COLUMNS ================= */

  const columns = useMemo(() => {
    if (filters.groupBy === "day") {
      return [
        { key: "name", label: "Date", icon: <Calendar className="w-4 h-4" /> },
        {
          key: "totalQty",
          label: "Qty",
          icon: <Package className="w-4 h-4" />,
        },
        {
          key: "totalRevenue",
          label: "Revenue",
          icon: <DollarSign className="w-4 h-4" />,
        },
        {
          key: "totalGross",
          label: "Gross",
          icon: <TrendingUp className="w-4 h-4" />,
        },
        {
          key: "totalDiscount",
          label: "Discount",
          icon: <Percent className="w-4 h-4" />,
        },
        {
          key: "profit",
          label: "Profit",
          icon: <DollarSign className="w-4 h-4" />,
        },
        {
          key: "margin",
          label: "Margin",
          icon: <Percent className="w-4 h-4" />,
        },
      ];
    }

    return [
      {
        key: "name",
        label: filters.groupBy === "product" ? "Product" : "Variant",
        icon: <Tags className="w-4 h-4" />,
      },
      {
        key: "totalQty",
        label: "Qty Sold",
        icon: <Package className="w-4 h-4" />,
      },
      {
        key: "totalRevenue",
        label: "Revenue",
        icon: <DollarSign className="w-4 h-4" />,
      },
      {
        key: "totalGross",
        label: "Gross Sales",
        icon: <TrendingUp className="w-4 h-4" />,
      },
      {
        key: "totalReturns",
        label: "Returns",
        icon: <ArrowDownRight className="w-4 h-4" />,
      },
      {
        key: "totalDiscount",
        label: "Discount",
        icon: <Percent className="w-4 h-4" />,
      },
      {
        key: "profit",
        label: "Profit",
        icon: <DollarSign className="w-4 h-4" />,
      },
      {
        key: "margin",
        label: "Margin %",
        icon: <Percent className="w-4 h-4" />,
      },
    ];
  }, [filters.groupBy]);

  /* ================= RENDER CELL ================= */

  const renderCellValue = (row, column) => {
    const value = row[column.key];
    if (value === null || value === undefined) return "-";

    if (
      column.key.includes("Revenue") ||
      column.key.includes("Gross") ||
      column.key.includes("Profit") ||
      column.key === "totalCOGS" ||
      column.key.includes("Returns") ||
      column.key.includes("Discount")
    ) {
      return formatCurrency(value);
    }

    if (column.key === "margin" || column.key.includes("Rate")) {
      return formatPercent(value);
    }

    if (typeof value === "number") {
      return formatNumber(value);
    }

    return value;
  };

  return (
    <Page title="Sales Reports">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-linear-to-br from-indigo-600 to-blue-600 rounded-xl shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sales Analytics Report
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <span>Enterprise sales performance & analytics</span>
              {generated && summary && (
                <>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span className="text-gray-600">
                    {formatCurrency(summary.totalRevenue)} total revenue
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
      {/* ===== FILTERS CARD ===== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
        <div className="px-6 py-4 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Report Parameters
            </h2>
          </div>
        </div>

        <div className="p-6">
          {/* Primary Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <div className="relative z-30">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Branch <span className="text-red-500">*</span>
              </label>
              <Controller
                name="branch"
                control={control}
                render={({ field }) => (
                  <ReportSmartSelect
                    route="/branches"
                    displayField={["code", "name"]}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select branch"
                    className="w-full"
                  />
                )}
              />
            </div>

            <div className="relative z-30">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Category
              </label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <ReportSmartSelect
                    route="/categories"
                    extraParams={{ level: 2 }}
                    displayField={["name"]}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select category"
                    className="w-full"
                  />
                )}
              />
            </div>

            <div className="relative z-30">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Salesperson
              </label>
              <Controller
                name="salesperson"
                control={control}
                render={({ field }) => (
                  <ReportSmartSelect
                    route="/employees"
                    extraParams={{ roleName: "Salesman" }}
                    displayField={["code", "name"]}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select salesperson"
                    className="w-full"
                  />
                )}
              />
            </div>

            <div className="relative z-30">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Group By
              </label>
              <Controller
                name="groupBy"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { label: "Product", value: "product" },
                      { label: "Variant", value: "variant" },
                      { label: "Day", value: "day" },
                    ]}
                    className="w-full"
                  />
                )}
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                From Date <span className="text-red-500">*</span>
              </label>
              <Controller
                name="from"
                control={control}
                render={({ field }) => (
                  <input
                    type="date"
                    {...field}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                To Date <span className="text-red-500">*</span>
              </label>
              <Controller
                name="to"
                control={control}
                render={({ field }) => (
                  <input
                    type="date"
                    {...field}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Compare From
              </label>
              <Controller
                name="compareFrom"
                control={control}
                render={({ field }) => (
                  <input
                    type="date"
                    {...field}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Compare To
              </label>
              <Controller
                name="compareTo"
                control={control}
                render={({ field }) => (
                  <input
                    type="date"
                    {...field}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
                  />
                )}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleGenerate}
                disabled={loading || !filters.from || !filters.to}
                className="bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </span>
                ) : (
                  "Generate Report"
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleReset}
                className="border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-2.5"
              >
                Reset Filters
              </Button>
            </div>

            {generated && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="border-gray-300 hover:border-gray-400 text-gray-700"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-300 hover:border-gray-400 text-gray-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* ===== SUMMARY DASHBOARD ===== */}
      {summary && (
        <>
          {/* Comparison Banner */}
          {comparison && (
            <div className="mb-6 bg-linear-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Period Comparison
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(
                        filters.compareFrom || filters.from,
                      ).toLocaleDateString()}{" "}
                      -{" "}
                      {new Date(
                        filters.compareTo || filters.to,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Previous</p>
                    <p className="font-semibold">
                      {formatCurrency(comparison.previousRevenue)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Current</p>
                    <p className="font-semibold">
                      {formatCurrency(comparison.currentRevenue)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Growth</p>
                    <div className="flex items-center gap-1">
                      {comparison.growthPercent >= 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-rose-600" />
                      )}
                      <span
                        className={`font-bold ${
                          comparison.growthPercent >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {comparison.growthPercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 mb-8">
            {summaryItems.map((item, i) => {
              const colorClasses = {
                emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
                blue: "bg-blue-50 border-blue-200 text-blue-700",
                purple: "bg-purple-50 border-purple-200 text-purple-700",
                amber: "bg-amber-50 border-amber-200 text-amber-700",
                green: "bg-green-50 border-green-200 text-green-700",
                rose: "bg-rose-50 border-rose-200 text-rose-700",
                orange: "bg-orange-50 border-orange-200 text-orange-700",
                gray: "bg-gray-50 border-gray-200 text-gray-700",
              };

              return (
                <div
                  key={i}
                  className={`bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${colorClasses[item.color]}`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">
                        {item.label}
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-0.5">
                        {item.format === "currency" &&
                          formatCurrency(item.value)}
                        {item.format === "number" && formatNumber(item.value)}
                        {item.format === "percent" && formatPercent(item.value)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex gap-6">
              <button
                onClick={() => setActiveTab("products")}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "products"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Tags className="w-4 h-4 inline-block mr-2" />
                {filters.groupBy === "day"
                  ? "Daily Breakdown"
                  : "Product Analysis"}
              </button>
              {salespersonAnalytics.length > 0 && (
                <button
                  onClick={() => setActiveTab("salespeople")}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "salespeople"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Users className="w-4 h-4 inline-block mr-2" />
                  Sales Performance
                </button>
              )}
            </nav>
          </div>
        </>
      )}

      {/* ===== PRODUCTS/VARIANTS TABLE ===== */}
      {generated && activeTab === "products" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Tags className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {filters.groupBy === "day"
                      ? "Daily Sales Breakdown"
                      : filters.groupBy === "product"
                        ? "Product Performance"
                        : "Variant Performance"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {rows.length} items • Sorted by revenue
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                Grouped by {filters.groupBy}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      <div className="flex items-center gap-2">
                        {col.icon}
                        {col.label}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-12 text-center"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-8 h-8 text-gray-300 animate-spin" />
                        <p className="text-gray-500 font-medium">
                          Loading report data...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-12 text-center"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Package className="w-12 h-12 text-gray-300" />
                        <div>
                          <p className="text-gray-500 font-medium">
                            No sales data found
                          </p>
                          <p className="text-gray-400 text-sm mt-1">
                            Try adjusting your filters or date range
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      {columns.map((col) => (
                        <td key={col.key} className="px-6 py-4 text-sm">
                          {col.key === "name" ? (
                            <span className="font-medium text-gray-900">
                              {row[col.key]}
                            </span>
                          ) : col.key === "margin" ? (
                            <span
                              className={`font-semibold ${
                                row.margin >= 0
                                  ? "text-emerald-600"
                                  : "text-rose-600"
                              }`}
                            >
                              {renderCellValue(row, col)}
                            </span>
                          ) : (
                            <span className="text-gray-700">
                              {renderCellValue(row, col)}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {rows.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Showing {rows.length} records
                </span>
                <span className="text-gray-600 font-medium">
                  Total Revenue: {formatCurrency(summary.totalRevenue)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== SALESPERSON ANALYTICS TABLE ===== */}
      {generated &&
        activeTab === "salespeople" &&
        salespersonAnalytics.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Salesperson Performance
                  </h2>
                  <p className="text-sm text-gray-500">
                    Individual sales performance analytics
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Salesperson
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Orders
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Items Sold
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Total Sales
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4" />
                        Avg Order Value
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {salespersonAnalytics.map((sp, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">
                          {sp._id?.code || sp._id?.name || sp._id}
                        </span>
                        {sp._id?.name && sp._id?.code && (
                          <span className="block text-xs text-gray-500 mt-0.5">
                            {sp._id.code}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatNumber(sp.totalOrders)}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatNumber(sp.totalProductsSold || 0)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(sp.totalSales)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatCurrency(sp.avgOrderValue || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Total Salespeople: {salespersonAnalytics.length}
                </span>
                <span className="text-gray-600 font-medium">
                  Team Revenue:{" "}
                  {formatCurrency(
                    salespersonAnalytics.reduce(
                      (acc, sp) => acc + (sp.totalSales || 0),
                      0,
                    ),
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
    </Page>
  );
}
