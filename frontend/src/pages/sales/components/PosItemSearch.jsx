import SmartSelect from "../../../components/common/SmartSelect";

export default function PosItemSearch({ onSelect }) {
  return (
    <SmartSelect
      customRoute="/sales/pos-items"
      barcode={true}
      displayField={["sku", "name"]}
      idField="variantId"
      placeholder="Scan barcode or search item"
      onChange={(opt) => {
        if (opt?.raw) onSelect(opt.raw);
      }}
    />
  );
}
