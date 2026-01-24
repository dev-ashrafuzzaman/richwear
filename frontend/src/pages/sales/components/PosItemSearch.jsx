import SmartSelect from "../../../components/common/SmartSelect";

export default function PosItemSearch({ onSelect }) {
  return (
    <div className="relative">
      <SmartSelect
        customRoute="/sales/pos-items"
        barcode={true}
        displayField={["sku", "name"]}
        idField="variantId"
        placeholder="Scan barcode or search item"
        onChange={(opt) => {
          if (opt?.raw) onSelect(opt.raw);
        }}
        className="border-2 border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-200 text-lg py-3"
      />
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
        <kbd className="px-2 py-1 text-xs font-bold text-gray-600 bg-gray-100 border border-gray-300 rounded">F2</kbd>
        <span className="text-gray-400">|</span>
        <kbd className="px-2 py-1 text-xs font-bold text-gray-600 bg-gray-100 border border-gray-300 rounded">ESC</kbd>
      </div>
    </div>
  );
}