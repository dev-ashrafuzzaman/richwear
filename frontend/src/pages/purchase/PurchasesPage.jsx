import DataTable from "../../components/table/DataTable";
import useTableManager from "../../hooks/useTableManager";
import { useNavigate } from "react-router-dom";
import Page from "../../components/common/Page";
import { RotateCcw } from "lucide-react";

const PurchasesPage = () => {
  const table = useTableManager("/purchases");
  const navigate = useNavigate();
  return (
    <Page title="Purchases" subTitle="Manage supplier purchases">
      <DataTable
        table={table}
        title="Purchase List"
        columns={[
          { key: "purchaseNo", label: "Purchase No" },
          { key: "invoiceNumber", label: "Invoice No" },
          {
            key: "supplier",
            label: "Supplier",
            render: (row) => row.supplier?.name || "—",
          },
          { key: "totalQty", label: "Qty" },
          { key: "totalAmount", label: "Total" },
          { key: "paidAmount", label: "Paid" },
          { key: "createdAt", label: "Date" },
        ]}
        actions={[
          // {
          //   type: "view",
          //   label: "Invoice",
          //   onClick: (row) =>
          //     navigate(`/purchases/${row._id}/invoice`)
          // },
          {
            type: "custom",
            label: "Return",
             icon: <RotateCcw size={14} />,
            onClick: (row) =>
              navigate(`/purchases/return/create?purchaseId=${row._id}`),
          },
         
        ]}
      />
    </Page>
  );
};

export default PurchasesPage;
