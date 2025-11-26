// app/api/tasks/[id]/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

type ColumnKey = "pending" | "working" | "completed" | "verified" | "deleted";

interface Task {
  id: string;
  name: string;
  description: string;
  assignedBy: string;
  assignedTo: string;
  status: ColumnKey;
}

// In Next.js 15, params can be async, so we type it as Promise and await it.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // 👈 note Promise here
) {
  const { id } = await params; // 👈 await params
  console.log("[PUT /api/tasks/:id] Called with id:", id);

  if (!ObjectId.isValid(id)) {
    console.warn("[PUT /api/tasks/:id] Invalid ObjectId:", id);
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    console.log("[PUT /api/tasks/:id] Parsed body:", body);

    const { db } = await connectToDatabase();
    console.log("[PUT /api/tasks/:id] Connecting to DB...");

    const filter = { _id: new ObjectId(id) }; // 👈 use only _id
    console.log("[PUT /api/tasks/:id] Using filter:", filter);

    console.log("[PUT /api/tasks/:id] Running findOneAndUpdate...");
    const result = await db.collection("tasks").findOneAndUpdate(
      filter,
      { $set: body }, // body can be { status: "working" } from drag
      { returnDocument: "after" }
    );

    // result can be null, so log safely and guard before accessing .value
    console.log("[PUT /api/tasks/:id] findOneAndUpdate result:", {
      value: result ? result.value : null,
    });

    if (!result || !result.value) {
      console.warn("[PUT /api/tasks/:id] Task not found for id:", id);
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const t = result.value as any;

    const task: Task = {
      id: t._id.toString(),
      name: t.name,
      description: t.description,
      assignedBy: t.assignedBy,
      assignedTo: t.assignedTo,
      status: (t.status || "pending") as ColumnKey,
    };

    return NextResponse.json(task);
  } catch (err) {
    console.error("[PUT /api/tasks/:id] Error:", err);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}
