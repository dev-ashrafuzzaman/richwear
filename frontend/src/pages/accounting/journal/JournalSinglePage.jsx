import React, { forwardRef } from "react";

const JournalSinglePage = forwardRef(({ data }, ref) => {
    
  const parseNum = (v) => {
    if (v === null || v === undefined) return 0;
    const s = String(v).replace(/,/g, "").trim();
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  };

  const entries = Array.isArray(data?.entries) ? data.entries : [];

  const debits = [];
  const credits = [];
  const neither = [];
  const both = [];

  for (const e of entries) {
    const d = parseNum(e.debit);
    const c = parseNum(e.credit);
    if (d > 0 && c === 0) debits.push(e);
    else if (c > 0 && d === 0) credits.push(e);
    else if (d > 0 && c > 0) both.push(e); // treat as debit-group by default
    else neither.push(e); // neither debit nor credit (zeros / missing)
  }

  const sortedEntries = [...debits, ...both, ...neither, ...credits];
  return (
    <div
      ref={ref}
      className={` mx-auto bg-white shadow rounded-lg p-6 print:shadow-none print:bg-white`}>
      {/* Header */}
      <div className="flex justify-between items-start   pb-4 mb-4">
        <div>
          <h1 className="text-xl font-semibold">{data.company?.name}</h1>
          <p className="text-sm text-gray-500">{data.locations?.[0]?.name}</p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-medium text-gray-800">Journal Voucher</h2>
          <p className="text-sm text-gray-500">JV No: {data.jv}</p>
          <p className="text-sm text-gray-500">
            Posting Date: {data.posting_date}
          </p>
        </div>
      </div>

      {/* Table */}
      <table className="border border-gray-50 w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-left font-semibold">GL Code</th>
            <th className="p-2 text-left font-semibold">GL Name</th>
            <th className="p-2 text-left font-semibold">Subsidiary</th>
            {/* <th className="p-2 text-left font-semibold">Narration</th> */}
            <th className="p-2 text-right font-semibold">Debit</th>
            <th className="p-2 text-right font-semibold">Credit</th>
          </tr>
        </thead>
        <tbody>
          {sortedEntries.map((entry, index) => (
            <tr
              key={index}
              className="border-t border-gray-200 hover:bg-gray-50">
              <td className="p-2">{entry.ledger?.gl_code}</td>
              <td className="p-2">{entry.ledger?.gl_name}</td>
              <td className="p-2">{entry.subsidiary?.name || "-"}</td>
              <td className="p-2 text-right">{entry.debit}</td>
              <td className="p-2 text-right">{entry.credit}</td>
            </tr>
          ))}

          <tr className="border-t border-gray-300 font-semibold bg-gray-50">
            <td colSpan={3}></td>
            <td className="p-2 text-right">{data.ledger_cal.total_debit}</td>
            <td className="p-2 text-right">{data.ledger_cal.total_credit}</td>
          </tr>
        </tbody>
      </table>

      {/* Footer Info */}
      <div className="flex justify-between text-gray-500 mt-6 text-xs">
        <div>
          <p>Created by: {data.created_by?.name}</p>
          <p>Entry Date: {data.created_at}</p>
        </div>
      </div>

      {/* Signature Section */}
      <div className="flex justify-evenly mt-12 text-sm text-gray-700">
        <p className="border-t border-gray-400 w-40 text-center pt-2">
          Prepared by
        </p>
        <p className="border-t border-gray-400 w-40 text-center pt-2">
          Reviewed by
        </p>
        <p className="border-t border-gray-400 w-40 text-center pt-2">
          Approved by
        </p>
      </div>
    </div>
  );
});

JournalSinglePage.displayName = "JournalPrintContent";

export default JournalSinglePage;