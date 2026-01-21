import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
  forwardRef,
} from "react";
import AsyncSelect from "react-select/async";
import Fuse from "fuse.js";
import debounce from "lodash.debounce";
import { toast } from "sonner";
import useAxiosSecure from "../../hooks/useAxiosSecure";

const SmartSelect = forwardRef(
  (
    {
      customRoute = "",
      mockData = [],
      useApi = false,
      value,
      onChange,
      multiSelect = false,
      displayField = "label",
      searchFields = ["label"],
      disabled = false,
      placeholder = "Search...",
      idField = "id",
      pageSize = 20,
      type = "",
    },
    ref
  ) => {
    const { axiosSecure } = useAxiosSecure();
    const cacheRef = useRef(new Map());

    const [allOptions, setAllOptions] = useState([]);
    const [options, setOptions] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    /* --------------------------------
     * Display Label
     * -------------------------------- */
    const getDisplayText = useCallback(
      (item) => {
        if (!item) return "";
        if (Array.isArray(displayField)) {
          return displayField
            .map((f) => item[f])
            .filter(Boolean)
            .join(" — ");
        }
        return item[displayField] ?? item.label ?? "";
      },
      [displayField]
    );

    const toOption = useCallback(
      (item) => ({
        value: item[idField],
        label: getDisplayText(item),
        raw: item,
      }),
      [idField, getDisplayText]
    );

    /* --------------------------------
     * API Fetch (Cached)
     * -------------------------------- */
    const fetchOptions = useCallback(
      async (search = "") => {
        const key = `${customRoute}_${search}_${type}`;
        if (cacheRef.current.has(key)) return cacheRef.current.get(key);

        setLoading(true);
        try {
          const res = await axiosSecure.get(customRoute, {
            params: { search, type },
          });
          const data = res.data?.data || [];
          const mapped = data.map(toOption);
          cacheRef.current.set(key, mapped);
          setHasMore(data.length === pageSize);
          return mapped;
        } catch {
          toast.error("Failed to load options");
          return [];
        } finally {
          setLoading(false);
        }
      },
      [axiosSecure, customRoute, pageSize, toOption, type]
    );

    /* --------------------------------
     * Debounced Local Search (Fuse.js)
     * -------------------------------- */
    const debouncedLoad = useMemo(
      () =>
        debounce((input, callback) => {
          const fuse = new Fuse(
            allOptions.map((o) => o.raw || o),
            { keys: searchFields, threshold: 0.35 }
          );

          const results = input
            ? fuse.search(input).map((r) => r.item)
            : allOptions.map((o) => o.raw || o);

          callback(results.map(toOption));
        }, 250),
      [allOptions, searchFields, toOption]
    );

    /* --------------------------------
     * Infinite Scroll
     * -------------------------------- */
    const handleMenuScrollToBottom = async () => {
      if (!useApi || !hasMore || loading) return;
      const next = page + 1;
      const nextData = await fetchOptions(inputValue);
      setAllOptions((prev) => [...prev, ...nextData]);
      setOptions((prev) => [...prev, ...nextData]);
      setPage(next);
    };

    /* --------------------------------
     * Prefetch
     * -------------------------------- */
    useEffect(() => {
      (async () => {
        if (useApi) {
          const data = await fetchOptions("");
          setAllOptions(data);
          setOptions(data);
        } else {
          const local = mockData.map(toOption);
          setAllOptions(local);
          setOptions(local);
        }
      })();
    }, [useApi, mockData, fetchOptions, toOption]);

    return (
      <AsyncSelect
        ref={ref}
        cacheOptions
        defaultOptions={options}
        loadOptions={(input, cb) => debouncedLoad(input, cb)}
        onMenuScrollToBottom={handleMenuScrollToBottom}
        isMulti={multiSelect}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isDisabled={disabled}
        isLoading={loading}

        /* 🔥 IMPORTANT FIX 🔥 */
        menuPortalTarget={document.body}
        menuPosition="fixed"

        inputValue={inputValue}
        onInputChange={(val, { action }) => {
          if (action === "input-change") setInputValue(val);
          if (action === "menu-close") setInputValue("");
        }}

        styles={{
          control: (base, state) => ({
            ...base,
            minHeight: 38,
            borderRadius: 8,
            borderColor: state.isFocused ? "#0866ff" : "#CBD5E1",
            boxShadow: "none",
            "&:hover": { borderColor: "#0866ff" },
            backgroundColor: disabled ? "#F1F5F9" : "#FFFFFF",
            fontSize: "14px",
          }),

          menuPortal: (base) => ({
            ...base,
            zIndex: 9999, // 🚀 highest priority
          }),

          menu: (base) => ({
            ...base,
            borderRadius: 10,
            overflow: "hidden",
            boxShadow:
              "0 10px 25px rgba(15,23,42,0.08), 0 4px 10px rgba(15,23,42,0.06)",
          }),

          option: (base, state) => ({
            ...base,
            fontSize: "14px",
            padding: "10px 12px",
            backgroundColor: state.isFocused
              ? "#EEF2FF"
              : state.isSelected
              ? "#E0E7FF"
              : "#FFFFFF",
            color: "#0F172A",
          }),

          placeholder: (base) => ({
            ...base,
            color: "#94A3B8",
          }),
        }}
      />
    );
  }
);

export default React.memo(SmartSelect);
