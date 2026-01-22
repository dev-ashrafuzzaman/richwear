import { useForm, Controller, useWatch } from "react-hook-form";
import { Loader2 } from "lucide-react";
import useApi from "../../hooks/useApi";
import useTableManager from "../../hooks/useTableManager";
import Modal from "../../components/modals/Modal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Checkbox from "../../components/ui/Checkbox";

export default function ProductCreateModal({ isOpen, setIsOpen, refetch }) {
  const { request, loading } = useApi();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      level1Id: "",
      categoryId: "",
      name: "",
      confirm: false,
    },
  });

  /* 👀 Watchers */
  const level1Id = useWatch({ control, name: "level1Id" });
  const categoryId = useWatch({ control, name: "categoryId" });
  const name = useWatch({ control, name: "name" });
  const confirmed = useWatch({ control, name: "confirm" });

  /* Data sources */
  const level1Table = useTableManager("/categories?level=1");
  const level2Table = useTableManager(
    level1Id ? `/categories?level=2&parentId=${level1Id}` : null
  );

  const onSubmit = async (data) => {
    await request(
      "/products",
      "POST",
      {
        name: data.name,
        categoryId: data.categoryId,
      },
      {
        successMessage: "Product created successfully",
        onSuccess: () => {
          reset();
          setIsOpen(false);
          refetch();
        },
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Add New Product"
      subTitle="Follow steps to create product"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={!confirmed || loading}
            prefix={loading && <Loader2 className="w-4 h-4 animate-spin" />}
            variant="gradient">
            Create Product
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">

        {/* Level 1 */}
        <Controller
          name="level1Id"
          control={control}
          rules={{ required: "Level 1 category required" }}
          render={({ field }) => (
            <Select
              label="Category Level 1"
              placeholder="Select main category"
              value={field.value}
              onChange={(val) => {
                field.onChange(val);
                setValue("categoryId", "");
              }}
              error={errors.level1Id?.message}
              options={level1Table.rows.map((c) => ({
                label: c.name,
                value: c._id,
              }))}
            />
          )}
        />

        {/* Level 2 (disabled until level 1) */}
        <Controller
          name="categoryId"
          control={control}
          rules={{ required: "Level 2 category required" }}
          render={({ field }) => (
            <Select
              label="Category Level 2"
              placeholder="Search & select sub-category"
              searchable
              disabled={!level1Id}
              value={field.value}
              onChange={field.onChange}
              error={errors.categoryId?.message}
              options={level2Table?.rows?.map((c) => ({
                label: c.name,
                value: c._id,
              }))}
            />
          )}
        />

        {/* Product name (disabled until level 2) */}
        <Input
          label="Product Name"
          placeholder="Cotton T-Shirt"
          disabled={!categoryId}
          error={errors.name?.message}
          {...register("name", {
            required: "Product name is required",
          })}
        />

        {/* Confirmation (disabled until name entered) */}
        <Controller
          name="confirm"
          control={control}
          render={({ field }) => (
            <Checkbox
              disabled={!name}
              checked={field.value}
              onChange={field.onChange}
              label="I confirm that the information is correct"
            />
          )}
        />
      </div>
    </Modal>
  );
}
