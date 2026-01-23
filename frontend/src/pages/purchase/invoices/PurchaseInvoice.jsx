import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import useApi from "../../../hooks/useApi";

const PurchaseInvoice = () => {
  const { id } = useParams();
  const { request } = useApi();
  const printRef = useRef();

  const [invoice, setInvoice] = useState(null);

  /* ---------------- FETCH INVOICE ---------------- */
  useEffect(() => {
    request(`/purchases/${id}/`, "GET").then((res) => {
        console.log("resss",res)
      setInvoice(res?.data);
    });
  }, [id]);

  if (!invoice) return <p>Loading invoice...</p>;

  /* ---------------- PRINT ---------------- */
  const handlePrint = () => {
    window.print();
  };

  /* ---------------- DOWNLOAD PDF ---------------- */
  const handleDownload = () => {
    const opt = {
      margin: 10,
      filename: `${invoice.purchaseNo}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().from(printRef.current).set(opt).save();
  };

  return (
    <div className="p-6 space-y-4">
      {/* Actions */}
      <div className="flex justify-end gap-3 print:hidden">
        <button onClick={handlePrint} className="btn-secondary">
          Print
        </button>
        <button onClick={handleDownload} className="btn-primary">
          Download PDF
        </button>
      </div>

      {/* INVOICE */}
      <div
        ref={printRef}
        className="bg-white p-8 rounded-md text-sm max-w-[210mm] mx-auto"
      >
        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">PURCHASE INVOICE</h2>
            <p className="text-gray-500">{invoice.purchaseNo}</p>
          </div>

          <div className="text-right">
            <p className="font-semibold">{invoice.branch.name}</p>
            <p>{invoice.branch.address}</p>
          </div>
        </div>

        {/* SUPPLIER */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-semibold mb-1">Supplier</h4>
            <p>{invoice.supplier.name}</p>
            <p>{invoice.supplier.address}</p>
            <p>Phone: {invoice.supplier.contact.phone}</p>
          </div>

          <div className="text-right">
            <p>Invoice No: {invoice.invoiceNumber}</p>
            <p>Date: {invoice.invoiceDate.slice(0, 10)}</p>
          </div>
        </div>

        {/* ITEMS */}
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="border bg-gray-100">
              <th className="p-2 text-left">Item</th>
              <th className="p-2 text-center">Qty</th>
              <th className="p-2 text-right">Cost</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((i, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-2">
                  {i.productName} ({i.sku})
                </td>
                <td className="p-2 text-center">{i.qty}</td>
                <td className="p-2 text-right">{i.costPrice}</td>
                <td className="p-2 text-right">{i.lineTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* SUMMARY */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1">
            <div className="flex justify-between">
              <span>Total Qty</span>
              <span>{invoice.totalQty}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Amount</span>
              <span>{invoice.totalAmount}</span>
            </div>
            <div className="flex justify-between">
              <span>Paid</span>
              <span>{invoice.paidAmount}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Due</span>
              <span>{invoice.dueAmount}</span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-10 text-center text-xs text-gray-500">
          This is a system generated invoice.
        </div>
      </div>
    </div>
  );
};

export default PurchaseInvoice;
