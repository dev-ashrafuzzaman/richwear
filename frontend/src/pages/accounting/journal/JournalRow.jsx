// journal-entries/components/JournalRow.jsx

import { Controller } from "react-hook-form";
import { Trash2 } from "lucide-react";
import SmartSelect from "../../../components/common/SmartSelect";

const JournalRow = ({
  field,
  index,
  entries,
  control,
  watch,
  remove,
  currentRowIndex,
  isRowComplete,
  isFieldDisabled,
  focusField,
  handleTabNavigation,
  getSubsidiaryType,
  ledgerSubsidieryFields,
}) => {
  const row = entries[index];
  const subsidiaryType = watch(`entries.${index}.subsidiary_type`);
  const isRowFocused = currentRowIndex === index;

  return (
    <tr
      key={field.id}
      data-row={index}
      className={`border-b hover:bg-gray-50 transition-colors ${
        isRowFocused ? "bg-blue-50 ring-1 ring-blue-200" : ""
      } ${
        !isRowComplete(index) && isRowFocused
          ? "bg-yellow-50 ring-1 ring-yellow-200"
          : ""
      }`}
    >
      <td className="p-3 font-medium text-gray-500">
        {index + 1}
        {!isRowComplete(index) && isRowFocused && (
          <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1" />
        )}
      </td>

      {/* Ledger */}
      <td className="p-3">
        <Controller
          name={`entries.${index}.ledger`}
          control={control}
          render={({ field }) => (
            <SmartSelect
              {...field}
              customRoute="/general-ledgers/"
              useApi
              displayField={["gl_code", "name"]}
              searchFields={["gl_code", "name"]}
              placeholder="Select Ledger..."
              onFocus={() => focusField(index, "ledger")}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  handleTabNavigation(index, "ledger", e.shiftKey);
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  handleTabNavigation(index, "ledger");
                }
              }}
            />
          )}
        />
      </td>

      {/* Subsidiary */}
      <td className="p-3">
        {subsidiaryType ? (
          <Controller
            name={`entries.${index}.subsidiary`}
            control={control}
            render={({ field }) => (
              <SmartSelect
                {...field}
                customRoute="/subsidiaries/"
                type={subsidiaryType}
                useApi
                displayField={ledgerSubsidieryFields}
                searchFields={ledgerSubsidieryFields}
                placeholder={`Select ${subsidiaryType}...`}
                disabled={isFieldDisabled(index, "subsidiary")}
                onFocus={() => focusField(index, "subsidiary")}
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    handleTabNavigation(index, "subsidiary", e.shiftKey);
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    handleTabNavigation(index, "subsidiary");
                  }
                }}
              />
            )}
          />
        ) : (
          <div className="px-3 py-2 text-gray-400 text-sm bg-gray-50 rounded border">
            Select ledger first
          </div>
        )}
      </td>

      {/* Debit */}
      <td className="p-3">
        <Controller
          name={`entries.${index}.debit`}
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="number"
              step="0.01"
              placeholder="0.00"
              disabled={isFieldDisabled(index, "debit")}
              onFocus={() => focusField(index, "debit")}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  handleTabNavigation(index, "debit", e.shiftKey);
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  handleTabNavigation(index, "debit");
                }
              }}
              className="w-full text-right px-3 py-2 border rounded-md"
            />
          )}
        />
      </td>

      {/* Credit */}
      <td className="p-3">
        <Controller
          name={`entries.${index}.credit`}
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="number"
              step="0.01"
              placeholder="0.00"
              disabled={isFieldDisabled(index, "credit")}
              onFocus={() => focusField(index, "credit")}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  handleTabNavigation(index, "credit", e.shiftKey);
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  handleTabNavigation(index, "credit");
                }
              }}
              className="w-full text-right px-3 py-2 border rounded-md"
            />
          )}
        />
      </td>

      {/* Action */}
      <td className="text-center p-3">
        <button
          type="button"
          onClick={() => remove(index)}
          className="text-gray-400 hover:text-red-500"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
};

export default JournalRow;
