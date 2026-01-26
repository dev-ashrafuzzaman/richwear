// src/pages/sales/components/invoice/PosInvoiceModal.jsx
import Modal from "../../../../components/modals/Modal";
import Button from "../../../../components/ui/Button";
import PosInvoicePreview from "./PosInvoicePreview";
import { renderToStaticMarkup } from "react-dom/server";
import PosInvoicePrint from "./PosInvoicePrint";
import { useEffect, useRef } from "react";

export default function PosInvoiceModal({
  isOpen,
  setIsOpen,
  data,
  onAfterClose,
}) {
  const hasPrintedRef = useRef(false);

  useEffect(() => {
    if (!isOpen || !data) return;
    if (hasPrintedRef.current) return;

    hasPrintedRef.current = true;

    setTimeout(() => {
      handlePrint();
    }, 150);
  }, [isOpen, data]);

  const handlePrint = () => {
    const win = window.open("about:blank", "_blank");
    if (!win) {
      setIsOpen(false);
      onAfterClose?.();
      return;
    }

    win.document.open();
    win.document.write(`
      <html>
        <head>
          <title>Invoice</title>
          <style>
            ${printCss}
          </style>
        </head>
        <body>
          <div id="print-root"></div>

        </body>
      </html>
    `);

    win.document.close();

    win.document.getElementById("print-root").innerHTML =
      `${renderToStaticMarkup(<PosInvoicePrint data={data} />)}`;

    win.focus();

    setTimeout(() => {
      try {
        win.print();
      } catch {""}
    }, 100);

    setTimeout(() => {
      try {
        win.close();
      } catch {""}

      setIsOpen(false);
      onAfterClose?.(); 
    }, 1200);
  };

  useEffect(() => {
    if (isOpen && data) {
      setTimeout(handlePrint, 150);
    }
  }, [isOpen, data]);

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Invoice Preview"
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Close
          </Button>
          <Button variant="gradient" onClick={handlePrint}>
            Print
          </Button>
        </div>
      }>
      <PosInvoicePreview data={data} />
    </Modal>
  );
}

/* ================= PRINT CSS ================= */

const printCss = `
@page {
  size: 80mm auto;
  margin: 0;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background: #fff;
  color: #000;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, Helvetica, Arial, sans-serif;
}

.pos-receipt {
  width: 72mm;
  margin: 0 auto;
  font-size: 11px;
  line-height: 1.4;
}

/* ================= HEADER ================= */

.header-center {
  text-align: center;
  margin-bottom: 6px;
}

.brand {
  font-size: 30px;
  font-weight: 900;
  letter-spacing: 1px;
  margin: 0 0 2px 0;
}

.meta {
  font-size: 12px;
  margin: 0;
  line-height: 1.35;
}

/* ================= DIVIDER ================= */

.divider {
  border-top: 1px dashed #000;
  margin: 8px 0;
}

/* ================= INFO BOX ================= */

.invoice-box {
  border: 1px dashed #000;
  padding: 6px;
  margin-bottom: 6px;
  font-size: 10.5px;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.row span:last-child {
  font-weight: 600;
}

/* ================= CUSTOMER ================= */

.row + .row {
  margin-top: 2px;
}

/* ================= ITEMS TABLE ================= */

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10.5px;
  margin-top: 4px;
}

.items-table thead th {
  font-weight: 700;
  border-bottom: 1px solid #000;
  padding: 3px 0;
}

.items-table td {
  padding: 3px 0;
  border-bottom: 1px dotted #000;
}

.items-table th:nth-child(2),
.items-table td:nth-child(2) {
  text-align: left;
}

.items-table th:not(:nth-child(2)),
.items-table td:not(:nth-child(2)) {
  text-align: right;
}

/* ================= TOTALS ================= */

.grand {
  font-weight: 800;
  font-size: 14px;
  margin-top: 4px;
}

/* ================= PAYMENT ================= */

.center {
  text-align: center;
}

.center b {
  font-size: 12px;
}

.small {
  font-size: 9.5px;
  line-height: 1.3;
}

/* ================= QR ================= */

.qr-box {
  text-align: center;
  margin: 10px 0 6px;
}

.qr-box svg {
  width: 90px;
  height: 90px;
}
`;
