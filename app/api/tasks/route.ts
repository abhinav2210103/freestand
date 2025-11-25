// app/api/tasks/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";

type ColumnKey = "pending" | "working" | "completed" | "verified" | "deleted";

interface Task {
  id: string;
  name: string;
  description: string;
  assignedBy: string;
  assignedTo: string;
  status: ColumnKey;
}

type TaskColumns = Record<ColumnKey, Task[]>;

function groupTasks(tasks: Task[]): TaskColumns {
  const initial: TaskColumns = {
    pending: [],
    working: [],
    completed: [],
    verified: [],
    deleted: [],
  };

  return tasks.reduce((acc, t) => {
    acc[t.status].push(t);
    return acc;
  }, initial);
}

// GET /api/tasks
// GET /api/tasks
export async function GET() {
  try {
    const db = await connectToDatabase();
    const docs = await db.collection("tasks").find().toArray();
    const tasks: Task[] = docs.map((d: any) => ({
      id: d._id.toString(),
      name: d.name,
      description: d.description,
      assignedBy: d.assignedBy,
      assignedTo: d.assignedTo,
      status: d.status as ColumnKey,
    }));

    return NextResponse.json(groupTasks(tasks));
  } catch (err) {
    console.error("GET /api/tasks error:", err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST /api/tasks
// POST /api/tasks
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, description, assignedBy, assignedTo, status } = body;

    if (!name || !description || !assignedBy || !assignedTo || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const db = await connectToDatabase();
    const result = await db.collection("tasks").insertOne({
      name,
      description,
      assignedBy,
      assignedTo,
      status,
    });

    const task: Task = {
      id: result.insertedId.toString(),
      name,
      description,
      assignedBy,
      assignedTo,
      status,
    };

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error("POST /api/tasks error:", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
