import Table from "../../../components/common/Table";
import useTableManager from "../../../hooks/useTableManager";
import { accountTypeTableToolbar } from "../../../config/tableToolbarConfig";
import Skeleton from "../../../components/skeletons/SkeletonCard";
import Page from "../../../components/common/Page";
import useModalManager from "../../../hooks/useModalManager";
import { Edit, RefreshCcw, Trash } from "lucide-react";
import TypeCreateModal from "./TypeCreateModal";

const TypesListPage = () => {
  const { modals, openModal, closeModal } = useModalManager();
  const { data, loading, error, query, refetch, setQuery } = useTableManager(
    "/account-types/",
    {
      queryKey: "account-types",
      transform: (res) => res?.data ?? [],
    }
  );
  return (
    <Page title="Account Types">
      {modals.addType?.isOpen && (
        <TypeCreateModal
          isOpen={modals.addType.isOpen}
          setIsOpen={() => closeModal("addType")}
          onSuccess={refetch}
        />
      )}
      <div>
        {/* Table */}
        {loading ? (
          <Skeleton type="table" />
        ) : (
          <Table
            query={query}
            setQuery={setQuery}
            config={accountTypeTableToolbar}
            onSuccess={refetch}
            modalButton={{
              label: "Add Account Type",
              onClick: () => openModal("addType"),
              variant: "gradient",
            }}
            columns={[
              { key: "code", label: "ID", width: "80px",sortable: true },
              { key: "name", label: "Name", sortable: true },
              { key: "face.name", label: "Face", sortable: true },
              {
                key: "is_active",
                label: "Status",
                sortable: true,
                render: (value) => (
                  <span
                    className={`${
                      value === true ? "status approved" : "status rejected"
                    }`}>
                    {value === true ? "Active" : "Inactive"}
                  </span>
                ),
              },
            ]}
            data={data}
            actions={[
              {
                label: "",
                icon: <Edit size={14} />,
                onClick: (row) => alert("Edit " + row.name),
                className: "action edit",
              },
              {
                label: "",
                icon: <Trash size={14} />,
                type: "delete",
                className: "action delete",
                getApi: (row) => `/account-types/${row.id}/`, // ✅ pass as function
              },
              {
                label: "",
                icon: <RefreshCcw size={14} />,
                type: "status",
                className: "action status",
                getApi: (row) => `/account-types/${row.id}/toggle_status/`, // ✅ pass as function
              },
            ]}
          />
        )}
      </div>
    </Page>
  );
};

export default TypesListPage;
