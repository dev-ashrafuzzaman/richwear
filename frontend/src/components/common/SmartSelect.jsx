import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";
import AsyncSelect from "react-select/async";
import debounce from "lodash.debounce";
import { toast } from "sonner";
import useAxiosSecure from "../../hooks/useAxiosSecure";

/**
 * SmartSelect – POS & ERP Grade
 * --------------------------------
 * ✔ Async pagination
 * ✔ Infinite scroll
 * ✔ Barcode scan support
 * ✔ Request cache
 * ✔ ESLint clean
 */
const SmartSelect = forwardRef(
  (
    {
      customRoute,
      value,
      onChange,
      placeholder = "Search...",
      displayField = ["name"],
      idField = "_id",
      pageSize = 20,
      disabled = false,
      extraParams = {},        // additional query params
      barcode = false,         // enable barcode scan
      minBarcodeLength = 6,
    },
    ref
  ) => {
    const { axiosSecure } = useAxiosSecure();

    /* -------------------- State -------------------- */
    const [options, setOptions] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    /* -------------------- Refs -------------------- */
    const cacheRef = useRef(new Map());
    const barcodeTimer = useRef(null);

    /* -------------------- Helpers -------------------- */
    const getLabel = useCallback(
      (item) =>
        Array.isArray(displayField)
          ? displayField
              .map((f) => item?.[f])
              .filter(Boolean)
              .join(" — ")
          : item?.[displayField],
      [displayField]
    );

    const toOption = useCallback(
      (item) => ({
        value: item[idField],
        label: getLabel(item),
        raw: item,
      }),
      [idField, getLabel]
    );

    /* -------------------- API Fetch -------------------- */
    const fetchOptions = useCallback(
      async (search = "", pageNo = 1) => {
        const cacheKey = JSON.stringify({
          route: customRoute,
          search,
          pageNo,
          extraParams,
        });

        if (cacheRef.current.has(cacheKey)) {
          return cacheRef.current.get(cacheKey);
        }

        setLoading(true);
        try {
          const res = await axiosSecure.get(customRoute, {
            params: {
              search,
              page: pageNo,
              limit: pageSize,
              ...extraParams,
            },
          });
          const rows = res.data?.data || [];
          const mapped = rows.map(toOption);

          cacheRef.current.set(cacheKey, mapped);
          setHasMore(Boolean(res.data?.pagination?.hasMore));

          return mapped;
        } catch {
          toast.error("Failed to load data");
          return [];
        } finally {
          setLoading(false);
        }
      },
      [axiosSecure, customRoute, pageSize, extraParams, toOption]
    );

    /* -------------------- Load Options (Debounced) -------------------- */
    const loadOptions = useMemo(() => {
      const fn = debounce(async (input, callback) => {
        setPage(1);
        const data = await fetchOptions(input, 1);
        setOptions(data);
        callback(data);
      }, 300);

      return fn;
    }, [fetchOptions]);

    /* Cleanup debounce */
    useEffect(() => {
      return () => loadOptions.cancel();
    }, [loadOptions]);

    /* -------------------- Infinite Scroll -------------------- */
    const handleMenuScrollToBottom = useCallback(async () => {
      if (!hasMore || loading) return;

      const nextPage = page + 1;
      const more = await fetchOptions(inputValue, nextPage);

      setOptions((prev) => [...prev, ...more]);
      setPage(nextPage);
    }, [hasMore, loading, page, inputValue, fetchOptions]);

    /* -------------------- Barcode Select -------------------- */
    const handleBarcodeSelect = useCallback(
      async (value) => {
        const data = await fetchOptions(value, 1);

        if (data.length > 0) {
          onChange(data[0]);
          setInputValue("");
        } else {
          toast.error("Item not found");
        }
      },
      [fetchOptions, onChange]
    );

    /* -------------------- Barcode Detection -------------------- */
    useEffect(() => {
      if (!barcode || !inputValue) return;

      if (barcodeTimer.current) {
        clearTimeout(barcodeTimer.current);
      }

      barcodeTimer.current = setTimeout(() => {
        if (inputValue.length >= minBarcodeLength) {
          handleBarcodeSelect(inputValue);
        }
      }, 60);

      return () => {
        if (barcodeTimer.current) {
          clearTimeout(barcodeTimer.current);
        }
      };
    }, [
      inputValue,
      barcode,
      minBarcodeLength,
      handleBarcodeSelect,
    ]);

    /* -------------------- Render -------------------- */
    return (
      <AsyncSelect
        ref={ref}
        cacheOptions={false}
        defaultOptions={options}
        loadOptions={loadOptions}
        onMenuScrollToBottom={handleMenuScrollToBottom}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isDisabled={disabled}
        isLoading={loading}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        inputValue={inputValue}
        onInputChange={(val, meta) => {
          if (meta.action === "input-change") setInputValue(val);
          if (meta.action === "menu-close") setInputValue("");
        }}
        styles={{
          control: (base) => ({
            ...base,
            minHeight: 40,
            borderRadius: 8,
            fontSize: 14,
          }),
          menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
          }),
        }}
      />
    );
  }
);

export default React.memo(SmartSelect);
