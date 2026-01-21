import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Calendar, FileDown, Printer } from "lucide-react";
import { motion } from "framer-motion";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Divider from "../../components/ui/Divider";
import Page from "../../components/common/Page";
import useApi from "../../hooks/useApi";
import SmartSelect from "../../components/common/SmartSelect";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import { useNavigate } from "react-router-dom";

const BalanceReportView = ({ type, title }) => {
  const navigate= useNavigate()
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      glAccount: null,
    },
  });

  const { request, loading, error } = useApi();
  const [ledgerData, setLedgerData] = useState(null);
  const { axiosSecure } = useAxiosSecure();
  const formatToApiDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  };

  const onSubmit = async (formData) => {
    if (!formData?.startDate) {
      return alert("Please select Start Date");
    }

    const ledgerId = formData?.glAccount?.value;
    const startDate = formatToApiDate(formData?.startDate);

    try {
      if (ledgerId) {
        const response = await axiosSecure.get(`/reports/subsidiary/`, {
          params: {
            sbdate: startDate,
            id: ledgerId,
          },
        });
        console.log("id", response);
        if (response.data?.data) {
          setLedgerData(response.data.data);
        } else {
          setLedgerData(response.data);
        }
      } else {
        const response = await axiosSecure.get(`/reports/subsidiary/`, {
          params: {
            sbdate: startDate,
            type,
          },
        });
        console.log('res',response)
        if (response.data?.data) {
          setLedgerData(response.data.data);
        } else {
          setLedgerData(response.data);
        }
      }
    } catch (error) {
      console.error("❌ Ledger fetch error:", error);
    }
  };

  const handleReset = () => {
    reset();
    setLedgerData(null);
  };

  return (
    <Page title={`${title} Ledger`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 print:space-y-2">
        {/* 🔹 Filter Section (Hidden in Print) */}
        <Card className="sticky top-6 z-40 shadow-sm print:hidden mb-10">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid md:grid-cols-4 gap-4">
            {/* Start & End Dates */}
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <Input
                  type="date"
                  label="Select Date"
                  prefix={<Calendar size={16} />}
                  {...field}
                />
              )}
            />

            {/* General Ledger Select */}
            <Controller
              name="glAccount"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Select {title}
                  </label>
                  <SmartSelect
                    customRoute="/subsidiaries/"
                    useApi={true}
                    displayField={["code", "name", "mobile"]}
                    searchFields={["code", "name", "mobile"]}
                    onChange={(val) => field.onChange(val)}
                    placeholder={`Select ${title} ...`}
                    type={type}
                  />
                </div>
              )}
            />

            <div className="col-span-full flex justify-end gap-3 mt-2">
              <Button variant="gradient" type="submit" disabled={loading}>
                {loading ? "Loading..." : "Generate"}
              </Button>
              <Button variant="danger" type="button" onClick={handleReset}>
                Reset
              </Button>
              <Button variant="outlined" type="button" onClick={()=> navigate('/journal/entries')}>
                Close
              </Button>
            </div>
          </form>
        </Card>

        {/* 🔹 Print-Ready Report Section */}
        {ledgerData ? (
          <div className="bg-white p-8 shadow print:shadow-none print:p-0 print:mt-0 rounded-lg max-w-[210mm] mx-auto border border-gray-200 print:border-none">
            {/* Header */}
            <div className="text-center mb-6 border-b pb-3 print:pb-1">
              <h1 className="text-2xl font-bold text-gray-800">
                {ledgerData.company?.name}
              </h1>

              <p className="text-sm text-gray-600 mt-1">{title} Summary</p>

              <p className="text-xs text-gray-500">
                Summary Date: {ledgerData.sbdate}
              </p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
              <div>
                <p className="text-gray-500">Location:</p>
                <p className="font-medium">{ledgerData.location?.name}</p>
              </div>

              <div>
                <p className="text-gray-500">Prepared By:</p>
                <p className="font-medium">{ledgerData.prepared_by?.name}</p>
              </div>

              <div>
                <p className="text-gray-500">Total Debit:</p>
                <p className="font-medium">{ledgerData.summary?.total_debit}</p>
              </div>

              <div>
                <p className="text-gray-500">Total Credit:</p>
                <p className="font-medium">
                  {ledgerData.summary?.total_credit}
                </p>
              </div>
            </div>

            {/* Lines Table */}
            <table className="w-full text-sm border border-gray-300 border-collapse">
              <thead className="bg-gray-100 print:bg-gray-100">
                <tr>
                  <th className="border p-2 text-left">Code</th>
                  <th className="border p-2 text-left">Name</th>
                  <th className="border p-2 text-left">Mobile</th>
                  <th className="border p-2 text-right">Debit</th>
                  <th className="border p-2 text-right">Credit</th>
                  <th className="border p-2 text-right">Balance</th>
                </tr>
              </thead>

              <tbody>
                {ledgerData.lines?.length > 0 ? (
                  ledgerData.lines.map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-50 print:hover:bg-transparent">
                      <td className="border p-2">{row.code}</td>
                      <td className="border p-2">{row.name}</td>
                      <td className="border p-2">{row.mobile}</td>
                      <td className="border p-2 text-right">
                        {row.debit}
                      </td>
                      <td className="border p-2 text-right">
                        {row.credit}
                      </td>
                      <td className="border p-2 text-right">{row.balance}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500 p-4">
                      No data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Footer */}
            <div className="mt-6 text-xs text-gray-500 text-right print:mt-2">
              Generated on: {ledgerData.timestamp}
            </div>

            {/* Print & Export */}
            <div className="flex justify-end gap-2 mt-6 print:hidden">
              <Button variant="gradient" onClick={() => window.print()}>
                Print
              </Button>
              <Button
                variant="gradient"
                onClick={() => alert("Export to Excel")}>
                Export
              </Button>
            </div>
          </div>
        ) : (
          <Card>
            <p className="text-center text-gray-500 py-6">
              Please select a ledger and generate summary.
            </p>
          </Card>
        )}
      </motion.div>
    </Page>
  );
};

export default BalanceReportView;
