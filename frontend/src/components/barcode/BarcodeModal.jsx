// components/barcode/BarcodeModal.jsx
import Barcode from "react-barcode";
import Button from "../ui/Button";
import Modal from "../modals/Modal";

export default function BarcodeModal({ isOpen, setIsOpen, barcodes }) {
  const expanded = barcodes.flatMap((item) =>
    Array.from({ length: item.qty }).map(() => item)
  );

  const handlePrint = () => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <style>
            body { margin: 0; font-family: Arial; }
            .grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 16px;
              padding: 20px;
            }
            .card {
              border: 1px solid #ddd;
              border-radius: 10px;
              padding: 12px;
              text-align: center;
            }
            h2 { margin: 0; font-size: 18px; }
            p { margin: 4px 0; }
          </style>
        </head>
        <body>
          <div class="grid">
            ${expanded
              .map(
                (item) => `
              <div class="card">
                <h2>RichWear</h2>
                <p>${item.name} (${item.attributes.size}/${item.attributes.color})</p>
                <p><strong>৳ ${item.mrp}</strong></p>
                <svg id="${item.sku}"></svg>
                <small>${item.sku}</small>
              </div>
            `
              )
              .join("")}
          </div>

          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            ${expanded
              .map(
                (item) =>
                  `JsBarcode("#${item.sku}", "${item.sku}", { format: "CODE128", height: 60, displayValue: false });`
              )
              .join("\n")}
            window.onload = () => window.print();
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Barcode Preview"
      size="full"
      footer={
        <Button onClick={handlePrint}>
          Print
        </Button>
      }
    >
      <div className="grid grid-cols-4 gap-4">
        {expanded.map((item, i) => (
          <div key={i} className="border rounded-lg p-3 text-center">
            <h2 className="font-bold">RICHWEAR</h2>
            <p className="uppercase">
              {item.parentCategoryName}-{item.name}-{item.categoryName}
            </p>
            <p className="font-semibold">BDT: {item.mrp}</p>

            <Barcode
              value={item.sku}
              format="CODE128"
              height={60}
              width={1.5}
              displayValue={false}
            />

            <small>{item.sku}</small>
          </div>
        ))}
      </div>
    </Modal>
  );
}
