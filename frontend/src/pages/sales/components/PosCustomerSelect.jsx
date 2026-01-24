import AsyncSelect from "../../../components/ui/AsyncSelect";
import usePosAsyncLoaders from "./usePosAsyncLoaders";

export default function PosCustomerSelect({ value, onChange, error }) {
  const { loadCustomers } = usePosAsyncLoaders();

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">Customer</label>
      <AsyncSelect
        placeholder="Search customer..."
        loadOptions={loadCustomers}
        value={value}
        onChange={onChange}
        error={error}
        className="border-2 border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-200"
      />
    </div>
  );
}