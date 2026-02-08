import { useState } from "react";
import { Eye } from "lucide-react";

import Page from "../../../components/common/Page";
import DataTable from "../../../components/table/DataTable";
import Badge from "../../../components/ui/Badge";
import useTableManager from "../../../hooks/useTableManager";
import useApi from "../../../hooks/useApi";
import StockTransferDetailsModal from "./StockTransferDetailsModal";
import useModalManager from "../../../hooks/useModalManager";

const StockTranaferPage = () => {
  const table = useTableManager("/stocks/transfers");
  const { request } = useApi();
  const { modals, openModal, closeModal } = useModalManager();
  const [invoiceData, setInvoiceData] = useState(null);

  const handlePrintInvoice = async (row) => {
    const res = await request(`/stocks/transfers/${row._id}`, "GET");
    setInvoiceData(res.data);
    openModal("viewStockDetails");
  };

  return (
    <Page
      title="Stock Transfer Manage"
      subTitle="Stock Transfer Manage overview"
    >
      {modals.viewStockDetails?.isOpen && (
        <StockTransferDetailsModal
          isOpen
          setIsOpen={() => closeModal("viewStockDetails")}
          data={invoiceData}
        />
      )}
      <DataTable
        table={table}
        title="Stock Transfer Manage"
        columns={[
          { key: "transferNo", label: "Transfer No" },
          { key: "fromBranchName", label: "From" },
          { key: "toBranchName", label: "To" },
          {
            key: "status",
            label: "Status",
            render: (r) => (
              <Badge
                color={
                  r.status === "RECEIVED"
                    ? "green"
                    : r.status === "MISMATCH"
                      ? "red"
                      : "yellow"
                }
              >
                {r.status}
              </Badge>
            ),
          },
          {
            key: "action",
            label: "Action",
            render: (row) => (
              <button
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                onClick={() => handlePrintInvoice(row)}
                title="View Transfer"
              >
                <Eye className="w-4 h-4 text-gray-600" />
              </button>
            ),
          },
        ]}
      />
    </Page>
  );
};

export default StockTranaferPage;
