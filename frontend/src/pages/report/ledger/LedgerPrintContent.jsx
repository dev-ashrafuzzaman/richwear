import { forwardRef } from "react";
import { Calendar, FileText, User } from "lucide-react";
import { formatDate } from "./ledger.utils";

const LedgerPrintContent = forwardRef(
  ({ ledgerData, subsidiary }, ref) => {
    if (!ledgerData) return null;

    return (
      <div
        ref={ref}
        className="bg-white p-8 max-w-[210mm] mx-auto text-sm text-black"
      >
        {/* ================= Report Header ================= */}
        <div className="text-center mb-8 border-b pb-4">
          <div className="flex justify-between items-start mb-4">
            <div className="text-left">
              <h1 className="text-xl font-bold uppercase tracking-wide">
                {ledgerData.company?.name}
              </h1>
              <p className="text-sm mt-1">
                {ledgerData.company?.address}
              </p>
            </div>

            <div className="text-right">
              <h2 className="text-lg font-bold text-blue-700">
                GENERAL LEDGER REPORT
              </h2>
              <p className="text-xs mt-1">
                As of {ledgerData.report_period?.generate_at}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded-lg">
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

            {subsidiary && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="font-medium">
                  {subsidiary.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ================= Summary Cards ================= */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-600 font-medium">
              GL Code
            </p>
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
            <p className="text-xs text-red-600 font-medium">
              Total Debit
            </p>
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

        {/* ================= Transactions Table ================= */}
        <table className="w-full text-sm border border-gray-300 border-collapse">
          <thead>
            <tr>
              <th className="border p-2 text-left w-[90px]">
                Date
              </th>
              <th className="border p-2 text-left">
                GL Code
              </th>
              <th className="border p-2 text-left">
                GL Name
              </th>
              <th className="border p-2 text-left">
                Voucher No
              </th>
              <th className="border p-2 text-right">
                Debit
              </th>
              <th className="border p-2 text-right">
                Credit
              </th>
              <th className="border p-2 text-right">
                Balance
              </th>
            </tr>
          </thead>

          <tbody>
            {ledgerData.transactions?.map((row, i) => (
              <tr key={i}>
                <td className="border p-2">
                  {formatDate(row.date)}
                </td>
                <td className="border p-2">
                  {row.gl_code || "-"}
                </td>
                <td className="border p-2">
                  {row.gl_name}
                </td>
                <td className="border p-2">
                  {row.voucher_no || "-"}
                </td>
                <td className="border p-2 text-right">
                  {row.debit}
                </td>
                <td className="border p-2 text-right">
                  {row.credit}
                </td>
                <td className="border p-2 text-right">
                  {row.balance === "-" ? "0" : row.balance}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot className="bg-gray-50 font-bold">
            <tr>
              <td colSpan={4} className="border p-2 text-right">
                Closing Balance:
              </td>
              <td className="border p-2 text-right">
                {ledgerData.total?.total_debit}
              </td>
              <td className="border p-2 text-right">
                {ledgerData.total?.total_credit}
              </td>
              <td className="border p-2 text-right">
                {ledgerData.total?.closing_balance}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* ================= Footer ================= */}
        <div className="grid grid-cols-2 gap-4 mt-6 text-xs">
          <div>
            <p>
              <b>Location:</b>{" "}
              {ledgerData.location?.name}
            </p>
            <p>
              <b>Prepared By:</b>{" "}
              {ledgerData.prepared_by?.name}
            </p>
          </div>

          <div className="text-right">
            <p>
              Generated on:{" "}
              {ledgerData.report_period?.generate_at}
            </p>
            <p>Page 1 of 1</p>
          </div>
        </div>
      </div>
    );
  }
);

export default LedgerPrintContent;
