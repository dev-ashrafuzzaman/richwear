import { useMemo } from "react";
import DataTable from "../../components/table/DataTable";
import useModalManager from "../../hooks/useModalManager";
import useTableManager from "../../hooks/useTableManager";
import Page from "../../components/common/Page";
import ProductCreateModal from "./ProductCreateModal";

const ProductsPage = () => {
  const { modals, openModal, closeModal } = useModalManager();
  const table = useTableManager("/products");
  const categories = useTableManager("/categories");

  /* ✅ Optimized category lookup */
  const categoryMap = useMemo(() => {
    const map = {};
    categories.rows.forEach((c) => {
      map[c._id] = c.name;
    });
    return map;
  }, [categories.rows]);

  return (
    <Page title="Products" subTitle="Manage your organization products">
      {modals.addProduct?.isOpen && (
        <ProductCreateModal
          isOpen={modals.addProduct.isOpen}
          setIsOpen={() => closeModal("addProduct")}
          refetch={table.refetch}
        />
      )}

      <DataTable
        table={table}
        title="Products"
        headerActions={[
          {
            variant: "gradient",
            label: "Add Product",
            onClick: () => openModal("addProduct"),
          },
        ]}
        columns={[
          { key: "sku", label: "SKU" },
          { key: "name", label: "Name" },
          { key: "unit", label: "Unit" },
          {
            key: "categoryId",
            label: "Category",
            render: (r) => categoryMap[r.categoryId] || "—",
          },
          {
            key: "status",
            label: "Status",
            render: (r) => (
              <span
                className={`status ${
                  r.status === "active" ? "approved" : "rejected"
                }`}>
                {r.status === "active" ? "Active" : "Inactive"}
              </span>
            ),
          },
          { key: "createdAt", label: "Created At" },
        ]}
        actions={[
          { type: "edit", label: "Edit" },
          {
            type: "status",
            label: "Change Status",
            api: (row) => `/products/${row._id}/status`,
          },
          {
            type: "delete",
            label: "Delete",
            api: (row) => `/products/${row._id}`,
          },
        ]}
      />
    </Page>
  );
};

export default ProductsPage;
