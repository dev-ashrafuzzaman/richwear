import React, { useState } from "react";
import { Edit, RefreshCcw, Trash } from "lucide-react";
import useModalManager from "../../hooks/useModalManager";
import useTableManager from "../../hooks/useTableManager";
import Page from "../../components/common/Page";
import Skeleton from "../../components/skeletons/SkeletonCard";
import Table from "../../components/common/Table";
import JournalReceiptsModal from "./JournalReceiptsModal";
import { journalTableToolbar } from "../../config/tableToolbarConfig";

const JournalInvoices = () => {
  const { modals, openModal, closeModal } = useModalManager();
  const [isData, setData] = useState();
  const { data, loading, error, query, refetch, setQuery } = useTableManager(
    "/journals/",
    {
      queryKey: "journals",
      transform: (res) => res?.data ?? [],
    }
  );
  return (
    <Page title="Journal Invoices">
      {modals.journalReceiptsModal?.isOpen && (
        <JournalReceiptsModal
          isOpen={modals.journalReceiptsModal.isOpen}
          setIsOpen={() => closeModal("journalReceiptsModal")}
          data={isData}
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
            config={journalTableToolbar}
            onSuccess={refetch}
            columns={[
              {
                key: "jv",
                label: "JV",
                width: "130px",
                css: "hover:text-blue-500 cursor-pointer",
                onClick: (row) => {
                  openModal("journalReceiptsModal"), setData(row);
                },
              },
              {
                key: "created_by.name",
                label: "Create By",
                sortable: true,
              },
              // { key: "narration", label: "Narration", sortable: true },
              { key: "posting_date", label: "Posting Date", sortable: true },
              // {
              //   key: "ledger_cal.total_debit",
              //   label: "Debit",
              //   sortable: true,
              //   css: "text-end",
              //   render: (value) => <span>{value == 0 ? "-" : value}</span>,
              // },
              // {
              //   key: "ledger_cal.total_credit",
              //   label: "Credit",
              //   sortable: true,
              //   css: "text-end",
              //   render: (value) => <span>{value == 0 ? "-" : value}</span>,
              // },
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
                    getApi: (row) => `/journals/${row.id}/`, // ✅ pass as function
                },
                {
                    label: "",
                    icon: <RefreshCcw size={14} />,
                    type: "status",
                    className: "action status",
                    getApi: (row) => `/journals/${row.id}/toggle_status/`, // ✅ pass as function
                },
            ]}
          />
        )}
      </div>
    </Page>
  );
};

export default JournalInvoices;
