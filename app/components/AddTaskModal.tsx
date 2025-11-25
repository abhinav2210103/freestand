"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type ColumnKey = "pending" | "working" | "completed" | "verified" | "deleted";

interface AddTaskModalProps {
  isOpen: boolean;
  mode: "add" | "edit";
  columnName: ColumnKey;
  initialData?: any;
  onClose: () => void;
  onSubmit: (task: any, newColumn?: ColumnKey) => void;
}

const columnLabels: Record<ColumnKey, string> = {
  pending: "Pending",
  working: "Working",
  completed: "Completed",
  verified: "Verified",
  deleted: "Deleted / Rejected",
};

const columnColors: Record<ColumnKey, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  working: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  verified: "bg-emerald-100 text-emerald-800 border-emerald-200",
  deleted: "bg-red-100 text-red-800 border-red-200",
};

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  mode,
  columnName,
  initialData = null,
  onClose,
  onSubmit,
}) => {
  const { data: session } = useSession();

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [assignedBy, setAssignedBy] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [newColumn, setNewColumn] = useState<ColumnKey>(columnName);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData && mode === "edit") {
      setName(initialData.name || "");
      setDesc(initialData.description || "");
      setAssignedBy(initialData.assignedBy || "");
      setAssignedTo(initialData.assignedTo || "");
      setNewColumn(columnName);
    }

    if (!initialData && mode === "add") {
      setName("");
      setDesc("");
      setAssignedTo("");
      setNewColumn(columnName);

      // For "add" mode, default Assigned By from session
      setAssignedBy((session?.user?.name as string) || "");
    }
  }, [isOpen, initialData, columnName, mode, session]);

  if (!isOpen) return null;

  // Use either stored assignedBy or the current session user
  const assignedByValue =
    assignedBy || ((session?.user?.name as string) ?? "");

  // ✅ all fields required (including assignedByValue)
  const isValid =
    name.trim().length > 0 &&
    desc.trim().length > 0 &&
    assignedByValue.trim().length > 0 &&
    assignedTo.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid) return;

    const data = {
      name,
      description: desc,
      assignedBy: assignedByValue,
      assignedTo,
    };
    onSubmit(data, newColumn);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 transform transition-all duration-200 ease-out scale-100">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === "add" ? "Add Task" : "Edit Task"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 flex items-center gap-2">
              {mode === "add" ? "Creating task in" : "Editing task in"}
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${columnColors[columnName]}`}
              >
                {columnLabels[columnName]}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 text-gray-900">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Task Name<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Implement login screen"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2A66] focus:border-transparent placeholder:text-gray-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Description<span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm min-h-[90px] resize-y focus:outline-none focus:ring-2 focus:ring-[#0A2A66] focus:border-transparent placeholder:text-gray-400"
              placeholder="Add more context, acceptance criteria, links, etc."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Assigned By - auto from NextAuth, non-editable */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Assigned By<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                value={assignedByValue}
                readOnly
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Assigned To<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                placeholder="Owner (e.g. Abhinav)"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2A66] focus:border-transparent placeholder:text-gray-400"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
            </div>
          </div>

          {/* State / Column selector - only while editing */}
          {mode === "edit" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Task State
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(columnLabels) as ColumnKey[]).map((key) => {
                  const isActive = newColumn === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewColumn(key)}
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
                        isActive
                          ? "bg-[#0A2A66] text-white border-[#0A2A66] shadow-sm"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {columnLabels[key]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            className="rounded-lg border cursor-pointer border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`rounded-lg px-4 py-2.5 text-sm cursor-pointer font-medium shadow-sm transition active:scale-[0.99] ${
              isValid
                ? "bg-[#0A2A66] text-white hover:bg-[#0b2f75]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {mode === "add" ? "Add Task" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;
