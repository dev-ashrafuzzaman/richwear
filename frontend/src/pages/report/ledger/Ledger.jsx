import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  BarChart3,
  Calendar,
  FileDown,
  FileText,
  Filter,
  Printer,
  TrendingUp,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import Divider from "../../../components/ui/Divider";
import Page from "../../../components/common/Page";
import useApi from "../../../hooks/useApi";
import SmartSelect from "../../../components/common/SmartSelect";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import { useNavigate } from "react-router-dom";
import useModalManager from "../../../hooks/useModalManager";
import JournalReceiptsModal from "../../accounting/journal/JournalReceiptsModal";
import useTableManager from "../../../hooks/useTableManager";
import usePrint from "../../../hooks/usePrint";
import LedgerPrintContent from "./LedgerPrintContent";
import PrintWrapper from "../../../components/print/PrintWrapper";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const [day, month, year] = dateString.split("-");
  if (!day || !month || !year) return dateString;
  return `${day}/${month}/${year}`;
};

const Ledger = () => {
  const { modals, openModal, closeModal } = useModalManager();
  const [selectedJournal, setSelectedJournal] = useState(null);

  const { data, query, refetch, setQuery } = useTableManager("/journals/", {
    queryKey: "journals",
    transform: (res) => res?.data ?? [],
  });
  console.log("jor", data);

  const handleJournalModal = (id) => {
    if (!data?.length) return;

    const journal = data.find((v) => String(v.jv) === String(id));

    if (!journal) {
      console.warn("Journal not found:", id);
      return;
    }

    setSelectedJournal(journal);
    openModal("journalReceiptsModal");
  };

  const navigate = useNavigate();
  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      glAccount: null,
      subsidiary: null,
    },
  });

  const { request, loading, error } = useApi();
  const [ledgerData, setLedgerData] = useState(null);
  const { axiosSecure } = useAxiosSecure();

  // Watch GL Account changes to determine subsidiary type
  const selectedGlAccount = watch("glAccount");

  const formatToApiDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  };

  // Determine subsidiary type based on GL Account name - ONLY for specific ledgers
  const getSubsidiaryType = (ledger) => {
    if (!ledger?.raw) return null;

    const name = ledger.raw.name?.toLowerCase() || "";
    const code = ledger.raw.gl_code || "";

    // ONLY show subsidiary for these specific ledger types
    if (name.includes("receivable") || code.includes("103")) return "customer";
    if (name.includes("payable") || code.includes("201")) return "supplier";
    if (name.includes("employee") && name.includes("advance"))
      return "employee";

    return null; // For other ledgers, don't show subsidiary
  };

  const onSubmit = async (formData) => {
    if (!formData.glAccount?.value) {
      return alert("Please select a General Ledger first");
    }
    if (!formData.startDate || !formData.endDate) {
      return alert("Please select Start Date and End Date");
    }

    const ledgerId = formData.glAccount.value;
    const startDate = formatToApiDate(formData.startDate);
    const endDate = formatToApiDate(formData.endDate);

    // Build query params
    const params = {
      start_date: startDate,
      end_date: endDate,
    };
    // Add subsidiary_id if selected (not mandatory)
    if (formData.subsidiary?.value) {
      console.log("ss", formData.subsidiary?.value);
      params.subsidiary_id = formData.subsidiary.value;
    }

    try {
      const response = await axiosSecure.get(`/reports/gl/${ledgerId}/`, {
        params: params,
      });

      console.log("✅ Direct fetch success:", response.data);

      if (response.data?.data) {
        setLedgerData(response.data.data);
      } else {
        setLedgerData(response.data);
      }
    } catch (error) {
      console.error("❌ Ledger fetch error:", error);
    }
  };

  const handleReset = () => {
    reset();
    setLedgerData(null);
  };

  // Get subsidiary type for current GL Account
  const subsidiaryType = selectedGlAccount
    ? getSubsidiaryType(selectedGlAccount)
    : null;

  // Check if we should show subsidiary select
  const shouldShowSubsidiary = !!subsidiaryType;

  // Get subsidiary API route based on type
  const getSubsidiaryRoute = () => {
    switch (subsidiaryType) {
      case "customer":
        return "/subsidiaries/?type=customer";
      case "supplier":
        return "/subsidiaries/?type=supplier";
      case "employee":
        return "/subsidiaries/?type=employee";
      default:
        return "/subsidiaries/";
    }
  };

  // Get placeholder text based on subsidiary type
  const getSubsidiaryPlaceholder = () => {
    switch (subsidiaryType) {
      case "customer":
        return "Select Customer...";
      case "supplier":
        return "Select Supplier...";
      case "employee":
        return "Select Employee...";
      default:
        return "Select Subsidiary...";
    }
  };

  const { printRef, print } = usePrint({
    title: "General Ledger Report",
  });

  return (
    <Page title="General Ledger Report">
      {/* Hidden Print Area */}
      <div className="hidden">
        <PrintWrapper ref={printRef}>
          <LedgerPrintContent
            ledgerData={ledgerData}
            subsidiary={watch("subsidiary")}
          />
        </PrintWrapper>
      </div>
      {modals.journalReceiptsModal?.isOpen && (
        <JournalReceiptsModal
          isOpen={modals.journalReceiptsModal.isOpen}
          setIsOpen={() => closeModal("journalReceiptsModal")}
          data={selectedJournal}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 print:space-y-2">
        {/* 🔹 Enhanced Filter Section */}
        <Card className="sticky top-6 z-40 shadow-sm print:hidden mb-10 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              Report Filters
            </h2>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className={`grid gap-5 ${
              shouldShowSubsidiary ? "md:grid-cols-4" : "md:grid-cols-3"
            }`}>
            {/* General Ledger Select */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                General Ledger Account
              </label>
              <Controller
                name="glAccount"
                control={control}
                render={({ field }) => (
                  <SmartSelect
                    customRoute="/general-ledgers/"
                    useApi={true}
                    displayField={["gl_code", "name"]}
                    searchFields={["gl_code", "name"]}
                    onChange={(val) => {
                      field.onChange(val);
                      // Reset subsidiary when GL changes
                      reset({
                        ...watch(),
                        subsidiary: null,
                      });
                    }}
                    placeholder="Select General Ledger..."
                    className="w-full"
                  />
                )}
              />
            </div>

            {/* Subsidiaries Select - Conditionally Shown */}
            {shouldShowSubsidiary && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {subsidiaryType === "customer"
                    ? "Customer"
                    : subsidiaryType === "supplier"
                      ? "Supplier"
                      : subsidiaryType === "employee"
                        ? "Employee"
                        : "Subsidiary"}
                </label>
                <Controller
                  name="subsidiary"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <SmartSelect
                        customRoute={getSubsidiaryRoute()}
                        useApi={true}
                        displayField={["code", "name"]}
                        searchFields={["code", "name"]}
                        onChange={(val) => field.onChange(val)}
                        placeholder={getSubsidiaryPlaceholder()}
                        type={subsidiaryType}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {subsidiaryType === "customer"
                          ? "Filter by customer"
                          : subsidiaryType === "supplier"
                            ? "Filter by supplier"
                            : subsidiaryType === "employee"
                              ? "Filter by employee"
                              : "Filter by subsidiary"}
                      </p>
                    </div>
                  )}
                />
              </div>
            )}

            {/* Date Range */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <Input
                    type="date"
                    prefix={<Calendar size={16} />}
                    {...field}
                    className="w-full"
                  />
                )}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <Input
                    type="date"
                    prefix={<Calendar size={16} />}
                    {...field}
                    className="w-full"
                  />
                )}
              />
            </div>

            {/* Action Buttons */}
            <div
              className={`${
                shouldShowSubsidiary ? "col-span-4" : "col-span-3"
              } flex justify-end gap-3 pt-2 border-t border-gray-200`}>
              <Button
                variant="gradient"
                type="submit"
                disabled={loading}
                className="flex items-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <TrendingUp size={16} />
                    Generate Report
                  </>
                )}
              </Button>
              <Button variant="outlined" type="button" onClick={handleReset}>
                Reset
              </Button>
              <Button
                variant="outlined"
                type="button"
                onClick={() => navigate("/journal/entries")}>
                Close
              </Button>
            </div>
          </form>
        </Card>

        {/* 🔹 Enhanced Report Section */}
        {ledgerData ? (
          <div className="bg-white p-8 shadow print:shadow-none print:p-0 print:mt-0 rounded-lg max-w-[210mm] mx-auto border border-gray-200 print:border-none">
            {/* Report Header */}
            <div className="text-center mb-8 border-b pb-4 print:pb-2">
              <div className="flex justify-between items-start mb-4">
                <div className="text-left">
                  <h1 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
                    {ledgerData.company?.name || "Company Name"}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {ledgerData.company?.address || "Company Address"}
                  </p>
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-bold text-blue-700">
                    GENERAL LEDGER REPORT
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    As of {ledgerData.report_period?.generate_at}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-between items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">
                    {ledgerData.gl_account?.gl_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {ledgerData.report_period?.start_date} to{" "}
                    {ledgerData.report_period?.end_date}
                  </span>
                </div>
                {watch("subsidiary")?.label && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">
                      {watch("subsidiary").label}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-600 font-medium">GL Code</p>
                <p className="text-lg font-bold text-blue-800">
                  {ledgerData.gl_account?.gl_code}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <p className="text-xs text-green-600 font-medium">
                  Opening Balance
                </p>
                <p className="text-lg font-bold text-green-800">
                  {ledgerData.beginning_balance === "-"
                    ? "0"
                    : ledgerData.beginning_balance}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <p className="text-xs text-red-600 font-medium">Total Debit</p>
                <p className="text-lg font-bold text-red-800">
                  {ledgerData.total?.total_debit === "-"
                    ? "0"
                    : ledgerData.total?.total_debit}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <p className="text-xs text-purple-600 font-medium">
                  Total Credit
                </p>
                <p className="text-lg font-bold text-purple-800">
                  {ledgerData.total?.total_credit === "-"
                    ? "0"
                    : ledgerData.total?.total_credit}
                </p>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-300 border-collapse">
                <thead className=" ">
                  <tr>
                    <th className="border border-gray-300 p-2 text-left w-[90px] font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="border border-gray-300 p-2 text-left font-semibold text-gray-700">
                      GL Code
                    </th>
                    <th className="border border-gray-300 p-2 text-left font-semibold text-gray-700">
                      GL Name
                    </th>
                    <th className="border border-gray-300 p-2 text-left font-semibold text-gray-700">
                      Voucher No
                    </th>
                    <th className="border border-gray-300 p-2 text-right font-semibold text-gray-700">
                      Debit
                    </th>
                    <th className="border border-gray-300 p-2 text-right font-semibold text-gray-700">
                      Credit
                    </th>
                    <th className="border border-gray-300 p-2 text-right font-semibold text-gray-700">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.transactions?.length > 0 ? (
                    ledgerData.transactions.map((row, i) => (
                      <tr
                        key={i}
                        className={`hover:bg-gray-50 print:hover:bg-transparent ${
                          i % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}>
                        <td className="border border-gray-300 p-2 ">
                          {formatDate(row.date)}
                        </td>
                        <td className="border border-gray-300 p-2  ">
                          {row.gl_code || "-"}
                        </td>
                        <td className="border border-gray-300 p-2">
                          {row.gl_name}
                        </td>
                        <td
                          onClick={() => handleJournalModal(row.voucher_no)}
                          className="border border-gray-300 p-2 text-gray-600 hover:text-blue-700 hover:cursor-pointer">
                          {row.voucher_no || "-"}{" "}
                        </td>
                        <td className="border border-gray-300 p-2 text-right  ">
                          {row.debit}
                        </td>
                        <td className="border border-gray-300 p-2 text-right  ">
                          {row.credit}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {row.balance === "-" ? "0" : row.balance}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center text-gray-500 p-6">
                        <div className="flex flex-col items-center justify-center py-4">
                          <FileText className="w-12 h-12 text-gray-300 mb-2" />
                          <p className="text-gray-500">
                            No transactions found for the selected period.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50 text-black font-bold">
                  <tr>
                    <td
                      colSpan={4}
                      className="border border-gray-300 p-2 text-right">
                      Closing Balance:
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      {ledgerData.total?.total_debit === "-"
                        ? "0"
                        : ledgerData.total?.total_debit}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      {ledgerData.total?.total_credit === "-"
                        ? "0"
                        : ledgerData.total?.total_credit}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      {ledgerData.total?.closing_balance === "-"
                        ? "0"
                        : ledgerData.total?.closing_balance}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-xs text-gray-500">
              <div>
                <p>
                  <span className="font-medium">Location:</span>{" "}
                  {ledgerData.location?.name || "-"}
                </p>
                <p>
                  <span className="font-medium">Prepared By:</span>{" "}
                  {ledgerData.prepared_by?.name || "-"}
                </p>
              </div>
              <div className="text-right">
                <p>Generated on: {ledgerData.report_period?.generate_at}</p>
                <p>Page 1 of 1</p>
              </div>
            </div>

            {/* Print & Export Buttons */}
            <div className="flex justify-between items-center mt-8 print:hidden">
              <div className="text-sm text-gray-500">
                Showing {ledgerData.transactions?.length || 0} transactions
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outlined"
                  prefix={<FileDown size={16} />}
                  onClick={() => alert("Export to Excel")}>
                  Export Excel
                </Button>
                <Button
                  variant="gradient"
                  prefix={<Printer size={16} />}
                  onClick={print}>
                  Print Report
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Card className="text-center py-12">
            <div className="flex flex-col items-center justify-center">
              <BarChart3 className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                General Ledger Report
              </h3>
              <p className="text-gray-500 max-w-md">
                Please select a General Ledger account, date range, and click
                Generate to view the report.
              </p>
            </div>
          </Card>
        )}
      </motion.div>
    </Page>
  );
};

export default Ledger;
