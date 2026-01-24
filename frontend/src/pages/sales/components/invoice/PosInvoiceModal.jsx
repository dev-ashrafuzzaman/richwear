import Modal from "../../../../components/modals/Modal";
import Button from "../../../../components/ui/Button";
import PosInvoiceView from "./PosInvoiceView";

function getPrintCss() {
  return `
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: white;
    }

    .invoice-root {
      width: 80mm;
      margin: auto;
      font-size: 12px;
      color: #000;
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dashed #000;
      padding-bottom: 6px;
    }

    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }

    .invoice-table th,
    .invoice-table td {
      border-bottom: 1px dotted #ccc;
      padding: 4px;
      text-align: center;
    }

    .invoice-summary {
      margin-top: 8px;
    }

    .invoice-summary div {
      display: flex;
      justify-content: space-between;
    }

    .invoice-summary .grand {
      font-weight: bold;
      border-top: 1px solid #000;
      margin-top: 6px;
      padding-top: 6px;
    }

    .invoice-footer {
      text-align: center;
      margin-top: 10px;
      font-size: 11px;
    }
  `;
}

export default function PosInvoiceModal({ isOpen, setIsOpen, data }) {
  const handlePrint = () => {
    const win = window.open("about:blank", "_blank");

    win.document.write(`
      <html>
        <head>
          <title>Invoice</title>
          <style>
            ${getPrintCss()}
          </style>
        </head>
        <body>
          <div id="print-root"></div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);

    win.document.close();

    // Inject HTML
    win.document.getElementById("print-root").innerHTML =
      document.getElementById("invoice-preview").innerHTML;
  };

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
      {/* Preview Area */}
      <div
        id="invoice-preview"
        className="bg-gray-50 p-4 rounded-lg max-h-[70vh] overflow-auto">
        <PosInvoiceView data={data} />
      </div>
    </Modal>
  );
}
