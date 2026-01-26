import Page from "../../components/common/Page";
import DataTable from "../../components/table/DataTable";
import useTableManager from "../../hooks/useTableManager";
import useModalManager from "../../hooks/useModalManager";
import { useState } from "react";
import PosInvoiceModal from "./components/invoice/PosInvoiceModal";
import { Printer } from "lucide-react";
import useApi from "../../hooks/useApi";

const SalesReturnPage = () => {
  const { modals, openModal, closeModal } = useModalManager();
  const [invoiceData, setInvoiceData] = useState(null);
  const table = useTableManager("/sales");
  const { request } = useApi();
  const handlePrintInvoice = async (row) => {
    try {
      const saleId =row._id;

      const res = await request(`/sales/${saleId}/reprint`, "GET", null, {
        silent: true, 
      });

      if (!res?.success) {
        throw new Error("Failed to load invoice");
      }

      setInvoiceData(res.data);

      openModal("printPosInvoice");
    } catch (err) {
      console.error(err);
      alert("Unable to reprint invoice");
    }
  };

  return (
    <Page title="Sales Return" subTitle="Manage your organization sales Return">
      {/* ✅ Print Modal */}
      {modals.printPosInvoice?.isOpen && (
        <PosInvoiceModal
          isOpen={true}
          setIsOpen={() => closeModal("printPosInvoice")}
          data={invoiceData}
        />
      )}

      <DataTable
        table={table}
        title="Sales Return"
        columns={[
          { key: "invoiceNo", label: "Return Invoice" },
          { key: "grandTotal", label: "Grand Total" },
          { key: "createdAt", label: "Created At" },
          {
            key: "status",
            label: "Status",
            render: (r) => (
              <span
                className={`px-2 py-1 rounded text-xs ${
                  r.status === "COMPLETED"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}>
                {r.status === "COMPLETED" ? "COMPLETED" : "FAILED"}
              </span>
            ),
          },

          /* ✅ ACTION COLUMN */
          {
            key: "action",
            label: "Action",
            render: (row) => (
              <button
                onClick={() => handlePrintInvoice(row)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md
                           bg-blue-600 text-white hover:bg-blue-700">
                <Printer size={14} />
                Print
              </button>
            ),
          },
        ]}
      />
    </Page>
  );
};

export default SalesReturnPage;
