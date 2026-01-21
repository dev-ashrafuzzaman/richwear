import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import useApi from "../../../hooks/useApi";
import Modal from "../../../components/common/Modal";
import Button from "../../../components/ui/Button";

export default function BranchCreateModal({ isOpen, setIsOpen, onSuccess }) {
  const { request, loading } = useApi();
  // const [isLocation, setLocation] = useState();
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
    const data = {
      name: input.name,
      details: input.details,
    };
    await request("/faces/", "POST", data, {
      retries: 2,
      successMessage: "created successfully!",
      errorMessage: "Failed to create.",
      onSuccess: () => {
        (reset(), setIsOpen(false), onSuccess());
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Add New Face"
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
            Create Face
          </Button>
        </div>
      }>
      <div className="flex flex-col gap-4">
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
