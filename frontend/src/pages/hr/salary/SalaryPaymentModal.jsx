import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Modal from "../../../components/modals/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import useAxiosSecure from "../../../hooks/useAxiosSecure";

export default function SalaryPaymentModal({
  isOpen,
  setIsOpen,
  item,
  onSuccess,
}) {
  const { axiosSecure } = useAxiosSecure();

  const [amount, setAmount] = useState(
    item?.payableRemaining || 0
  );
  const [method, setMethod] = useState("CASH");
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Invalid amount");
      return;
    }

    if (Number(amount) > item.payableRemaining) {
      toast.error("Amount exceeds remaining balance");
      return;
    }

    try {
      setLoading(true);

      await axiosSecure.post("/payroll/salary-payments", {
        salarySheetItemId: item._id,
        amount: Number(amount),
        method,
      });

      toast.success("Salary paid successfully");

      onSuccess?.();
      setIsOpen(false);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Salary Payment"
      subTitle="Pay salary to employee."
      size="md"
      closeOnOverlayClick
      closeOnEsc
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>

          <Button
            onClick={handlePay}
            disabled={loading}
            prefix={
              loading && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )
            }
            variant="gradient"
          >
            Pay Salary
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="text-sm text-muted">
          Remaining Amount:{" "}
          <span className="font-semibold">
            {item?.payableRemaining}
          </span>
        </div>

        <Input
          label="Payment Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <Select
          label="Payment Method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          options={[
            { label: "Cash", value: "CASH" },
            { label: "Bank", value: "BANK" },
          ]}
        />
      </div>
    </Modal>
  );
}
