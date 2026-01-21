import { formatDate } from "./ledger.utils";
import { FileText } from "lucide-react";

const LedgerTable = ({ ledgerData, onVoucherClick, printable = false }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border border-gray-300 border-collapse">
        {/* Header */}
        <thead>
          <tr>
            <th className="border p-2 text-left w-[90px] font-semibold text-gray-700">
              Date
            </th>
            <th className="border p-2 text-left font-semibold text-gray-700">
              GL Code
            </th>
            <th className="border p-2 text-left font-semibold text-gray-700">
              GL Name
            </th>
            <th className="border p-2 text-left font-semibold text-gray-700">
              Voucher No
            </th>
            <th className="border p-2 text-right font-semibold text-gray-700">
              Debit
            </th>
            <th className="border p-2 text-right font-semibold text-gray-700">
              Credit
            </th>
            <th className="border p-2 text-right font-semibold text-gray-700">
              Balance
            </th>
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {ledgerData.transactions?.length > 0 ? (
            ledgerData.transactions.map((row, i) => (
              <tr
                key={i}
                className={`${
                  !printable
                    ? "hover:bg-gray-50"
                    : ""
                } ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                <td className="border p-2">
                  {formatDate(row.date)}
                </td>
                <td className="border p-2">
                  {row.gl_code || "-"}
                </td>
                <td className="border p-2">
                  {row.gl_name}
                </td>
                <td
                  onClick={
                    !printable
                      ? () => onVoucherClick?.(row.voucher_no)
                      : undefined
                  }
                  className={`border p-2 ${
                    printable
                      ? ""
                      : "cursor-pointer text-gray-600 hover:text-blue-700"
                  }`}
                >
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
            ))
          ) : (
            <tr>
              <td colSpan={7} className="text-center p-6 text-gray-500">
                <div className="flex flex-col items-center">
                  <FileText className="w-10 h-10 text-gray-300 mb-2" />
                  No transactions found for the selected period.
                </div>
              </td>
            </tr>
          )}
        </tbody>

        {/* Footer */}
        <tfoot className="bg-gray-50 font-bold">
          <tr>
            <td colSpan={4} className="border p-2 text-right">
              Closing Balance:
            </td>
            <td className="border p-2 text-right">
              {ledgerData.total?.total_debit === "-"
                ? "0"
                : ledgerData.total?.total_debit}
            </td>
            <td className="border p-2 text-right">
              {ledgerData.total?.total_credit === "-"
                ? "0"
                : ledgerData.total?.total_credit}
            </td>
            <td className="border p-2 text-right">
              {ledgerData.total?.closing_balance === "-"
                ? "0"
                : ledgerData.total?.closing_balance}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default LedgerTable;
