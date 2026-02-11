import { useEffect, useState, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import { useAuth } from "../../../context/useAuth";
import Page from "../../../components/common/Page";
import Button from "../../../components/ui/Button";
import ReportSmartSelect from "../../../components/common/ReportSmartSelect";

export default function SalarySheetPage() {
  const { axiosSecure } = useAxiosSecure();
  const { user } = useAuth();

  /* =====================================================
     FORM
  ===================================================== */

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
  } = useForm({
    defaultValues: {
      branchId: "",
      month: "",
    },
  });

  const branchValue = watch("branchId");
  const month = watch("month");

  /* =====================================================
     STATE
  ===================================================== */

  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(false);

  /* =====================================================
     NORMALIZE BRANCH ID
     (Object or String → Always String)
  ===================================================== */

  const resolvedBranchId =
    typeof branchValue === "string"
      ? branchValue
      : branchValue?._id;

  const isBranchFixed = !!user?.branchId;

  /* =====================================================
     AUTO SET BRANCH (Manager)
  ===================================================== */

  useEffect(() => {
    if (isBranchFixed) {
      setValue("branchId", user.branchId); // string id
    }
  }, [user]);

  /* =====================================================
     FETCH EMPLOYEES (After Branch Select)
  ===================================================== */

  useEffect(() => {
    if (!resolvedBranchId) {
      setEmployees([]);
      return;
    }

    const fetchEmployees = async () => {
      try {
        const res = await axiosSecure.get(
          `/employees?status=active&branchId=${resolvedBranchId}`
        );
        setEmployees(res.data.data || []);
      } catch (err) {
        toast.error("Failed to load employees");
      }
    };

    fetchEmployees();
  }, [resolvedBranchId]);

  /* =====================================================
     HANDLE CHECKBOX
  ===================================================== */

  const toggleSelect = (emp) => {
    setSelected((prev) => {
      if (prev[emp._id]) {
        const copy = { ...prev };
        delete copy[emp._id];
        return copy;
      }

      return {
        ...prev,
        [emp._id]: {
          employeeId: emp._id,
          bonus: 0,
          deduction: 0,
        },
      };
    });
  };

  /* =====================================================
     UPDATE BONUS / DEDUCTION
  ===================================================== */

  const updateField = (id, field, value) => {
    setSelected((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: Number(value),
      },
    }));
  };

  /* =====================================================
     TOTAL CALCULATION
  ===================================================== */

  const totalNet = useMemo(() => {
    return employees.reduce((sum, emp) => {
      if (!selected[emp._id]) return sum;

      const base = emp.payroll?.baseSalary || 0;
      const bonus = selected[emp._id]?.bonus || 0;
      const deduction = selected[emp._id]?.deduction || 0;

      return sum + (base + bonus - deduction);
    }, 0);
  }, [selected, employees]);

  /* =====================================================
     SUBMIT
  ===================================================== */

  const onSubmit = async () => {
    if (!resolvedBranchId) {
      toast.error("Select branch");
      return;
    }

    if (!month) {
      toast.error("Select month");
      return;
    }

    const selectedEmployees = Object.values(selected);

    if (selectedEmployees.length === 0) {
      toast.error("Select at least one employee");
      return;
    }

    try {
      setLoading(true);

      await axiosSecure.post("/payroll/salary-sheets", {
        branchId: resolvedBranchId, // always string id
        month,
        employees: selectedEmployees,
      });

      toast.success("Salary sheet created successfully");
      setSelected({});
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <Page
      title="Salary Sheet"
      subTitle="Generate monthly salary sheet"
    >
      <div className="bg-white p-6 rounded-xl shadow space-y-6">

        {/* Branch Select (Only if user has no fixed branch) */}
        {!isBranchFixed && (
          <Controller
            name="branchId"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Select Branch
                </label>
                <ReportSmartSelect
                  route="/branches"
                  displayField={["name", "code"]}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select Branch"
                />
              </div>
            )}
          />
        )}

        {/* Month Picker */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Select Month
          </label>
          <input
            type="month"
            {...register("month")}
            className="border rounded px-3 py-2 w-64"
          />
        </div>

        {/* Employee Table */}
        {resolvedBranchId && (
          <>
            <div className="overflow-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Select</th>
                    <th className="p-2 border">Employee</th>
                    <th className="p-2 border">Role</th>
                    <th className="p-2 border">Base Salary</th>
                    <th className="p-2 border">Bonus</th>
                    <th className="p-2 border">Deduction</th>
                    <th className="p-2 border">Net</th>
                  </tr>
                </thead>

                <tbody>
                  {employees.map((emp) => {
                    const isChecked = !!selected[emp._id];
                    const base =
                      emp.payroll?.baseSalary || 0;
                    const bonus =
                      selected[emp._id]?.bonus || 0;
                    const deduction =
                      selected[emp._id]?.deduction || 0;
                    const net =
                      base + bonus - deduction;

                    return (
                      <tr key={emp._id} className="text-center">
                        <td className="border p-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              toggleSelect(emp)
                            }
                          />
                        </td>

                        <td className="border p-2 text-left">
                          {emp.name}
                        </td>

                        <td className="border p-2">
                          {emp.role}
                        </td>

                        <td className="border p-2">
                          {base}
                        </td>

                        <td className="border p-2">
                          {isChecked && (
                            <input
                              type="number"
                              onWheel={(e) =>
                                e.currentTarget.blur()
                              }
                              value={bonus}
                              onChange={(e) =>
                                updateField(
                                  emp._id,
                                  "bonus",
                                  e.target.value
                                )
                              }
                              className="border px-2 py-1 w-24"
                            />
                          )}
                        </td>

                        <td className="border p-2">
                          {isChecked && (
                            <input
                              type="number"
                              onWheel={(e) =>
                                e.currentTarget.blur()
                              }
                              value={deduction}
                              onChange={(e) =>
                                updateField(
                                  emp._id,
                                  "deduction",
                                  e.target.value
                                )
                              }
                              className="border px-2 py-1 w-24"
                            />
                          )}
                        </td>

                        <td className="border p-2 font-semibold">
                          {isChecked ? net : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center">
              <div className="text-lg font-bold">
                Total Net: {totalNet}
              </div>

              <Button
                variant="gradient"
                onClick={handleSubmit(onSubmit)}
                disabled={loading}
              >
                {loading
                  ? "Processing..."
                  : "Create Salary Sheet"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Page>
  );
}
