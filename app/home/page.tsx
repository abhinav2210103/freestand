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
  status: ColumnKey; 
}

type TasksByColumn = Record<ColumnKey, Task[]>;

function Page() {
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [activeColumn, setActiveColumn] = useState<ColumnKey>("pending");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [tasks, setTasks] = useState<TasksByColumn>({
    pending: [],
    working: [],
    completed: [],
    verified: [],
    deleted: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch tasks from API on mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("[FETCH TASKS] Hitting /api/tasks ...");
        const res = await fetch("/api/tasks");

        console.log("[FETCH TASKS] Response received", {
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("[FETCH TASKS] Non-OK response body:", text);
          throw new Error(`Failed to fetch tasks: ${res.status} ${res.statusText}`);
        }

        const data: TasksByColumn = await res.json();
        console.log("[FETCH TASKS] Parsed JSON:", data);

        // 👇 log every task id so we can check if they look like ObjectIds
        (Object.keys(data) as ColumnKey[]).forEach((col) => {
          data[col].forEach((t) => {
            console.log("[FETCH TASKS] Task from API:", {
              column: col,
              id: t.id,
              typeofId: typeof t.id,
              status: t.status,
            });
          });
        }); // 👈

        setTasks(data);
      } catch (err: any) {
        console.error("[FETCH TASKS] Error loading tasks:", err);
        setError(err.message || "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleModalSubmit = (taskInput: any, newColumn?: ColumnKey) => {
    (async () => {
      if (modalMode === "add") {
        const status = activeColumn;

        try {
          console.log("[CREATE TASK] Sending POST /api/tasks with body:", {
            name: taskInput.name,
            description: taskInput.description,
            assignedBy: taskInput.assignedBy,
            assignedTo: taskInput.assignedTo,
            status,
          });

          const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: taskInput.name,
              description: taskInput.description,
              assignedBy: taskInput.assignedBy,
              assignedTo: taskInput.assignedTo,
              status,
            }),
          });

          console.log("[CREATE TASK] Response:", {
            ok: res.ok,
            status: res.status,
            statusText: res.statusText,
          });

          if (!res.ok) {
            const text = await res.text();
            console.error("[CREATE TASK] Non-OK response body:", text);
            throw new Error("Failed to create task");
          }

          const created: any = await res.json();
          console.log("[CREATE TASK] Created task from server:", created);

          const newTask: Task = {
            id: created.id,
            name: created.name,
            description: created.description,
            assignedBy: created.assignedBy,
            assignedTo: created.assignedTo,
            status: created.status as ColumnKey, // 👈 keep status from server
          };

          setTasks((prev) => ({
            ...prev,
            [status]: [...prev[status], newTask],
          }));
        } catch (err) {
          console.error("[CREATE TASK] Error:", err);
        }
      } else if (modalMode === "edit" && editingTaskId) {
        const currentColumn = activeColumn;
        const targetColumn = newColumn || currentColumn;

        // 🔥 extra logs for update
        console.log("[UPDATE TASK] editingTaskId BEFORE fetch:", {
          editingTaskId,
          typeofId: typeof editingTaskId,
        }); // 👈

        const taskFromState = tasks[currentColumn].find(
          (t) => t.id === editingTaskId
        );
        console.log("[UPDATE TASK] Task object from state:", taskFromState); // 👈

        const url = `/api/tasks/${editingTaskId}`;
        console.log("[UPDATE TASK] Request URL:", url); // 👈

        try {
          console.log("[UPDATE TASK] Sending PUT", {
            url,
            body: {
              name: taskInput.name,
              description: taskInput.description,
              assignedBy: taskInput.assignedBy,
              assignedTo: taskInput.assignedTo,
              status: targetColumn,
            },
          });

          const res = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: taskInput.name,
              description: taskInput.description,
              assignedBy: taskInput.assignedBy,
              assignedTo: taskInput.assignedTo,
              status: targetColumn,
            }),
          });

          console.log("[UPDATE TASK] Response:", {
            ok: res.ok,
            status: res.status,
            statusText: res.statusText,
          });

          if (!res.ok) {
            const text = await res.text();
            console.error("[UPDATE TASK] Non-OK response body:", text);
            throw new Error("Failed to update task");
          }

          const updated: any = await res.json();
          console.log("[UPDATE TASK] Updated task from server:", updated);

          const updatedTask: Task = {
            id: updated.id,
            name: updated.name,
            description: updated.description,
            assignedBy: updated.assignedBy,
            assignedTo: updated.assignedTo,
            status: updated.status as ColumnKey, // 👈 make sure we keep status
          };

          setTasks((prev) => {
            const next: TasksByColumn = {
              pending: [],
              working: [],
              completed: [],
              verified: [],
              deleted: [],
            };

            (Object.keys(prev) as ColumnKey[]).forEach((col) => {
              // remove from all columns
              next[col] = prev[col].filter((t) => t.id !== editingTaskId);
            });

            // add into target column
            next[targetColumn] = [...next[targetColumn], updatedTask];

            return next;
          });
        } catch (err) {
          console.error("[UPDATE TASK] Error:", err);
        }
      }

      setOpenModal(false);
      setEditingTaskId(null);
    })();
  };

  const openAddModal = (col: ColumnKey) => {
    console.log("[UI] Open add modal for column:", col);
    setModalMode("add");
    setActiveColumn(col);
    setOpenModal(true);
  };

  const openEditModal = (col: ColumnKey, taskId: string) => {
    console.log("[UI] Open edit modal", { column: col, taskId });
    setModalMode("edit");
    setActiveColumn(col);
    setEditingTaskId(taskId);
    setOpenModal(true);
  };

  const onDragEnd = (result: DropResult) => {
    console.log("[DRAG END] Result:", result);

    const { source, destination } = result;

    if (!destination) {
      console.log("[DRAG END] No destination, aborting.");
      return;
    }

    const sourceCol = source.droppableId as ColumnKey;
    const destCol = destination.droppableId as ColumnKey;

    // nothing changed
    if (sourceCol === destCol && source.index === destination.index) {
      console.log("[DRAG END] Same position, no change.");
      return;
    }

    const movedTask = tasks[sourceCol][source.index];
    if (!movedTask) {
      console.warn("[DRAG END] No movedTask found at source index.", {
        sourceCol,
        sourceIndex: source.index,
      });
      return;
    }

    console.log("[DRAG END] Moving task:", {
      taskId: movedTask.id,
      typeofId: typeof movedTask.id,
      from: sourceCol,
      to: destCol,
      destIndex: destination.index,
    }); // 👈

    setTasks((prev) => {
      const sourceTasks = Array.from(prev[sourceCol]);
      const destTasks =
        sourceCol === destCol ? sourceTasks : Array.from(prev[destCol]);

      const [removed] = sourceTasks.splice(source.index, 1);
      if (!removed) {
        console.warn("[DRAG END] Nothing removed from sourceTasks.");
        return prev;
      }

      if (sourceCol === destCol) {
        // reorder in same column (status stays same)
        destTasks.splice(destination.index, 0, removed);

        return {
          ...prev,
          [sourceCol]: destTasks,
        };
      } else {
        const updatedRemoved: Task = {
          ...removed,
          status: destCol,
        };

        destTasks.splice(destination.index, 0, updatedRemoved);

        return {
          ...prev,
          [sourceCol]: sourceTasks,
          [destCol]: destTasks,
        };
      }
    });

    (async () => {
      try {
        const url = `/api/tasks/${movedTask.id}`;
        console.log("[DRAG END] Persist URL:", url); // 👈

        const res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: destCol }),
        });

        console.log("[DRAG END] Persist response:", {
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("[DRAG END] Persist non-OK body:", text);
        }
      } catch (err) {
        console.error("[DRAG END] Failed to update task status", err);
      }
    })();
  };

  const renderColumn = (title: string, col: ColumnKey) => (
    <Droppable droppableId={col}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`bg-white border rounded-2xl p-5 flex flex-col min-h-[500px] shadow-sm transition-all duration-200 ${
            snapshot.isDraggingOver
              ? "shadow-lg ring-2 ring-[#0A2A66]/40"
              : "hover:shadow-md"
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
              <Draggable key={task.id} draggableId={task.id} index={index}>
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
        {loading && (
          <div className="max-w-7xl mx-auto px-6 pt-10 text-gray-500">
            Loading tasks...
          </div>
        )}
        {error && (
          <div className="max-w-7xl mx-auto px-6 pt-4 text-red-500 text-sm">
            {error}
          </div>
        )}

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
