import useModalManager from "../../../hooks/useModalManager";
import Page from "../../../components/common/Page";
import DataTable from "../../../components/table/DataTable";
import useTableManager from "../../../hooks/useTableManager";
import MembershipCreateModal from "./MembershipCreateModal";

const MembershipPage = () => {
  const { modals, openModal, closeModal } = useModalManager();
  const table = useTableManager("/memberships");
  return (
    <Page title="Memberships" subTitle="Manage your organization memberships">
      {modals.createMembership?.isOpen && (
        <MembershipCreateModal
          isOpen={modals.createMembership.isOpen}
          setIsOpen={() => closeModal("createMembership")}
          refetch={table.refetch}
        />
      )}
      <DataTable
        table={table}
        title="Memberships"
        headerActions={[
          {
            variant: "gradient",
            label: "Create Membership",
            onClick: () => openModal("createMembership"),
          },
        ]}
        columns={[
          { key: "code", label: "Membership Code" },

          {
            key: "branchName",
            label: "Branch",
            render: (r) => (
              <div>
                <div className="font-medium">{r.branchName}</div>
              </div>
            ),
          },

          { key: "name", label: "Customer Name" },

          { key: "phone", label: "Phone" },

          {
            key: "createdAt",
            label: "Created At",
            render: (r) => new Date(r.createdAt).toLocaleDateString("en-GB"),
          },

          {
            key: "status",
            label: "Status",
            render: (r) => (
              <span
                className={`status ${
                  r.status === "ACTIVE"
                    ? "approved"
                    : r.status === "PENDING"
                      ? "pending"
                      : "rejected"
                }`}
              >
                {r.status}
              </span>
            ),
          },
        ]}
        actions={
          [
            // { type: "view", label: "View" },
            // { type: "edit", label: "Edit" },
            // {
            //   type: "status",
            //   label: "Change Status",
            //   api: (row) => `/customers/${row._id}/status`,
            // },
            // {
            //   type: "delete",
            //   label: "Delete",
            //   api: (row) => `/customers/${row._id}`,
            //   hidden: (row) => row.isSystem === true,
            // },
          ]
        }
      />
    </Page>
  );
};

export default MembershipPage;
