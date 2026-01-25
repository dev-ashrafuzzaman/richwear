import { useEffect, useState } from "react";
import useApi from "../../../hooks/useApi";

export default function SupplierSelect({ value, onChange }) {
  const { request } = useApi();
  const [list, setList] = useState([]);

  useEffect(() => {
    request("/suppliers?limit=20", "GET").then(res =>
      setList(res?.data || [])
    );
  }, []);

  return (
    <select
      value={value?._id || ""}
      onChange={(e) =>
        onChange(list.find(s => s._id === e.target.value))
      }
      className="input"
    >
      <option value="">Select Supplier</option>
      {list.map(s => (
        <option key={s._id} value={s._id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
