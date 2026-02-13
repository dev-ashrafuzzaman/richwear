import { useEffect, useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Modal from "../../../components/modals/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { Controller, useForm } from "react-hook-form";
import ReportSmartSelect from "../../../components/common/ReportSmartSelect";
import useAxiosSecure from "../../../hooks/useAxiosSecure";

export default function SalaryPaymentModal({
  isOpen,
  setIsOpen,
  item,
  onSuccess,
}) {
  const { axiosSecure } = useAxiosSecure();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
  } = useForm();

  const [loading, setLoading] = useState(false);

  const amount = watch("amount");
  const paymentAccount = watch("paymentAccountId");

  /* ===============================
     AUTO SET DEFAULT AMOUNT
  =============================== */

  useEffect(() => {
    if (item) {
      setValue("amount", item.payableRemaining);
    }
  }, [item]);

  /* ===============================
     VALIDATION
  =============================== */

  const isValid =
    amount > 0 &&
    amount <= item?.payableRemaining &&
    paymentAccount;

  /* ===============================
     SUBMIT
  =============================== */

  const onSubmit = async (data) => {
    try {
      setLoading(true);

     const res= await axiosSecure.post(
        "/payroll/pay-salary",
        {
          salarySheetItemId: item._id,
          amount: Number(data.amount),
          paymentAccountId:
            data.paymentAccountId._id,
          payment:
            data.paymentAccountId.name,
        }
      );
console.log(res)
      toast.success("Salary paid successfully");

      onSuccess?.();
      setIsOpen(false);

    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Salary Payment"
      subTitle="Confirm and process employee salary payment"
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={!isValid || loading}
            prefix={
              loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )
            }
            variant="gradient"
          >
            Pay Salary
          </Button>
        </div>
      }
    >
      <div className="grid md:grid-cols-2 gap-6">

        {/* ================= EMPLOYEE INFO ================= */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h3 className="text-sm font-semibold text-gray-600">
            Employee Information
          </h3>

          <p>
            <span className="text-gray-500">
              Code:
            </span>{" "}
            {item.employee?.code}
          </p>

          <p>
            <span className="text-gray-500">
              Name:
            </span>{" "}
            {item.employee?.name}
          </p>

          <p>
            <span className="text-gray-500">
              Designation:
            </span>{" "}
            {item.employee?.designation} (
            {item.employee?.role})
          </p>

          <p>
            <span className="text-gray-500">
              Salary Request Date:
            </span>{" "}
            {new Date(
              item.createdAt
            ).toLocaleDateString()}
          </p>
        </div>

        {/* ================= SALARY BREAKDOWN ================= */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h3 className="text-sm font-semibold text-gray-600">
            Salary Breakdown
          </h3>

          <p>Base Salary: {item.baseSalary}</p>
          <p>Bonus: {item.bonus}</p>
          <p>Deduction: {item.deduction}</p>

          <hr />

          <p className="font-semibold">
            Net Salary: {item.netSalary}
          </p>

          <p className="text-red-600 font-semibold">
            Remaining: {item.payableRemaining}
          </p>
        </div>
      </div>

      {/* ================= PAYMENT SECTION ================= */}
      <div className="mt-6 space-y-4">

        <Input
          label="Payment Amount"
          type="number"
          value={amount || ""}
          onChange={(e) =>
            setValue(
              "amount",
              Number(e.target.value)
            )
          }
        />

        <Controller
          name="paymentAccountId"
          control={control}
          render={({ field }) => (
            <ReportSmartSelect
              label="Payment Account"
              route="/sales/payment-methods"
              extraParams={{
                parentCode: "1002",
                sort: "cash_first",
              }}
              displayField={["name", "code"]}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select Payment Account"
            />
          )}
        />

        {/* ================= VALIDATION MESSAGE ================= */}
        {!paymentAccount && (
          <p className="text-xs text-red-500">
            * Payment account is required
          </p>
        )}

        {amount > item.payableRemaining && (
          <p className="text-xs text-red-500">
            * Amount exceeds remaining
            balance
          </p>
        )}
      </div>
    </Modal>
  );
}
