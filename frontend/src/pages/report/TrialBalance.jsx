import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Calendar, FileDown, Printer } from "lucide-react";
import { motion } from "framer-motion";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Divider from "../../components/ui/Divider";
import Page from "../../components/common/Page";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import { useNavigate } from "react-router-dom";

const formatToApiDate = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
};

const TrialBalance = () => {
  const navigate = useNavigate();
  const { axiosSecure } = useAxiosSecure();
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      TBDate: new Date().toISOString().split("T")[0],
      comparisonTBDate: "",
    },
  });

  const [tbData, setTbData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔹 Fetch Trial Balance Data
  const onSubmit = async (formData) => {
    if (!formData.TBDate) {
      return alert("Please select a Trial Balance Date first");
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        TBDate: formatToApiDate(formData.TBDate),
      };
      if (formData.comparisonTBDate) {
        params.comparisonTBDate = formatToApiDate(formData.comparisonTBDate);
      }

      const res = await axiosSecure.get("/reports/trial-balance/", { params });
      console.log("bal", res);
      if (res?.data?.data) {
        setTbData(res.data.data);
      } else {
        setTbData(null);
      }
    } catch (err) {
      console.error("Trial Balance fetch error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    reset();
    setTbData(null);
  };

  const totalCurrent = tbData?.totals?.current_total || "0.00";
  const totalComparative = tbData?.totals?.comparative_total || "0.00";

  return (
    <Page title="Trial Balance">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 print:space-y-3">
        {/* 🔹 Filter Section */}
        <Card className="sticky top-6 z-40 shadow-sm print:hidden mb-10">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid md:grid-cols-4 gap-4">
            <Controller
              name="TBDate"
              control={control}
              render={({ field }) => (
                <Input
                  type="date"
                  label="Trial Balance Date"
                  prefix={<Calendar size={16} />}
                  {...field}
                />
              )}
            />
            <Controller
              name="comparisonTBDate"
              control={control}
              render={({ field }) => (
                <Input
                  type="date"
                  label="Comparison Date"
                  prefix={<Calendar size={16} />}
                  {...field}
                />
              )}
            />
            <div className="col-span-full flex justify-end gap-3 mt-2">
              <Button variant="gradient" type="submit" disabled={loading}>
                {loading ? "Loading..." : "Generate"}
              </Button>
              <Button variant="danger" type="button" onClick={handleReset}>
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

        {/* 🔹 Report Section */}
        {tbData && (
          <div className="a4 mt-10 mx-auto bg-white print:shadow-none shadow p-8 print:p-4 rounded-lg">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="text-left">
                <h1 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
                  {tbData.company?.name || "Company Name"}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {tbData.location?.name || "Company Address"}
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold text-blue-700">
                  TRIAL BALANCE
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {" "}
                  As of {tbData.TBDate}
                  {tbData.comparisonTBDate
                    ? ` (Comparison: ${tbData.comparisonTBDate})`
                    : ""}
                </p>
              </div>
            </div>
            {/* Toolbar (hidden on print) */}
            <div className="flex justify-end gap-2 mb-4 print:hidden">
              <Button
                variant="gradient"
                prefix={<Printer size={16} />}
                onClick={() => window.print()}>
                Print
              </Button>
              <Button
                variant="gradient"
                prefix={<FileDown size={16} />}
                onClick={() => alert("Export to Excel")}>
                Export
              </Button>
            </div>

            {/* Table */}
            <table className="w-full text-sm border border-gray-300">
              <thead className="bg-gray-100 border-b text-gray-700">
                <tr>
                  <th className="p-2 text-left w-[120px]">GL Code</th>
                  <th className="p-2 text-left">Account Name</th>
                  <th className="p-2 text-left">Face</th>
                  <th className="p-2 text-left">Account Type</th>
                  <th className="p-2 text-right">
                    Current Amount{" "}
                    <span className="font-normal">( {tbData.TBDate} )</span>
                  </th>
                  {tbData.comparisonTBDate && (
                    <th className="p-2 text-right">
                      Comparative Amount{" "}
                      <span className="font-normal">
                        ( {tbData.comparisonTBDate} )
                      </span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {tbData.accounts?.map((acc, i) => (
                  <tr
                    key={i}
                    className="border-b last:border-0 hover:bg-gray-50 print:hover:bg-transparent">
                    <td className="p-2">{acc.GL_Code}</td>
                    <td className="p-2">{acc.GL_Name}</td>
                    <td className="p-2">{acc.Face}</td>
                    <td className="p-2">{acc.acc_type}</td>
                    <td className="p-2 text-right">{acc.Current_Amount}</td>
                    {tbData.comparisonTBDate && (
                      <td className="p-2 text-right">
                        {acc.Comparative_Amount}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold border-t">
                  <td
                    colSpan={tbData.comparisonTBDate ? 4 : 4}
                    className="p-2 text-right">
                    Total:
                  </td>
                  <td className="p-2 text-right">
                    {totalCurrent === "-" ? "0" : totalCurrent}
                  </td>
                  {tbData.comparisonTBDate && (
                    <td className="p-2 text-right">
                      {totalComparative === "-" ? "0" : totalComparative}
                    </td>
                  )}
                </tr>
              </tfoot>
            </table>

            {/* Footer */}
            <div className="mt-6 text-xs text-gray-500 flex justify-between">
              <span>Generated on: {tbData?.TBDate}</span>
              <span>Prepared by: Finance Department</span>
            </div>
          </div>
        )}

        {!tbData && !loading && (
          <Card>
            <p className="text-center text-gray-500 py-6">
              Please select a Trial Balance Date and click Generate.
            </p>
          </Card>
        )}
      </motion.div>
    </Page>
  );
};

export default TrialBalance;
