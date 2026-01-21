import Table from "../../../components/common/Table";
import useTableManager from "../../../hooks/useTableManager";
import { companyTableToolbar } from "../../../config/tableToolbarConfig";
import Skeleton from "../../../components/skeletons/SkeletonCard";
import Page from "../../../components/common/Page";
import { Edit, RefreshCcw, Trash } from "lucide-react";

const CompanyListPage = () => {
  const { data, loading, error, query,refetch, setQuery } = useTableManager(
    "/company/user/",
    {
      queryKey: "company",
      transform: (res) => res?.data ?? [],
    }
  );

  return (
    <Page title="Companies">
      <div>
        {/* Table */}
        {loading ? (
          <Skeleton type="table" />
        ) : (
          <Table
            query={query}
            setQuery={setQuery}
            config={companyTableToolbar}
            onSuccess={refetch}
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
                getApi: (row) => `/company/user/${row.id}/`, // ✅ pass as function
              },
              {
                label: "",
                icon: <RefreshCcw size={14} />,
                type: "status",
                className: "action status",
                getApi: (row) => `/company/user/${row.id}/toggle_status/`, // ✅ pass as function
              },
              ]}
          />
        )}
      </div>
    </Page>
  );
};

export default CompanyListPage;
