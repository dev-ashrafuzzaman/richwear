import { useState } from "react";
import { Calendar, Printer } from "lucide-react";
import Page from "../../components/common/Page";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import useAxiosSecure from "../../hooks/useAxiosSecure";

export default function CashFlow() {
  const { axiosSecure } = useAxiosSecure();

  const [from, setFrom] = useState(
    new Date(new Date().getFullYear(), 0, 1)
      .toISOString()
      .split("T")[0]
  );
  const [to, setTo] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [data, setData] = useState(null);

  const loadReport = async () => {
    const res = await axiosSecure.get("/reports/profit-loss/cash-flow", {
      params: { from, to },
    });
    setData(res.data.data);
  };

  return (
    <Page title="Cash Flow Statement">
      <Card className="print:hidden mb-6">
        <div className="flex gap-4 items-end">
          <Input
            type="date"
            label="From"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            prefix={<Calendar size={16} />}
          />
          <Input
            type="date"
            label="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            prefix={<Calendar size={16} />}
          />
          <Button onClick={loadReport}>Generate</Button>
          <Button
            variant="outlined"
            prefix={<Printer size={16} />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </div>
      </Card>

      {data && (
        <div className="a4 bg-white p-8 shadow rounded print:shadow-none">
          <h1 className="text-xl font-bold text-center mb-6">
            Cash Flow Statement
          </h1>

          <Section title="Operating Activities">
            <Row label="Net Profit" value={data.operating.netProfit} />
            <Row
              label="Increase in Accounts Receivable"
              value={-data.operating.adjustments.increaseInReceivable}
            />
            <Row
              label="Increase in Accounts Payable"
              value={data.operating.adjustments.increaseInPayable}
            />

            <TotalRow
              label="Net Cash from Operating Activities"
              value={data.operating.cashFromOperations}
            />
          </Section>

          <div className="border-t pt-4 mt-6 flex justify-between font-bold text-lg">
            <span>Net Increase in Cash</span>
            <span
              className={
                data.netCashFlow >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }
            >
              {data.netCashFlow.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </Page>
  );
}

/* ===== Reusable ===== */

const Section = ({ title, children }) => (
  <div className="mb-6">
    <h2 className="font-semibold border-b mb-2">{title}</h2>
    {children}
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between text-sm py-1">
    <span>{label}</span>
    <span>{value.toFixed(2)}</span>
  </div>
);

const TotalRow = ({ label, value }) => (
  <div className="flex justify-between font-semibold border-t pt-2 mt-2">
    <span>{label}</span>
    <span>{value.toFixed(2)}</span>
  </div>
);
