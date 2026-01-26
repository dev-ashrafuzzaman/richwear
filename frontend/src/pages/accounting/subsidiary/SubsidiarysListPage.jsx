import React from "react";
import { Edit, RefreshCcw, Trash } from "lucide-react";
import useModalManager from "../../../hooks/useModalManager";
import useTableManager from "../../../hooks/useTableManager";
import SubsidiaryCreateModal from "./SubsidiaryCreateModal";
import Page from "../../../components/common/Page";
import Skeleton from "../../../components/skeletons/SkeletonCard";
import { subsidiaryTableToolbar } from "../../../config/tableToolbarConfig";
import Table from "../../../components/common/Table";

const SubsidiarysListPage = ({ type }) => {
  const { modals, openModal, closeModal } = useModalManager();
  const config = {
    ...subsidiaryTableToolbar,
    title: `${type.charAt(0).toUpperCase() + type.slice(1)}s Management`,
  };

  const { data, loading, error, query, refetch, setQuery } = useTableManager(
    "/subsidiaries/",
    {
      initialQuery: { type: type },
      queryKey: "subsidiaries",
      transform: (res) => res?.data ?? [],
    },
  );
  return (
    <Page title={type}>
      {modals.addSubsidiary?.isOpen && (
        <SubsidiaryCreateModal
          isOpen={modals.addSubsidiary.isOpen}
          setIsOpen={() => closeModal("addSubsidiary")}
          type={type}
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
            config={config}
            onSuccess={refetch}
            modalButton={{
              label: `Add ${type}`,
              onClick: () => openModal("addSubsidiary"),
              variant: "gradient",
            }}
            columns={[
              { key: "code", label: "ID", width: "130px" },
              { key: "name", label: `${type} Name`, sortable: true },
              { key: "mobile", label: `${type} Mobile`, sortable: true },
              {
                key: "contact_mobile",
                label: "Contact Mobile",
                sortable: true,
              },
              { key: "email", label: "Email", sortable: true },
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
                getApi: (row) => `/subsidiarys/${row.id}/`, // ✅ pass as function
              },
              {
                label: "",
                icon: <RefreshCcw size={14} />,
                type: "status",
                className: "action status",
                getApi: (row) => `/subsidiarys/${row.id}/toggle_status/`, // ✅ pass as function
              },
            ]}
          />
        )}
      </div>
    </Page>
  );
};

export default SubsidiarysListPage;
