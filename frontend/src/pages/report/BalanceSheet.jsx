import { useEffect, useState } from "react";
import { Calendar, Printer, Download, Filter, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import Page from "../../components/common/Page";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import useAxiosSecure from "../../hooks/useAxiosSecure";

const BalanceSheet = () => {
  const { axiosSecure } = useAxiosSecure();
  const [data, setData] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("assets");

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await axiosSecure.get("/reports/balance-sheet", {
        params: { to: date },
      });
      setData(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const downloadPDF = () => {
    // PDF generation logic here
  };

  const exportToCSV = () => {
    // CSV export logic here
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getAccountTypeColor = (type) => {
    const colors = {
      asset: "text-blue-600",
      liability: "text-red-600",
      equity: "text-purple-600",
    };
    return colors[type] || "text-gray-700";
  };

  return (
    <Page title="Balance Sheet">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* 🔹 Header with Stats */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Balance Sheet</h1>
            <p className="text-gray-600 mt-1">Track your company's financial position at a glance</p>
          </div>
          
          {data && (
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-lg ${data.totals.isBalanced ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                <div className="flex items-center gap-2">
                  {data.totals.isBalanced ? (
                    <TrendingUp size={16} />
                  ) : (
                    <TrendingDown size={16} />
                  )}
                  <span className="font-semibold">
                    {data.totals.isBalanced ? "Balanced" : "Unbalanced"}
                  </span>
                </div>
                <div className="text-xs mt-0.5">
                  {data.totals.isBalanced ? "Assets = Liabilities + Equity" : "Check for discrepancies"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 🔹 Control Panel */}
        <Card className="print:hidden border border-gray-200">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    As of Date
                  </div>
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-end gap-2">
                <Button 
                  onClick={fetchReport} 
                  disabled={loading}
                  className="w-full md:w-auto"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Filter size={16} className="mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outlined"
                prefix={<Printer size={16} />}
                onClick={() => window.print()}
                className="hover:bg-gray-50"
              >
                Print
              </Button>
              <Button
                variant="outlined"
                prefix={<Download size={16} />}
                onClick={downloadPDF}
                className="hover:bg-gray-50"
              >
                PDF
              </Button>
            </div>
          </div>
        </Card>

        {/* 🔹 Mobile Section Toggle */}
        <div className="print:hidden lg:hidden flex border-b border-gray-200">
          {["assets", "liabilities", "equity"].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`flex-1 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeSection === section
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {section}
            </button>
          ))}
        </div>

        {/* 🔹 Report Content */}
        {data && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* Desktop Layout */}
            <div className="hidden lg:grid lg:grid-cols-3 divide-x divide-gray-200">
              {/* ASSETS */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Assets</h2>
                  <div className="text-sm text-gray-500">
                    {data.assets.length} items
                  </div>
                </div>
                
                <div className="space-y-3">
                  {data.assets.map((a, i) => (
                    <div
                      key={i}
                      className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${getAccountTypeColor('asset')}`} />
                          <span className="font-medium text-gray-900">{a.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 ml-4">{a.code}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(a.amount)}
                        </div>
                        <div className="text-xs text-gray-500">Current</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Total Assets</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(data.totals.assets)}
                    </span>
                  </div>
                </div>
              </div>

              {/* LIABILITIES */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Liabilities</h2>
                  <div className="text-sm text-gray-500">
                    {data.liabilities.length} items
                  </div>
                </div>
                
                <div className="space-y-3">
                  {data.liabilities.map((l, i) => (
                    <div
                      key={i}
                      className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${getAccountTypeColor('liability')}`} />
                          <span className="font-medium text-gray-900">{l.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 ml-4">{l.code}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(l.amount)}
                        </div>
                        <div className="text-xs text-gray-500">Current</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Total Liabilities</span>
                    <span className="text-lg font-bold text-red-600">
                      {formatCurrency(data.totals.liabilities)}
                    </span>
                  </div>
                </div>
              </div>

              {/* EQUITY */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Equity</h2>
                  <div className="text-sm text-gray-500">
                    {data.equity.length} items
                  </div>
                </div>
                
                <div className="space-y-3">
                  {data.equity.map((e, i) => (
                    <div
                      key={i}
                      className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${getAccountTypeColor('equity')}`} />
                        <span className="font-medium text-gray-900">{e.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(e.amount)}
                        </div>
                        {e.code && (
                          <div className="text-xs text-gray-500">{e.code}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4 mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Total Equity</span>
                    <span className="text-lg font-bold text-purple-600">
                      {formatCurrency(data.totals.equity)}
                    </span>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Liabilities + Equity</span>
                      <span>Total</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">Balance Check</span>
                      <span className={`text-lg font-bold ${
                        data.totals.isBalanced ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(data.totals.liabilitiesPlusEquity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden">
              {["assets", "liabilities", "equity"].map((section) => (
                activeSection === section && (
                  <div key={section} className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                      {section}
                    </h2>
                    
                    <div className="space-y-3">
                      {data[section].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                        >
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.name}
                            </div>
                            {item.code && (
                              <div className="text-xs text-gray-500 mt-1">
                                {item.code}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              {formatCurrency(item.amount)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">
                          Total {section.charAt(0).toUpperCase() + section.slice(1)}
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                          {formatCurrency(data.totals[section])}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                    <span>Assets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-600" />
                    <span>Liabilities</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-600" />
                    <span>Equity</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span>
                    Generated: {new Date(data.asOf).toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    data.totals.isBalanced
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {data.totals.isBalanced ? "✓ Balanced" : "⚠ Unbalanced"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 🔹 Summary Stats */}
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="print:hidden"
          >
            <Card className="border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-700 font-medium">Total Assets</div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">
                    {formatCurrency(data.totals.assets)}
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-sm text-red-700 font-medium">Total Liabilities</div>
                  <div className="text-2xl font-bold text-red-900 mt-1">
                    {formatCurrency(data.totals.liabilities)}
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-700 font-medium">Owner's Equity</div>
                  <div className="text-2xl font-bold text-purple-900 mt-1">
                    {formatCurrency(data.totals.equity)}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </Page>
  );
};

export default BalanceSheet;