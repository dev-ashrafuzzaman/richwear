import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Page from "../../../components/common/Page";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import SalaryPaymentModal from "./SalaryPaymentModal";
import Button from "../../../components/ui/Button";
import { toast } from "sonner";
import useModalManager from "../../../hooks/useModalManager";

export default function SalarySheetDetails() {
  const { id } = useParams();
  const { axiosSecure } = useAxiosSecure();
  const { modals, openModal, closeModal } = useModalManager();

  const [sheet, setSheet] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ==============================
     FETCH DETAILS
  ============================== */

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosSecure.get(
        `/payroll/salary-sheets/${id}`
      );
      setSheet(res.data.data);
    } catch (err) {
      toast.error("Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  /* ==============================
     HANDLE OPEN PAYMENT MODAL
  ============================== */

  const handleOpenPayment = (item) => {
    setSelectedItem(item);
    openModal("salaryPayment");
  };

  /* ==============================
     LOADING / EMPTY
  ============================== */

  if (loading) {
    return (
      <Page title="Loading...">
        <div className="p-6">Loading...</div>
      </Page>
    );
  }

  if (!sheet) return null;

  return (
    <Page
      title={`Salary Sheet - ${sheet.month}`}
      subTitle={`Voucher: ${sheet.journal?.voucherNo}`}
    >
      {/* ================= HEADER SECTION ================= */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <div className="grid md:grid-cols-3 gap-6">

          {/* Branch Info */}
          <div>
            <p className="text-xs text-gray-500 mb-1">
              Branch
            </p>
            <p className="font-semibold">
              {sheet.branch?.name}
            </p>
            <p className="text-sm text-gray-500">
              {sheet.branch?.address}
            </p>
            <p className="text-sm text-gray-500">
              {sheet.branch?.phone}
            </p>
          </div>

          {/* Created By */}
          <div>
            <p className="text-xs text-gray-500 mb-1">
              Created By
            </p>
            <p className="font-semibold">
              {sheet.createdByUser?.name}
            </p>
            <p className="text-sm text-gray-500">
              {sheet.createdByUser?.email}
            </p>
          </div>

          {/* Status Info */}
          <div>
            <p className="text-xs text-gray-500 mb-1">
              Sheet Info
            </p>
            <p className="font-semibold">
              Month: {sheet.month}
            </p>
            <p
              className={`text-sm font-medium ${
                sheet.status === "POSTED"
                  ? "text-blue-600"
                  : "text-gray-500"
              }`}
            >
              Status: {sheet.status}
            </p>
          </div>
        </div>
      </div>

      {/* ================= SUMMARY CARDS ================= */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">

        <SummaryCard
          label="Total Net"
          value={sheet.totalNet}
        />

        <SummaryCard
          label="Total Employees"
          value={sheet.totalEmployees}
        />

        <SummaryCard
          label="Total Paid"
          value={sheet.totalPaid}
          valueClass="text-green-600"
        />

        <SummaryCard
          label="Remaining"
          value={sheet.totalRemaining}
          valueClass="text-red-600"
        />
      </div>

      {/* ================= EMPLOYEE TABLE ================= */}

      <div className="bg-white p-6 rounded-xl shadow">
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Employee</th>
              <th className="p-2 border">Net Salary</th>
              <th className="p-2 border">Remaining</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>

          <tbody>
            {sheet.items.map((item) => (
              <tr key={item._id} className="text-center">
                <td className="border p-2 text-left">
                  <div className="font-medium">
                    ({item.employee?.code}){" "}
                    {item.employee?.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.employee?.designation} -{" "}
                    {item.employee?.role}
                  </div>
                </td>

                <td className="border p-2">
                  {item.netSalary}
                </td>

                <td className="border p-2">
                  {item.payableRemaining}
                </td>

                <td className="border p-2">
                  {item.status}
                </td>

                <td className="border p-2">
                  {item.status !== "PAID" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        handleOpenPayment(item)
                      }
                    >
                      Pay
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= PAYMENT MODAL ================= */}

      {modals.salaryPayment?.isOpen &&
        selectedItem && (
          <SalaryPaymentModal
            isOpen={modals.salaryPayment.isOpen}
            setIsOpen={() =>
              closeModal("salaryPayment")
            }
            item={selectedItem}
            onSuccess={fetchDetails}
          />
        )}
    </Page>
  );
}

/* ==============================
   Reusable Summary Card
============================== */

function SummaryCard({ label, value, valueClass }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow text-center">
      <p className="text-xs text-gray-500 mb-1">
        {label}
      </p>
      <p
        className={`text-xl font-bold ${
          valueClass || ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
