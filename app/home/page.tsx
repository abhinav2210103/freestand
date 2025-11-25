"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import AddTaskModal from "../components/AddTaskModal";
import { PencilIcon } from "@heroicons/react/24/outline";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

type ColumnKey = "pending" | "working" | "completed" | "verified" | "deleted";

interface Task {
  id: string;
  name: string;
  description: string;
  assignedBy: string;
  assignedTo: string;
}

function Page() {
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [activeColumn, setActiveColumn] = useState<ColumnKey>("pending");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Record<ColumnKey, Task[]>>({
    pending: [],
    working: [],
    completed: [],
    verified: [],
    deleted: [],
  });

  const generateId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("tasks");
    if (saved) {
      const parsed = JSON.parse(saved);

      const addIds = (list: any[] = []): Task[] =>
        list.map((t) => ({
          id: t.id || generateId(),
          name: t.name,
          description: t.description,
          assignedBy: t.assignedBy,
          assignedTo: t.assignedTo,
        }));

      setTasks({
        pending: addIds(parsed.pending || []),
        working: addIds(parsed.working || []),
        completed: addIds(parsed.completed || []),
        verified: addIds(parsed.verified || []),
        deleted: addIds(parsed.deleted || []),
      });
    }
  }, []);

  // Save on change
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const handleModalSubmit = (taskInput: any, newColumn?: ColumnKey) => {
    if (modalMode === "add") {
      const newTask: Task = {
        id: generateId(),
        name: taskInput.name,
        description: taskInput.description,
        assignedBy: taskInput.assignedBy,
        assignedTo: taskInput.assignedTo,
      };

      setTasks((prev) => ({
        ...prev,
        [activeColumn]: [...prev[activeColumn], newTask],
      }));
    } else if (modalMode === "edit" && editingTaskId) {
      setTasks((prev) => {
        const currentColumn = activeColumn;
        const targetColumn = newColumn || currentColumn;

        const updated = { ...prev };

        if (currentColumn === targetColumn) {
          updated[currentColumn] = prev[currentColumn].map((t) =>
            t.id === editingTaskId
              ? {
                  ...t,
                  name: taskInput.name,
                  description: taskInput.description,
                  assignedBy: taskInput.assignedBy,
                  assignedTo: taskInput.assignedTo,
                }
              : t
          );
        } else {
          updated[currentColumn] = prev[currentColumn].filter(
            (t) => t.id !== editingTaskId
          );

          const movedTask: Task = {
            id: editingTaskId,
            name: taskInput.name,
            description: taskInput.description,
            assignedBy: taskInput.assignedBy,
            assignedTo: taskInput.assignedTo,
          };

          updated[targetColumn] = [...prev[targetColumn], movedTask];
        }

        return updated;
      });
    }

    setOpenModal(false);
    setEditingTaskId(null);
  };

  const openAddModal = (col: ColumnKey) => {
    setModalMode("add");
    setActiveColumn(col);
    setOpenModal(true);
  };

  const openEditModal = (col: ColumnKey, taskId: string) => {
    setModalMode("edit");
    setActiveColumn(col);
    setEditingTaskId(taskId);
    setOpenModal(true);
  };

  // 🔥 DRAG LOGIC HERE
  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    const sourceCol = source.droppableId as ColumnKey;
    const destCol = destination.droppableId as ColumnKey;

    // nothing changed
    if (
      sourceCol === destCol &&
      source.index === destination.index
    ) {
      return;
    }

    setTasks((prev) => {
      const sourceTasks = Array.from(prev[sourceCol]);
      const destTasks =
        sourceCol === destCol
          ? sourceTasks
          : Array.from(prev[destCol]);

      // remove from source
      const [moved] = sourceTasks.splice(source.index, 1);

      if (sourceCol === destCol) {
        // reorder in same column
        destTasks.splice(destination.index, 0, moved);

        return {
          ...prev,
          [sourceCol]: destTasks,
        };
      } else {
        // move to another column
        destTasks.splice(destination.index, 0, moved);

        return {
          ...prev,
          [sourceCol]: sourceTasks,
          [destCol]: destTasks,
        };
      }
    });
  };

  const renderColumn = (title: string, col: ColumnKey) => (
    <Droppable droppableId={col}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`bg-white border rounded-2xl p-5 flex flex-col min-h-[500px] shadow-sm transition-all duration-200 ${
            snapshot.isDraggingOver ? "shadow-lg ring-2 ring-[#0A2A66]/40" : "hover:shadow-md"
          }`}
        >
          <h2 className="text-lg font-bold text-[#0A2A66] mb-4 tracking-wide uppercase">
            {title}
          </h2>

          <div className="flex-grow space-y-3 text-gray-700 overflow-y-auto">
            {tasks[col].length === 0 && (
              <p className="text-gray-400 text-sm italic py-10 text-center">
                No tasks available…
              </p>
            )}

            {tasks[col].map((task, index) => (
              <Draggable
                key={task.id}
                draggableId={task.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`border rounded-lg p-3 bg-white shadow-sm flex flex-col gap-1 relative group transition-transform ${
                      snapshot.isDragging
                        ? "scale-[1.02] shadow-lg ring-1 ring-[#0A2A66]/40"
                        : "hover:shadow"
                    }`}
                  >
                    <p className="font-semibold text-[#0A2A66] text-[15px]">
                      {task.name}
                    </p>
                    <p className="text-sm leading-relaxed line-clamp-2">
                      {task.description}
                    </p>

                    <div className="text-xs text-gray-500 pt-1">
                      <p>Assigned by: {task.assignedBy}</p>
                      <p>Assigned to: {task.assignedTo}</p>
                    </div>

                    <button
                      className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition"
                      onClick={() => openEditModal(col, task.id)}
                    >
                      <PencilIcon className="h-4 w-4 text-[#0A2A66]" />
                    </button>
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}
          </div>

          <div className="pt-4">
            <button
              onClick={() => openAddModal(col)}
              className="w-full rounded-lg bg-[#0A2A66] cursor-pointer hover:bg-[#0B3077] active:scale-[0.98] text-white py-2.5 text-sm font-medium shadow"
            >
              + Add Task
            </button>
          </div>
        </div>
      )}
    </Droppable>
  );

  const editingTask =
    modalMode === "edit" && editingTaskId
      ? tasks[activeColumn].find((t) => t.id === editingTaskId)
      : undefined;

  return (
    <>
      <Navbar deletedTasks={tasks.deleted} />

      <div className="bg-gray-50 min-h-screen pb-10">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-4 gap-6">
            {renderColumn("Pending", "pending")}
            {renderColumn("Working", "working")}
            {renderColumn("Completed", "completed")}
            {renderColumn("Verified", "verified")}
          </div>
        </DragDropContext>
      </div>

      <AddTaskModal
        isOpen={openModal}
        mode={modalMode}
        columnName={activeColumn}
        initialData={editingTask}
        onClose={() => setOpenModal(false)}
        onSubmit={handleModalSubmit}
      />
    </>
  );
}

export default Page;
