import React, { useMemo, useState, useEffect, useRef } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import {
  Plus,
  Trash2,
  Calendar,
  Building2,
  Loader2,
  XCircle,
  CheckCircle,
  Keyboard,
  Save,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { subDays } from "date-fns";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Divider from "../../components/ui/Divider";
import useApi from "../../hooks/useApi";
import { toast } from "sonner";
import PageHeader from "../../components/common/PageHeader";
import { useNavigate } from "react-router-dom";
import Page from "../../components/common/Page";
import SmartSelect from "../../components/common/SmartSelect";
import JournalHeader from "./JournalHeader";
import TotalsSection from "./TotalsSection";

const JournalEntries = () => {
  const { request, loading } = useApi();
  const navigate = useNavigate();

  const dateInputRef = useRef(null);
  const [focusedField, setFocusedField] = useState({ row: 0, field: "date" });

  const formatDateForDisplay = (isoDate) => {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
};

const formatDisplayToISO = (displayDate) => {
  if (!displayDate) return "";
  const [day, month, year] = displayDate.split("-");
  return `${year}-${month}-${day}`;
};


  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [hasAutoFocused, setHasAutoFocused] = useState(false);

  const tableContainerRef = useRef(null);
  const pageBottomRef = useRef(null);

  const ledgerSubsidieryFields = useMemo(() => ["code", "name"], []);
  const { control, handleSubmit, register, reset, watch, setValue } = useForm({
    defaultValues: {
      posting_date: new Date().toISOString().split("T")[0],
      narration: "",
      entries: [
        {
          ledger: null,
          subsidiary: null,
          debit: "",
          credit: "",
          narration: "check",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "entries",
  });

  const entries = watch("entries");
  const totalDebit = entries.reduce((sum, e) => sum + Number(e.debit || 0), 0);
  const totalCredit = entries.reduce(
    (sum, e) => sum + Number(e.credit || 0),
    0
  );
  const balanced = totalDebit === totalCredit && totalDebit > 0;

  // Enhanced Auto-focus with multiple strategies
  useEffect(() => {
    if (hasAutoFocused) return;

    const focusDateField = () => {
      if (!dateInputRef.current) return;

      console.log("Attempting to focus date field...");

      // Multiple focus attempts with different strategies
      const focusStrategies = [
        () => {
          dateInputRef.current.focus();
          dateInputRef.current.select();
        },
        () => {
          // Force focus with a slight delay
          setTimeout(() => {
            dateInputRef.current.focus();
            dateInputRef.current.select();
          }, 100);
        },
        () => {
          // Another attempt with longer delay
          setTimeout(() => {
            dateInputRef.current.focus();
            dateInputRef.current.select();
            // Try to open date picker
            try {
              if (dateInputRef.current.showPicker) {
                dateInputRef.current.showPicker();
                setIsDatePickerOpen(true);
              }
            } catch (error) {
              console.log("Could not open date picker programmatically");
            }
          }, 300);
        },
      ];

      // Execute all focus strategies
      focusStrategies.forEach((strategy, index) => {
        setTimeout(strategy, index * 150);
      });

      setHasAutoFocused(true);
    };

    // Focus immediately if component is ready
    focusDateField();

    // Also focus when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !hasAutoFocused) {
        setTimeout(focusDateField, 200);
      }
    };

    // Handle browser navigation (back/forward)
    const handlePageShow = (event) => {
      if (event.persisted && !hasAutoFocused) {
        setTimeout(focusDateField, 200);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [hasAutoFocused]);

  // Reset auto-focus flag when component unmounts
  useEffect(() => {
    return () => {
      setHasAutoFocused(false);
    };
  }, []);

  // Check if a row is complete
  const isRowComplete = (rowIndex) => {
    const row = entries[rowIndex];
    if (!row?.ledger) return false;

    const subsidiaryType = getSubsidiaryType(row.ledger);
    if (subsidiaryType && !row.subsidiary) return false;

    if (!row.debit && !row.credit) return false;

    return true;
  };

  // Check if current row is the last row and complete
  const canAddNewRow = () => {
    return (
      currentRowIndex === fields.length - 1 && isRowComplete(currentRowIndex)
    );
  };

  // Enhanced Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when user is typing in inputs (except for Tab and Escape)
      if (e.target.tagName === "INPUT" && !["Tab", "Escape"].includes(e.key)) {
        return;
      }

      // Ctrl+E for Date Picker (instead of Ctrl+T which opens new tab)
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        if (dateInputRef.current) {
          dateInputRef.current.focus();
          dateInputRef.current.select();
          try {
            if (dateInputRef.current.showPicker) {
              dateInputRef.current.showPicker();
              setIsDatePickerOpen(true);
            }
          } catch (error) {
            console.log("Date picker cannot be opened programmatically");
          }
          toast.info("Date picker opened. Use arrow keys to select date.");
        }
      }

      // Ctrl/Cmd + D for Debit - applies to current row
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        focusField(currentRowIndex, "debit");
      }

      // Ctrl/Cmd + C for Credit - applies to current row
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        focusField(currentRowIndex, "credit");
      }

      // Ctrl/Cmd + A for Add new line (only if current row is complete)
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        if (canAddNewRow()) {
          handleAddLine();
        } else {
          toast.error("Please complete current row first");
        }
      }

      // Ctrl/Cmd + S for Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (balanced && !loading) {
          handleSubmit(onSubmit)();
        }
      }

      // Ctrl/Cmd + K for Shortcuts help
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }

      // Escape to close date picker
      if (e.key === "Escape" && isDatePickerOpen) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentRowIndex, balanced, loading, isDatePickerOpen, canAddNewRow]);

  // Focus specific field
  const focusField = (rowIndex, fieldName) => {
    setCurrentRowIndex(rowIndex);
    setFocusedField({ row: rowIndex, field: fieldName });

    const row = entries[rowIndex];
    const hasSubsidiaryType = getSubsidiaryType(row.ledger);

    // Block focus to debit/credit if subsidiary is required but not selected
    if (
      (fieldName === "debit" || fieldName === "credit") &&
      hasSubsidiaryType &&
      !row.subsidiary
    ) {
      fieldName = "subsidiary";
    }

    setTimeout(() => {
      let element;

      if (fieldName === "date") {
        element = dateInputRef.current;
        if (element) {
          element.focus();
          element.select();
          try {
            if (element.showPicker) {
              element.showPicker();
              setIsDatePickerOpen(true);
            }
          } catch (error) {
            console.log("Date picker cannot be opened programmatically");
          }
        }
      } else if (fieldName === "ledger" || fieldName === "subsidiary") {
        element = document.querySelector(
          `[data-row="${rowIndex}"] .smart-select-${fieldName} input`
        );
      } else {
        element = document.querySelector(
          `[name="entries.${rowIndex}.${fieldName}"]`
        );
      }

      if (element && !element.disabled) {
        element.focus();
        if (fieldName !== "ledger" && fieldName !== "subsidiary") {
          element.select();
        }
      }
    }, 10);
  };

  // Enhanced Tab navigation that handles disabled fields properly
  const handleTabNavigation = (
    currentRow,
    currentField,
    isShiftTab = false
  ) => {
    const fieldOrder = ["date", "ledger", "subsidiary", "debit", "credit"];
    const row = entries[currentRow];
    const hasSubsidiaryType = row?.ledger && getSubsidiaryType(row.ledger);

    // If subsidiary is required but not selected → force subsidiary focus
    if (
      hasSubsidiaryType &&
      !row.subsidiary &&
      (currentField === "ledger" ||
        currentField === "subsidiary" ||
        currentField === "debit" ||
        currentField === "credit")
    ) {
      focusField(currentRow, "subsidiary");
      return;
    }

    let nextRow = currentRow;
    let nextFieldIndex = fieldOrder.indexOf(currentField);

    if (isShiftTab) {
      // Move backward
      if (nextFieldIndex > 0) {
        nextFieldIndex--;
      } else if (nextRow > 0) {
        nextRow--;
        nextFieldIndex = fieldOrder.length - 1;
      }
    } else {
      // Move forward

      // Special case: debit disabled → skip
      if (currentField === "debit" && isFieldDisabled(currentRow, "credit")) {
        if (currentRow < fields.length - 1) {
          nextRow++;
          nextFieldIndex = 0;
        } else if (isRowComplete(currentRow)) {
          handleAddLine();
          nextRow = fields.length - 1;
          nextFieldIndex = 0;
        } else {
          focusFirstIncompleteField(currentRow);
          return;
        }
      }

      // Special case: credit disabled → skip
      else if (
        currentField === "credit" &&
        isFieldDisabled(currentRow, "debit")
      ) {
        if (currentRow < fields.length - 1) {
          nextRow++;
          nextFieldIndex = 0;
        } else if (isRowComplete(currentRow)) {
          handleAddLine();
          nextRow = fields.length - 1;
          nextFieldIndex = 0;
        } else {
          focusFirstIncompleteField(currentRow);
          return;
        }
      } else {
        // Normal forward navigation
        if (nextFieldIndex < fieldOrder.length - 1) {
          nextFieldIndex++;
        } else if (nextRow < fields.length - 1) {
          nextRow++;
          nextFieldIndex = 0;
        } else {
          if (isRowComplete(currentRow)) {
            handleAddLine();
            nextRow = fields.length - 1;
            nextFieldIndex = 0;
          } else {
            focusFirstIncompleteField(currentRow);
            return;
          }
        }
      }
    }

    const nextField = fieldOrder[nextFieldIndex];

    // Skip disabled fields
    if (isFieldDisabled(nextRow, nextField)) {
      handleTabNavigation(nextRow, nextField, isShiftTab);
      return;
    }

    focusField(nextRow, nextField);
  };

  // Focus on first incomplete field in row
  const focusFirstIncompleteField = (rowIndex) => {
    const row = entries[rowIndex];
    if (!row.ledger) {
      focusField(rowIndex, "ledger");
      return;
    }

    const subsidiaryType = getSubsidiaryType(row.ledger);
    if (subsidiaryType && !row.subsidiary) {
      focusField(rowIndex, "subsidiary");
      return;
    }

    if (!row.debit && !row.credit) {
      focusField(rowIndex, "debit");
      return;
    }
  };

  const scrollToPageBottom = () => {
    if (!pageBottomRef.current) return;

    pageBottomRef.current.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  const handleAddLine = () => {
    append({
      ledger: null,
      subsidiary: null,
      debit: "",
      credit: "",
      narration: "",
    });

    const newRowIndex = fields.length;
    setCurrentRowIndex(newRowIndex);

    requestAnimationFrame(() => {
      scrollToPageBottom();
      focusField(newRowIndex, "ledger");
    });
  };

  const getSubsidiaryType = (ledger) => {
    if (!ledger?.raw) return null;

    const name = ledger.raw.name?.toLowerCase() || "";
    if (name.includes("payable")) return "supplier";
    if (name.includes("receivable")) return "customer";
    if (name.includes("advance to employees")) return "employee";

    return null;
  };

  const onSubmit = async (data) => {
    if (!balanced) {
      toast.error("Debit and Credit must be equal!");
      return;
    }

    const payload = {
      posting_date: data.posting_date,
      narration: "check",
      entries: data.entries
        .filter((e) => e.ledger && (e.debit || e.credit))
        .map((e) => ({
          gl_account_id: e.ledger?.raw.id || null,
          subsidiary_id: e.subsidiary?.raw.id || null,
          debit: Number(e.debit || 0),
          credit: Number(e.credit || 0),
          narration: "check",
        })),
    };

    await request("/journals/", "POST", payload, {
      retries: 2,
      successMessage: "Journal Entry created successfully!",
      errorMessage: "Failed to create Journal Entry.",
      onSuccess: () => {
        reset();
        navigate("/journal/invoices");
      },
    });
  };

  const isFieldDisabled = (rowIndex, fieldType) => {
    const row = entries[rowIndex];
    const hasSubsidiaryType = row.ledger && getSubsidiaryType(row.ledger);

    // Subsidiary field
    if (fieldType === "subsidiary") {
      return !row.ledger || !hasSubsidiaryType;
    }

    // Debit / Credit should be disabled if subsidiary required but not selected
    if (fieldType === "debit" || fieldType === "credit") {
      if (hasSubsidiaryType && !row.subsidiary) {
        return true;
      }
    }

    // Existing logic
    if (fieldType === "debit") {
      return !!row.credit && Number(row.credit) > 0;
    }

    if (fieldType === "credit") {
      return !!row.debit && Number(row.debit) > 0;
    }

    return false;
  };

  useEffect(() => {
    scrollToPageBottom();
  }, [fields.length, totalDebit, totalCredit]);

  return (
    <Page ref={tableContainerRef} title="Journal Entries">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6">
        {/* 🔹 Header */}
        <JournalHeader reset={reset} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Posting Date *
              </label>
              <div className="relative">
                <Controller
                  name="posting_date"
                  control={control}
                  render={({ field }) => (
                    <input
                      ref={dateInputRef}
                      type="date"
                      {...field}
                      required
                      onFocus={() => {
                        focusField(0, "date");
                        setIsDatePickerOpen(true);
                      }}
                      onBlur={() => setIsDatePickerOpen(false)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  )}
                />
              </div>
              {isDatePickerOpen && (
                <div className="text-xs text-blue-600 mt-1">
                  Use arrow keys to select date, Tab or Enter to continue
                </div>
              )}
            </div>
          </div>

          <Divider label="Journal Lines" />

          {/* Journal Entry Table */}
          <div
            ref={tableContainerRef}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="w-12 p-3 text-left font-medium">#</th>
                  <th className="min-w-80 p-3 text-left font-medium">
                    General Ledger <span className="text-red-500">*</span>
                  </th>
                  <th className="min-w-80 p-3 text-left font-medium">
                    Subsidiary
                  </th>
                  <th className="w-32 p-3 text-right font-medium">Debit</th>
                  <th className="w-32 p-3 text-right font-medium">Credit</th>
                  <th className="w-16 p-3 text-center font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {fields.map((field, index) => {
                  const subsidiaryType = watch(
                    `entries.${index}.subsidiary_type`
                  );
                  const isRowFocused = currentRowIndex === index;

                  return (
                    <tr
                      key={field.id}
                      data-row={index}
                      className={`border-b border-slate-100 transition-colors
              hover:bg-slate-50
              ${isRowFocused ? "bg-indigo-50 ring-1 ring-indigo-200" : ""}
              ${
                !isRowComplete(index) && isRowFocused
                  ? "bg-amber-50 ring-1 ring-amber-200"
                  : ""
              }
            `}>
                      {/* Row Index */}
                      <td className="p-3 font-medium text-slate-500">
                        {index + 1}
                        {!isRowComplete(index) && isRowFocused && (
                          <div
                            className="mt-1 h-2 w-2 rounded-full bg-amber-500"
                            title="Incomplete row"
                          />
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
                              onChange={(selected) => {
                                field.onChange(selected);
                                const type = getSubsidiaryType(selected);
                                setValue(
                                  `entries.${index}.subsidiary_type`,
                                  type
                                );
                                setValue(`entries.${index}.subsidiary`, null);
                                setTimeout(() => {
                                  focusField(
                                    index,
                                    type ? "subsidiary" : "debit"
                                  );
                                }, 100);
                              }}
                              onFocus={() => focusField(index, "ledger")}
                              onKeyDown={(e) => {
                                if (e.key === "Tab" || e.key === "Enter") {
                                  e.preventDefault();
                                  handleTabNavigation(
                                    index,
                                    "ledger",
                                    e.shiftKey
                                  );
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
                                onChange={(selected) => {
                                  field.onChange(selected);
                                  setTimeout(() => {
                                    focusField(index, "debit");
                                  }, 100);
                                }}
                                onFocus={() => focusField(index, "subsidiary")}
                                onKeyDown={(e) => {
                                  if (e.key === "Tab" || e.key === "Enter") {
                                    e.preventDefault();
                                    handleTabNavigation(
                                      index,
                                      "subsidiary",
                                      e.shiftKey
                                    );
                                  }
                                }}
                              />
                            )}
                          />
                        ) : (
                          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
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
                                if (e.key === "Tab" || e.key === "Enter") {
                                  e.preventDefault();
                                  handleTabNavigation(
                                    index,
                                    "debit",
                                    e.shiftKey
                                  );
                                }
                              }}
                              className={`w-full rounded-md border px-3 py-2 text-right text-sm transition
                      ${
                        isFieldDisabled(index, "debit")
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                          : "border-slate-300 hover:border-indigo-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      }
                      ${field.value ? "border-emerald-200 bg-emerald-50" : ""}
                    `}
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
                                if (e.key === "Tab" || e.key === "Enter") {
                                  e.preventDefault();
                                  handleTabNavigation(
                                    index,
                                    "credit",
                                    e.shiftKey
                                  );
                                }
                              }}
                              className={`w-full rounded-md border px-3 py-2 text-right text-sm transition
                      ${
                        isFieldDisabled(index, "credit")
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                          : "border-slate-300 hover:border-indigo-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      }
                      ${field.value ? "border-rose-200 bg-rose-50" : ""}
                    `}
                            />
                          )}
                        />
                      </td>

                      {/* Action */}
                      <td className="p-3 text-center">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              remove(index);
                              if (currentRowIndex >= index) {
                                setCurrentRowIndex(
                                  Math.max(0, currentRowIndex - 1)
                                );
                              }
                            }}
                            className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                            title="Delete row">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Row {currentRowIndex + 1} of {fields.length}
                {!isRowComplete(currentRowIndex) && (
                  <span className="ml-2 text-amber-600">
                    • Complete current row to add new line
                  </span>
                )}
              </div>

              <Button
                variant="gradient"
                prefix={<Plus size={16} />}
                onClick={() => {
                  if (canAddNewRow()) {
                    handleAddLine();
                  } else {
                    toast.error("Please complete current row first");
                  }
                }}
                disabled={!canAddNewRow()}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">
                Add Line (Ctrl+A)
              </Button>
            </div>
          </Card>

          <Divider />

          <TotalsSection
            totalDebit={Number(totalDebit)}
            totalCredit={Number(totalCredit)}
            balanced={Number(totalDebit) === Number(totalCredit)}
          />

          <div className="flex flex-col items-end space-y-4">
            <div className="w-80 flex gap-3">
              <Button
                onClick={() => navigate("/dashboard")}
                variant="danger"
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white disabled:opacity-50"
                disabled={!balanced || loading}
                prefix={
                  loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )
                }>
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
            {/* 🔻 VERY BOTTOM OF PAGE */}
            <div ref={pageBottomRef} className="h-1" />
          </div>
        </form>
      </motion.div>
    </Page>
  );
};

export default JournalEntries;
