// journal-entries/components/JournalTable.jsx

import JournalRow from "./JournalRow";

const JournalTable = ({
  fields,
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
  return (
    <div className="border border-gray-200 rounded-lg">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-600 border-b">
            <th className="text-left p-3 w-12">#</th>
            <th className="text-left p-3 min-w-80">General Ledger *</th>
            <th className="text-left p-3 min-w-80">Subsidiary</th>
            <th className="text-right p-3 w-32">Debit</th>
            <th className="text-right p-3 w-32">Credit</th>
            <th className="text-center p-3 w-16">Action</th>
          </tr>
        </thead>

        <tbody>
          {fields.map((field, index) => (
            <JournalRow
              key={field.id}
              field={field}
              index={index}
              entries={entries}
              control={control}
              watch={watch}
              remove={remove}
              currentRowIndex={currentRowIndex}
              isRowComplete={isRowComplete}
              isFieldDisabled={isFieldDisabled}
              focusField={focusField}
              handleTabNavigation={handleTabNavigation}
              getSubsidiaryType={getSubsidiaryType}
              ledgerSubsidieryFields={ledgerSubsidieryFields}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default JournalTable;
