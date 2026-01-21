import Table from "../../../components/common/Table";
import useTableManager from "../../../hooks/useTableManager";
import { usersTableToolbar } from "../../../config/tableToolbarConfig";
import Skeleton from "../../../components/skeletons/SkeletonCard";
import Page from "../../../components/common/Page";
import { Edit, RefreshCcw, Trash } from "lucide-react";

const UserListPage = () => {
  const { data, loading, error, query,refetch, setQuery } = useTableManager(
    "/users/",
    {
      queryKey: "users",
      transform: (res) => res?.data ?? [],
    }
  );
console.log(data)
  return (
    <Page title="System Users">
      <div>
        {/* Table */}
        {loading ? (
          <Skeleton type="table" />
        ) : (
          <Table
            query={query}
            setQuery={setQuery}
            config={usersTableToolbar}
            onSuccess={refetch}
            columns={[
              { key: "code", label: "ID", width: "80px" },
              { key: "name", label: "Name", sortable: true },
              { key: "role", label: "Role", sortable: true },
              { key: "email", label: "Email", sortable: true },
              { key: "mobile", label: "Mobile", sortable: true },
              { key: "created_at", label: "Create At", sortable: true },
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
                getApi: (row) => `/users/${row.id}/`, // ✅ pass as function
              },
              {
                label: "",
                icon: <RefreshCcw size={14} />,
                type: "status",
                className: "action status",
                getApi: (row) => `/users/${row.id}/toggle_status/`, // ✅ pass as function
              },
              ]}
          />
        )}
      </div>
    </Page>
  );
};

export default UserListPage;
