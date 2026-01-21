import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "../../../components/common/Modal";
import useApi from "../../../hooks/useApi";
import { Loader2, Info } from "lucide-react";
import Button from "../../../components/ui/Button";
import SmartSelect from "../../../components/common/SmartSelect";
import { toast } from "sonner";

export default function LedgerCreateModal({ isOpen, setIsOpen, onSuccess }) {
  const { request, loading } = useApi();
  const [isType, setType] = useState();
  const [glType, setGlType] = useState(null); // NEW STATE for radio

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      details: "",
    },
  });

  const onSubmit = async (input) => {
    if (!isType || !glType) {
      const missing = [];
      if (!isType) missing.push("Account Type");
      if (!glType) missing.push("GL Type");
      return toast.error(`Please select ${missing.join(" and ")}`);
    }

    const data = {
      account_type_id: isType?.raw?.id,
      name: input.name,
      details: input.details,
      reconciliation_type: glType, // NEW FIELD
    };

    await request("/general-ledgers/", "POST", data, {
      retries: 2,
      successMessage: "Created successfully!",
      errorMessage: "Failed to create.",
      onSuccess: () => {
        reset();
        setIsOpen(false);
        onSuccess();
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Add New General Ledger"
      size="md"
      closeOnOverlayClick={true}
      closeOnEsc={true}
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
            Cancel
          </button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            prefix={loading && <Loader2 className="w-4 h-4 animate-spin" />}
            type="submit"
            variant="gradient"
            size="md">
            Create GL
          </Button>
        </div>
      }>
      <div className="flex flex-col gap-4 mb-10">
        {/* Account Type */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Account Type Select
          </label>
          <SmartSelect
            onChange={(val) => setType(val)}
            customRoute="/account-types/"
            useApi={true}
            displayField={["code", "name"]}
            searchFields={["code", "name"]}
            placeholder="Select Type..."
          />
        </div>

        {/* Radio for Reconciliation Type */}
        <div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="glType"
                value="reconciliation"
                checked={glType === "reconciliation"}
                onChange={(e) => setGlType(e.target.value)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">Recon GL</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="glType"
                value="non-reconciliation"
                checked={glType === "non-reconciliation"}
                onChange={(e) => setGlType(e.target.value)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">Non-Recon GL</span>
            </label>
          </div>

          {/* Info Label */}
          {glType && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
              <Info className="w-4 h-4 mt-[2px] shrink-0" />
              {glType === "reconciliation" ? (
                <p>
                  <strong>Reconciliation GL:</strong> Used to reconcile
                  transactions and match balances between accounts or systems.
                </p>
              ) : (
                <p>
                  <strong>Non-Reconciliation GL:</strong> A standard general
                  ledger account that doesn’t require reconciliation activities.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            {...register("name", { required: "Name is required" })}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Details
          </label>
          <textarea
            {...register("details")}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
      </div>
    </Modal>
  );
}
