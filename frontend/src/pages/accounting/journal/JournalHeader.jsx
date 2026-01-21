import { Building2, Keyboard, XCircle } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import Card from "../../components/ui/Card";

export default function JournalHeader({ reset }) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  return (
    <>
      <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-6 py-5">
        {/* Left Section */}
        <div className="flex gap-3">
          {/* Icon */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>

          {/* Title & Subtitle */}
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Journal Entry
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <span>Navigate:</span>

              {["Tab", "Ctrl+A", "Ctrl+S", "Ctrl+E"].map((key) => (
                <span
                  key={key}
                  className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-slate-900 shadow-sm">
                  {key}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShortcuts(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <Keyboard className="h-4 w-4" />
            Shortcuts
          </button>

          <button
            onClick={() => reset()}
            className="btn btn-gradient px-4 py-2 text-sm font-medium text-white transition">
            New Entry
          </button>
        </div>
      </div>

      {/* 🔹 Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowShortcuts(false)}>
          <Card
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Keyboard size={20} />
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-gray-500 hover:text-gray-700 p-1">
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              {[
                { key: "Ctrl + E", desc: "Open date picker" },
                {
                  key: "Tab",
                  desc: "Navigate to next field (validates row completion)",
                },
                { key: "Shift + Tab", desc: "Navigate to previous field" },
                {
                  key: "Ctrl + A",
                  desc: "Add new journal line (only if current row complete)",
                },
                { key: "Ctrl + D", desc: "Focus debit field (current row)" },
                { key: "Ctrl + C", desc: "Focus credit field (current row)" },
                { key: "Ctrl + S", desc: "Save journal entry" },
                { key: "Ctrl + K", desc: "Show shortcuts" },
                { key: "↓ ↑", desc: "Navigate date picker (when focused)" },
              ].map((shortcut, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">{shortcut.desc}</span>
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </>
  );
}
