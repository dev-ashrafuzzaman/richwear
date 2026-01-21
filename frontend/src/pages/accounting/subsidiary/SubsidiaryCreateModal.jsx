import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import useApi from "../../../hooks/useApi";
import Modal from "../../../components/common/Modal";
import Button from "../../../components/ui/Button";
import SmartSelect from "../../../components/common/SmartSelect";
import { toast } from "sonner";

// Example JSON schema
const formSchema = {
  name: "",
  mobile: "",
  contact_name: "",
  contact_mobile: "",
  address: "",
  email: "",
  details: "",
};

export default function SubsidiaryCreateModal({
  isOpen,
  setIsOpen,
  type,
  onSuccess,
}) {
  const { request, loading } = useApi();
  // const [isLocation, setLocation] = useState();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: Object.fromEntries(
      Object.keys(formSchema).map((key) => [key, ""]),
    ),
  });

  const onSubmit = async (input) => {
    // if (!isLocation) {
    //   const missing = [];
    //   if (!isLocation) missing.push("Location");
    //   return toast.error(`Please select ${missing.join(" and ")}`);
    // }

    const data = {
      // location_id: isLocation?.raw?.id,
      type: type,
      name: input.name,
      contact_name: input.contact_name,
      contact_mobile: input.contact_mobile,
      mobile: input.mobile,
      address: input.address,
      email: input.email,
      details: input.details,
    };
    await request("/subsidiaries/", "POST", data, {
      retries: 2,
      successMessage: "Created successfully!",
      errorMessage: "Failed to create.",
      onSuccess: () => {
        (reset(), setIsOpen(false), onSuccess());
      },
    });
  };

  const renderField = (key) => {
    const baseClass =
      "mt-1 block w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2.5 text-sm transition";

    if (key === "details") {
      return (
        <textarea
          rows={3}
          {...register(key)}
          className={`${baseClass} resize-none`}
          placeholder="Enter additional details..."
        />
      );
    }

    if (key === "email") {
      return (
        <input
          type="email"
          {...register(key)}
          className={baseClass}
          placeholder="Enter a valid email"
        />
      );
    }

    return (
      <input
        type="text"
        {...register(key, { required: `${key} is required` })}
        className={baseClass}
        placeholder={`Enter ${key.replaceAll("_", " ")}`}
      />
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title={`Add New ${type}`}
      size="xl"
      closeOnOverlayClick={true}
      closeOnEsc={true}
      footer={
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => setIsOpen(false)}
            className="px-5 py-2.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition">
            Cancel
          </button>

          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            prefix={loading && <Loader2 className="w-4 h-4 animate-spin" />}
            type="submit"
            variant="gradient"
            size="md">
            Create {type}
          </Button>
        </div>
      }>
      <div className="flex flex-col gap-6">
        {/* Responsive Grid for Inputs */}
        {/* <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Location Select
          </label>
          <SmartSelect
            customRoute="/locations/"
            useApi={true}
            displayField={["code", "name", "company.name"]}
            onChange={(val) => setLocation(val)}
            placeholder="Search Locations from API..."
          />
        </div> */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Object.keys(formSchema)
            .filter((key) => key !== "details")
            .map((key) => (
              <div key={key} className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1 capitalize">
                  {key.replaceAll("_", " ")}
                </label>
                {renderField(key)}
                {errors[key] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[key].message}
                  </p>
                )}
              </div>
            ))}
        </div>

        {/* Full width field for Details */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1 block">
            Details
          </label>
          {renderField("details")}
        </div>
      </div>
    </Modal>
  );
}
