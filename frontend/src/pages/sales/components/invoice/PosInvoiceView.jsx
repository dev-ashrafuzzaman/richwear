export default function PosInvoiceView({ data }) {
  const { sale, branch, customer, items, summary, payments, print } = data;

  return (
    <div className="invoice-root">
      {/* Header */}
      <div className="invoice-header">
        <div>
          <h2 className="text-lg font-bold">{branch.name}</h2>
          <p className="text-xs">{branch.address}</p>
          <p className="text-xs">☎ {branch.phone}</p>
        </div>

        <div className="text-right text-xs">
          <p className="font-semibold">INVOICE</p>
          <p>{sale.invoiceNo}</p>
          <p>{new Date(sale.date).toLocaleString()}</p>
        </div>
      </div>

      {/* Customer */}
      <div className="invoice-section">
        <p><b>Customer:</b> {customer.name}</p>
        {customer.phone && <p>Phone: {customer.phone}</p>}
      </div>

      {/* Items */}
      <table className="invoice-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Item</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td>{i.sku}</td>
              <td>{i.qty}</td>
              <td>{i.unitPrice}</td>
              <td>{i.lineTotal}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="invoice-summary">
        <div><span>Sub Total</span><span>{summary.subTotal}</span></div>
        <div><span>Discount</span><span>{summary.itemDiscount + summary.billDiscount}</span></div>
        <div><span>VAT</span><span>{summary.taxAmount}</span></div>

        <div className="grand">
          <span>Grand Total</span>
          <span>{summary.grandTotal} {print.currency}</span>
        </div>

        <div><span>Paid</span><span>{summary.paidAmount}</span></div>
        {summary.dueAmount > 0 && (
          <div className="due">
            <span>Due</span>
            <span>{summary.dueAmount}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="invoice-footer">
        <p>{print.footerNote}</p>
      </div>
    </div>
  );
}
