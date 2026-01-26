import { useMemo } from "react";
import SmartSelect from "../../../components/common/SmartSelect";
import { Search } from "lucide-react";

export default function PosSalesmanSelect({ value, onChange }) {
  /* ---------------- Raw customer → SmartSelect value ---------------- */
  const selectedOption = useMemo(() => {
    if (!value) return null;

    return {
      value: value._id,
      label: `${value.code} — ${value.personal.name}`,
      raw: value,
    };
  }, [value]);

  return (
    <>
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Salesman
          </label>
        </div>

        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>

            <SmartSelect
              customRoute="/employees"
              displayField={["code", "personal.name"]}
              idField="_id"
              placeholder="Search salesman"
              preLoad={true}
              pageSize={10}
              phoneInstant={true}
              phoneLength={10}
              value={selectedOption}
              onChange={(opt) => onChange(opt?.raw || null)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
