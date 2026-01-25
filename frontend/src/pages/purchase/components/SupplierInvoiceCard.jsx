import SupplierSelect from "./SupplierSelect";

export default function SupplierInvoiceCard({
  register,
  supplier,
  setSupplier,
}) {
  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">
        Supplier & Invoice
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SupplierSelect value={supplier} onChange={setSupplier} />

        <input
          {...register("invoiceNumber", { required: true })}
          placeholder="Invoice No"
          className="input"
        />

        <input
          type="date"
          {...register("invoiceDate", { required: true })}
          className="input"
        />

        <input
          type="number"
          {...register("paidAmount")}
          placeholder="Paid Amount"
          className="input"
        />
      </div>
    </div>
  );
}
