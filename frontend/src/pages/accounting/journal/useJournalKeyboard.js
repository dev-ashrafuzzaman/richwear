// journal-entries/hooks/useJournalKeyboard.js

import { useEffect } from "react";

const useJournalKeyboard = ({
  currentRowIndex,
  balanced,
  loading,
  isDatePickerOpen,
  canAddNewRow,
  focusField,
  handleAddLine,
  handleSubmit,
  onSubmit,
  setShowShortcuts,
  setIsDatePickerOpen,
  dateInputRef,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === "INPUT" &&
        !["Tab", "Escape"].includes(e.key)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        if (dateInputRef.current) {
          dateInputRef.current.focus();
          dateInputRef.current.select();
          try {
            dateInputRef.current.showPicker?.();
            setIsDatePickerOpen(true);
          } catch {}
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        focusField(currentRowIndex, "debit");
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        focusField(currentRowIndex, "credit");
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        canAddNewRow()
          ? handleAddLine()
          : null;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (balanced && !loading) {
          handleSubmit(onSubmit)();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowShortcuts((v) => !v);
      }

      if (e.key === "Escape" && isDatePickerOpen) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    currentRowIndex,
    balanced,
    loading,
    isDatePickerOpen,
    canAddNewRow,
  ]);
};

export default useJournalKeyboard;
