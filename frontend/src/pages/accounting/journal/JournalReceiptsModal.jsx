import { Printer } from "lucide-react";
import Modal from "../../components/common/Modal";
import Button from "../../components/ui/Button";
import PrintWrapper from "../../components/print/PrintWrapper";
import usePrint from "../../hooks/usePrint";
import JournalPrintContent from "./JournalPrintContent";
import JournalSinglePage from "./JournalSinglePage";

export default function JournalReceiptsModal({ isOpen, setIsOpen, data }) {
  const { printRef, print } = usePrint({
    title: "Journal Voucher",
  });

  if (!data) return null;
  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Journal Voucher Details"
      size="5xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            Close
          </Button>

          <Button onClick={print}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      }
    >
      <div className="p-6">
        {/* Hidden Print Area */}
        <div className="hidden">
          <PrintWrapper ref={printRef}>
            <JournalPrintContent data={data} />
          </PrintWrapper>
        </div>

        {/* Preview UI (optional) */}
        <div className="bg-white p-6">
          <JournalSinglePage data={data}/>
        </div>
      </div>
    </Modal>
  );
}
