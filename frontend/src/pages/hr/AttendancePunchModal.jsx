import { useForm, Controller, useWatch } from "react-hook-form";
import { Loader2 } from "lucide-react";

import useApi from "../../hooks/useApi";
import Modal from "../../components/modals/Modal";
import Button from "../../components/ui/Button";
import Checkbox from "../../components/ui/Checkbox";
import AsyncSelect from "../../components/ui/AsyncSelect";
import { useEffect } from "react";

export default function AttendancePunchModal({
  isOpen,
  onClose,
  onSuccess,
  type = "IN", // UI hint only
}) {
  const { request, loading } = useApi();

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      employeeId: "",
      branchId: "",
      confirm: false,
    },
  });

  /* 👀 Watchers */
  const employeeId = useWatch({ control, name: "employeeId" });
  const branchId = useWatch({ control, name: "branchId" });
  const confirmed = useWatch({ control, name: "confirm" });

  /* -------------------------------
     Load employees (active)
  -------------------------------- */
  const loadEmployees = async (search) => {
    const res = await request(
      "/employees",
      "GET",
      { search, status: "active", limit: 10 },
      { useToast: false },
    );

    return res?.data?.map((e) => ({
      label: `${e.personal.name} (${e.code})`,
      value: e._id,
    }));
  };

  /* -------------------------------
     Load branches (active)
  -------------------------------- */
  const loadBranches = async (search) => {
    const res = await request(
      "/branches?code=JG",
      "GET",
      { search, status: "active", limit: 10 },
      { useToast: false },
    );

    return res?.data?.map((b) => ({
      label: `${b.name} (${b.code})`,
      value: b._id,
    }));
  };

  /* -------------------------------
   Load default branch (JG)
-------------------------------- */
  useEffect(() => {
    const loadDefaultBranch = async () => {
      const res = await request(
        "/branches",
        "GET",
      );
      if (res?.data?.length) {
        setValue("branchId", res.data[0]._id);
      }
    };

    if (isOpen) {
      loadDefaultBranch();
    }
  }, [isOpen, request, setValue]);

  /* -------------------------------
     Submit
  -------------------------------- */
  const onSubmit = async (data) => {
    await request(
      "/attendance/today",
      "POST",
      {
        employeeId: data.employeeId,
        branchId: data.branchId,
      },
      {
        successMessage:
          type === "IN" ? "Punch in successful" : "Punch out successful",
        onSuccess: () => {
          reset();
          onClose();
          onSuccess?.();
        },
      },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={onClose}
      title={type === "IN" ? "Employee Punch In" : "Employee Punch Out"}
      subTitle="Attendance will be recorded automatically for today."
      size="md"
      closeOnOverlayClick
      closeOnEsc
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={!confirmed || loading}
            prefix={loading && <Loader2 className="w-4 h-4 animate-spin" />}
            variant="gradient">
            {type === "IN" ? "Punch In" : "Punch Out"}
          </Button>
        </div>
      }>
      <div className="flex flex-col gap-4">
        {/* 👤 Employee */}
        <Controller
          name="employeeId"
          control={control}
          rules={{ required: "Employee is required" }}
          render={({ field }) => (
            <AsyncSelect
              label="Employee"
              placeholder="Search employee..."
              loadOptions={loadEmployees}
              value={field.value}
              onChange={field.onChange}
              error={errors.employeeId?.message}
            />
          )}
        />

        {/* 🏢 Branch */}
        <Controller
          name="branchId"
          control={control}
          rules={{ required: "Branch is required" }}
          render={({ field }) => (
            <AsyncSelect
              label="Branch"
              placeholder="JG Branch"
              loadOptions={loadBranches}
              value={field.value}
              onChange={field.onChange}
              error={errors.branchId?.message}
            />
          )}
        />

        {/* ✅ Confirm */}
        <Controller
          name="confirm"
          control={control}
          render={({ field }) => (
            <Checkbox
              disabled={!employeeId || !branchId}
              checked={field.value}
              onChange={field.onChange}
              label="I confirm the attendance information is correct"
            />
          )}
        />

        {/* ℹ️ Info */}
        <div className="text-xs text-muted">
          • If no attendance exists today → Punch In will be recorded • If Punch
          In already exists → Punch Out will be recorded
        </div>
      </div>
    </Modal>
  );
}
