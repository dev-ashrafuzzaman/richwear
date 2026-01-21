export default function JournalPrintContent({ data }) {
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
    <>
      {/* HEADER */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ float: "left" }}>
          <h2>{data.company?.name}</h2>
          <small>{data.locations?.[0]?.name}</small>
        </div>

        <div style={{ float: "right", textAlign: "right" }}>
          <h3>Journal Voucher</h3>
          <div>JV No: {data.jv}</div>
          <div>Date: {data.posting_date}</div>
        </div>

        <div style={{ clear: "both" }} />
      </div>

      {/* TABLE */}
      <table>
        <thead>
          <tr>
            <th>GL Code</th>
            <th>GL Name</th>
            <th>Subsidiary</th>
            <th className="text-right">Debit</th>
            <th className="text-right">Credit</th>
          </tr>
        </thead>

        <tbody>
          {sortedEntries.map((e, i) => (
            <tr key={i}>
              <td>{e.ledger?.gl_code}</td>
              <td>{e.ledger?.gl_name}</td>
              <td>{e.subsidiary?.name || "-"}</td>
              <td className="text-right">{e.debit}</td>
              <td className="text-right">{e.credit}</td>
            </tr>
          ))}

          <tr>
            <td colSpan={3} className="text-right">
              <b>Total</b>
            </td>
            <td className="text-right">
              <b>{data.ledger_cal?.total_debit}</b>
            </td>
            <td className="text-right">
              <b>{data.ledger_cal?.total_credit}</b>
            </td>
          </tr>
        </tbody>
      </table>

      {/* FOOTER */}
      <div style={{ marginTop: 20, fontSize: 12 }}>
        Created by: {data.created_by?.name} <br />
        Entry Date: {data.created_at}
      </div>

      {/* SIGNATURE */}
      <div className="signature">
        <div>Prepared By</div>
        <div>Reviewed By</div>
        <div>Approved By</div>
      </div>
    </>
  );
}
