import { useEffect, useRef } from "react";
import SmartSelect from "../../../components/common/SmartSelect";

export default function PosItemSearch({ onSelect }) {
  const selectRef = useRef(null);

  /* ---------------- Keyboard Shortcuts ---------------- */
  useEffect(() => {
    const handleKey = (e) => {
      // 🔥 F2 → focus search
      if (e.key === "F2") {
        e.preventDefault();
        selectRef.current?.focus();
      }

      // 🔥 ESC → clear + focus
      if (e.key === "Escape") {
        e.preventDefault();

        // react-select way to clear input
        selectRef.current?.clearValue?.();
        selectRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="relative ">
      <SmartSelect
        ref={selectRef}
        customRoute="/stocks/pos-items"
        barcode={true}
        displayField={["sku", "productName"]}
        idField="variantId"
        placeholder="Scan barcode or search item"
        onChange={(opt) => {
          if (opt?.raw) onSelect(opt.raw);
        }}
        className="border-2 border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-200 text-lg py-3"
      />
    </div>
  );
}
