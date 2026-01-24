import AsyncSelect from "../../../components/ui/AsyncSelect";
import usePosAsyncLoaders from "./usePosAsyncLoaders";

export default function PosSalesmanSelect({ value, onChange, error }) {
  const { loadEmployees } = usePosAsyncLoaders();

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">Salesman</label>
      <AsyncSelect
        placeholder="Search salesman..."
        loadOptions={loadEmployees}
        value={value}
        onChange={onChange}
        error={error}
        className="border-2 border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-200"
      />
    </div>
  );
}