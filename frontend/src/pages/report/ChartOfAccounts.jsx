import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Page from "../../components/common/Page";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import { 
  Search, 
  Filter, 
  Download, 
  Printer, 
  ChevronDown, 
  ChevronUp,
  FileText,
  Hash,
  Type,
  Layers
} from "lucide-react";

const ChartOfAccounts = () => {
  const { axiosSecure } = useAxiosSecure();
  const [tbData, setTbData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "GL_Code", direction: "asc" });
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Fixed TB Date
  const fixedTBDate = "12-02-2025";

  useEffect(() => {
    const fetchTB = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = { TBDate: fixedTBDate };
        const res = await axiosSecure.get("/reports/trial-balance/", { params });

        if (res?.data?.data) {
          setTbData(res.data.data);
        } else {
          setTbData(null);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTB();
  }, []);

  // Filter and sort accounts
  const processedAccounts = useMemo(() => {
    if (!tbData?.accounts) return [];

    let filtered = tbData.accounts.filter(account => {
      const matchesSearch = 
        account.GL_Code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.GL_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.Face?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.acc_type?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === "all" || account.acc_type === filterType;

      return matchesSearch && matchesType;
    });

    // Sort accounts
    filtered.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [tbData, searchTerm, filterType, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }));
  };

  const toggleRow = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const getAccountTypes = () => {
    if (!tbData?.accounts) return [];
    return [...new Set(tbData.accounts.map(acc => acc.acc_type).filter(Boolean))];
  };

  const exportToCSV = () => {
    // Simple CSV export implementation
    const headers = ["GL Code", "GL Name", "Face", "Account Type"];
    const csvContent = [
      headers.join(","),
      ...processedAccounts.map(acc => 
        [acc.GL_Code, `"${acc.GL_Name}"`, `"${acc.Face}"`, acc.acc_type].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chart-of-accounts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown className="w-4 h-4 opacity-30" />;
    }
    return sortConfig.direction === "asc" ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  return (
    <Page title="Chart of Accounts">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 print:space-y-3"
      >
        {/* Enhanced Header */}
        <Card className="p-6 shadow-sm border-l-4 border-l-blue-600">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Chart of Accounts
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Comprehensive listing of all general ledger accounts and their properties
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={exportToCSV}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
            </div>
          </div>
        </Card>

        {/* Controls Section */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search accounts by code, name, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter */}
            <div className="w-full md:w-64">
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="all">All Account Types</option>
                  {getAccountTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Stats */}
          {tbData && (
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Hash className="w-4 h-4" />
                <span>{processedAccounts.length} accounts</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Layers className="w-4 h-4" />
                <span>{getAccountTypes().length} account types</span>
              </div>
              {filterType !== "all" && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  <Filter className="w-3 h-3" />
                  <span>Filtered by: {filterType}</span>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Loading State */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center py-12"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600">Loading chart of accounts...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
          >
            <div className="text-red-600 font-semibold mb-2">Failed to Load Data</div>
            <p className="text-red-500 text-sm">
              Please check your connection and try again.
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-4 border-red-300 text-red-600 hover:bg-red-50"
            >
              Retry
            </Button>
          </motion.div>
        )}

        {/* Chart of Account Listing */}
        {tbData && processedAccounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th 
                      className="p-4 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("GL_Code")}
                    >
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        GL Code
                        <SortIcon columnKey="GL_Code" />
                      </div>
                    </th>
                    <th 
                      className="p-4 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("GL_Name")}
                    >
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        GL Name
                        <SortIcon columnKey="GL_Name" />
                      </div>
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-700">
                      Face
                    </th>
                    <th 
                      className="p-4 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("acc_type")}
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Account Type
                        <SortIcon columnKey="acc_type" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {processedAccounts.map((acc, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="p-4 font-mono text-blue-600 font-medium">
                        {acc.GL_Code}
                      </td>
                      <td className="p-4 text-gray-900">
                        {acc.GL_Name}
                      </td>
                      <td className="p-4 text-gray-600">
                        {acc.Face}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {acc.acc_type}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {tbData && processedAccounts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 bg-white rounded-xl border border-gray-200"
          >
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No accounts found
            </h3>
            <p className="text-gray-600 max-w-sm mx-auto">
              {searchTerm || filterType !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "No accounts available in the system"
              }
            </p>
            {(searchTerm || filterType !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                }}
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </motion.div>
        )}
      </motion.div>
    </Page>
  );
};

export default ChartOfAccounts;