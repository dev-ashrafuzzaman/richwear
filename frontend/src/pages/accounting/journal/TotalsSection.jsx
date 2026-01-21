import { AlertCircle, CheckCircle2, Scale } from "lucide-react";

const TotalsSection = ({ totalDebit = 0, totalCredit = 0, balanced }) => {
  const debit = Number(totalDebit);
  const credit = Number(totalCredit);
  const difference = Math.abs(debit - credit);
  const hasEntries = debit + credit > 0;

  return (
    <div className="flex justify-end">
      <div className="w-80">
        
        {/* Card */}
        <div className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                <Scale className="h-4 w-4 text-indigo-600" />
              </div>
              <h3 className="text-sm font-semibold tracking-wide text-slate-900">
                Ledger Summary
              </h3>
            </div>

            {/* Status Badge */}
            {hasEntries && (
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                  balanced
                    ? "bg-green-50 text-green-700 ring-green-200"
                    : "bg-amber-50 text-amber-700 ring-amber-200"
                }`}
              >
                {balanced ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Balanced
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3" />
                    Unbalanced
                  </>
                )}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="space-y-3">
            
            {/* Debit */}
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-slate-500">
                Total Debit
              </span>
              <span className="font-semibold text-slate-900">
                {debit.toLocaleString()}{" "}
                <span className="text-xs font-medium text-slate-500">BDT</span>
              </span>
            </div>

            {/* Credit */}
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-slate-500">
                Total Credit
              </span>
              <span className="font-semibold text-slate-900">
                {credit.toLocaleString()}{" "}
                <span className="text-xs font-medium text-slate-500">BDT</span>
              </span>
            </div>

            {/* Divider */}
            <div className="my-3 h-px bg-slate-100" />

            {/* Difference */}
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-slate-500">
                Difference
              </span>
              <span
                className={`font-semibold ${
                  balanced ? "text-slate-400" : "text-red-600"
                }`}
              >
                {balanced ? "—" : difference.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Footer Hint */}
          {!balanced && hasEntries && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              Ensure total debit equals total credit before saving.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TotalsSection;
