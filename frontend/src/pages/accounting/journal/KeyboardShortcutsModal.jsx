// journal-entries/components/KeyboardShortcutsModal.jsx

import { motion } from "framer-motion";
import { Keyboard, XCircle } from "lucide-react";
import Card from "../../components/ui/Card";

const KeyboardShortcutsModal = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Keyboard size={20} />
            Keyboard Shortcuts
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <XCircle size={20} />
          </button>
        </div>

        <div className="space-y-2 text-sm">
          {[
            { key: "Ctrl + E", desc: "Open date picker" },
            { key: "Tab", desc: "Navigate to next field" },
            { key: "Shift + Tab", desc: "Navigate to previous field" },
            { key: "Ctrl + A", desc: "Add new journal line" },
            { key: "Ctrl + D", desc: "Focus debit field" },
            { key: "Ctrl + C", desc: "Focus credit field" },
            { key: "Ctrl + S", desc: "Save journal entry" },
            { key: "Ctrl + K", desc: "Show shortcuts" },
            { key: "↑ ↓", desc: "Navigate date picker" },
          ].map((shortcut, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-2 border-b"
            >
              <span className="text-gray-600">{shortcut.desc}</span>
              <kbd className="px-2 py-1 bg-gray-100 border rounded text-xs font-mono">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};

export default KeyboardShortcutsModal;
