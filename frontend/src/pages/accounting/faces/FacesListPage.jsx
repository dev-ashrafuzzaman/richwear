import React from "react";
import FaceCreateModal from "./FaceCreateModal";
import { Edit, RefreshCcw, Trash } from "lucide-react";
import useModalManager from "../../../hooks/useModalManager";
import useTableManager from "../../../hooks/useTableManager";
import Skeleton from "../../../components/skeletons/SkeletonCard";
import Page from "../../../components/common/Page";
import Table from "../../../components/common/Table";
import { facesTableToolbar } from "../../../config/tableToolbarConfig";

const FacesListPage = () => {
  const { modals, openModal, closeModal } = useModalManager();
  const { data, loading, error, query,refetch, setQuery } = useTableManager(
    "/faces/",
    {
      queryKey: "faces",
      transform: (res) => res?.data ?? [],
    }
  );

  return (
    <Page title="Faces">
      {modals.addFace?.isOpen && (
        <FaceCreateModal
          isOpen={modals.addFace.isOpen}
          setIsOpen={() => closeModal("addFace")}
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
            config={facesTableToolbar}
            onSuccess={refetch}
            modalButton={{
              label: "Add Face",
              onClick: () => openModal("addFace"),
              variant: "gradient",
            }}
            columns={[
              { key: "code", label: "ID", width: "80px" },
              { key: "name", label: "Name", sortable: true },
              {
                key: "is_active",
                label: "Status",
                sortable: true,
                render: (value) => (
                  <span
                    className={`${value === true ? "status approved" : "status rejected"
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
                getApi: (row) => `/faces/${row.id}/`, // ✅ pass as function
              },
              {
                label: "",
                icon: <RefreshCcw size={14} />,
                type: "status",
                className: "action status",
                getApi: (row) => `/faces/${row.id}/toggle_status/`, // ✅ pass as function
              },
              ]}
          />
        )}
      </div>
    </Page>
  );
};

export default FacesListPage;
