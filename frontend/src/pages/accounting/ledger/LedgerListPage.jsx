import Table from "../../../components/common/Table";
import useTableManager from "../../../hooks/useTableManager";
import { ledgerTableToolbar } from "../../../config/tableToolbarConfig";
import Skeleton from "../../../components/skeletons/SkeletonCard";
import Page from "../../../components/common/Page";
import useModalManager from "../../../hooks/useModalManager";
import { Edit, RefreshCcw, Trash } from "lucide-react";
import LedgerCreateModal from "./LedgerCreateModal";

const LedgerListPage = () => {
  const { modals, openModal, closeModal } = useModalManager();
  const { data, loading, error, query, refetch, setQuery } = useTableManager(
    "/general-ledgers/",
    {
      queryKey: "general-ledgers",
      transform: (res) => res?.data ?? [],
    }
  );
  console.log(data);
  return (
    <Page title="General Ledgers">
      {modals.addLedger?.isOpen && (
        <LedgerCreateModal
          isOpen={modals.addLedger.isOpen}
          setIsOpen={() => closeModal("addLedger")}
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
            config={ledgerTableToolbar}
            onSuccess={refetch}
            modalButton={{
              label: "Add GL",
              onClick: () => openModal("addLedger"),
              variant: "gradient",
            }}
            columns={[
              { key: "gl_code", label: "GL Code", width: "80px" ,sortable: true},
              { key: "name", label: "Name", sortable: true },
              { key: "account_type.name", label: "Account Type", sortable: true },
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
                getApi: (row) => `/general-ledgers/${row.id}/`, // ✅ pass as function
              },
              {
                label: "",
                icon: <RefreshCcw size={14} />,
                type: "status",
                className: "action status",
                getApi: (row) => `/general-ledgers/${row.id}/toggle_status/`, // ✅ pass as function
              },
            ]}
          />
        )}
      </div>
    </Page>
  );
};

export default LedgerListPage;
