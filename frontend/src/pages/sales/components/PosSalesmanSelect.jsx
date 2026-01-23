import SmartSelect from "../../../components/common/SmartSelect";

export default function PosSalesmanSelect({ value, onChange }) {
  return (
    <SmartSelect
      useApi
      customRoute="/employees"
      displayField={["code", "name"]}
      idField="_id"
      placeholder="Select salesman"
      value={value}
      onChange={onChange}
    />
  );
}
