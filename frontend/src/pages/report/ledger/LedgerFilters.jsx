import { Controller } from "react-hook-form";
import { Calendar, Filter, TrendingUp } from "lucide-react";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SmartSelect from "../../../components/common/SmartSelect";

const LedgerFilters = ({
  control,
  handleSubmit,
  onSubmit,
  loading,
  reset,
  watch,
  shouldShowSubsidiary,
  subsidiaryType,
  getSubsidiaryRoute,
  getSubsidiaryPlaceholder,
  navigate,
}) => {
  return (
    <Card className="sticky top-6 z-40 shadow-sm print:hidden mb-10 border-l-4 border-l-blue-500">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Report Filters</h2>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`grid gap-5 ${
          shouldShowSubsidiary ? "md:grid-cols-4" : "md:grid-cols-3"
        }`}>
        {/* GL Account */}
        <Controller
          name="glAccount"
          control={control}
          render={({ field }) => (
            <SmartSelect
              customRoute="/general-ledgers/"
              useApi
              displayField={["gl_code", "name"]}
              searchFields={["gl_code", "name"]}
              placeholder="Select General Ledger..."
              onChange={(val) => {
                field.onChange(val);
                reset({ ...watch(), subsidiary: null });
              }}
            />
          )}
        />

        {/* Subsidiary */}
        {shouldShowSubsidiary && (
          <Controller
            name="subsidiary"
            control={control}
            render={({ field }) => (
              <SmartSelect
                customRoute={getSubsidiaryRoute()}
                useApi
                displayField={["code", "name"]}
                searchFields={["code", "name"]}
                placeholder={getSubsidiaryPlaceholder()}
                onChange={field.onChange}
              />
            )}
          />
        )}

        {/* Dates */}
        {["startDate", "endDate"].map((name) => (
          <Controller
            key={name}
            name={name}
            control={control}
            render={({ field }) => (
              <Input type="date" prefix={<Calendar size={16} />} {...field} />
            )}
          />
        ))}

        {/* Actions */}
        <div
          className={`${
            shouldShowSubsidiary ? "col-span-4" : "col-span-3"
          } flex justify-end gap-3 pt-2 border-t`}>
          <Button variant="gradient" type="submit" disabled={loading}>
            <TrendingUp size={16} />
            Generate
          </Button>
          <Button variant="outlined" type="button" onClick={() => reset()}>
            Reset
          </Button>
          <Button
            variant="outlined"
            type="button"
            onClick={() => navigate("/journal/entries")}>
            Close
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default LedgerFilters;
