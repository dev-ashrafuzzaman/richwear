import SmartSelect from "../../../components/common/SmartSelect";

export default function PosCustomerSelect({ value, onChange }) {
  return (
    <SmartSelect
      customRoute="/customers"
      displayField={["code", "name"]}
      idField="_id"
      placeholder="Select customer"
      value={value}
      onChange={onChange}
    />
  );
}
