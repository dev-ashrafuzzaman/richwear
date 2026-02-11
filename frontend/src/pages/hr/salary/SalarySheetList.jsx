import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import Page from "../../../components/common/Page";
import Button from "../../../components/ui/Button";
import { toast } from "sonner";

export default function SalarySheetList() {
  const { axiosSecure } = useAxiosSecure();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSheets = async () => {
    try {
      setLoading(true);
      const res = await axiosSecure.get(
        "/payroll/salary-sheets"
      );
      console.log("respose",res)
      setRows(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load salary sheets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheets();
  }, []);

  return (
    <Page
      title="Salary Sheets"
      subTitle="All generated salary sheets"
    >
      <div className="bg-white p-6 rounded-xl shadow">
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Month</th>
              <th className="p-2 border">Total Net</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="text-center">
                <td className="border p-2">
                  {r.month}
                </td>
                <td className="border p-2">
                  {r.totalNet}
                </td>
                <td className="border p-2">
                  {r.status}
                </td>
                <td className="border p-2">
                  <Link
                    to={`/hr/payroll/salary-sheet/${r._id}`}
                  >
                    <Button size="sm">
                      View Details
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <div className="text-center mt-4">
            Loading...
          </div>
        )}
      </div>
    </Page>
  );
}
