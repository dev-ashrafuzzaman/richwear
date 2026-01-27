import Button from "../../../components/ui/Button";

const TransferFooter = ({
  items,
  onSubmit,
}) => {
  const totalQty = items.reduce(
    (sum, i) => sum + i.qty,
    0
  );

  return (
    <div className="flex justify-between items-center mt-4">
      <div className="text-sm text-muted">
        Items: {items.length} | Total Qty:{" "}
        <strong>{totalQty}</strong>
      </div>

      <Button
        size="lg"
        disabled={!items.length}
        onClick={onSubmit}
      >
        Transfer Stock
      </Button>
    </div>
  );
};

export default TransferFooter;
