// journal-entries/hooks/useJournalFocus.js

import { useEffect } from "react";

const useJournalFocus = ({
  dateInputRef,
  hasAutoFocused,
  setHasAutoFocused,
  setIsDatePickerOpen,
}) => {
  useEffect(() => {
    if (hasAutoFocused) return;

    const focusDateField = () => {
      if (!dateInputRef.current) return;

      const strategies = [
        () => {
          dateInputRef.current.focus();
          dateInputRef.current.select();
        },
        () => {
          setTimeout(() => {
            dateInputRef.current.focus();
            dateInputRef.current.select();
          }, 100);
        },
        () => {
          setTimeout(() => {
            dateInputRef.current.focus();
            dateInputRef.current.select();
            try {
              dateInputRef.current.showPicker?.();
              setIsDatePickerOpen(true);
            } catch {}
          }, 300);
        },
      ];

      strategies.forEach((fn, i) => setTimeout(fn, i * 150));
      setHasAutoFocused(true);
    };

    focusDateField();

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !hasAutoFocused) {
        setTimeout(focusDateField, 200);
      }
    };

    const handlePageShow = (e) => {
      if (e.persisted && !hasAutoFocused) {
        setTimeout(focusDateField, 200);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [hasAutoFocused]);
};

export default useJournalFocus;
