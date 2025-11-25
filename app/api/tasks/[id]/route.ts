// app/api/tasks/[id]/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { ObjectId, ReturnDocument } from "mongodb";

type ColumnKey = "pending" | "working" | "completed" | "verified" | "deleted";

interface TaskUpdateBody {
  name?: string;
  description?: string;
  assignedBy?: string;
  assignedTo?: string;
  status?: ColumnKey;
}

// PUT /api/tasks/:id
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = (await request.json()) as TaskUpdateBody;

    const { db } = await connectToDatabase();
    const result = await db
      .collection("tasks")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: body },
        { returnDocument: ReturnDocument.AFTER }
      );

    if (!result.value) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const t = result.value as any;
    return NextResponse.json({
      id: t._id.toString(),
      name: t.name,
      description: t.description,
      assignedBy: t.assignedBy,
      assignedTo: t.assignedTo,
      status: t.status as ColumnKey,
    });
  } catch (err) {
    console.error("PUT /api/tasks/[id] error:", err);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE /api/tasks/:id
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const result = await db
      .collection("tasks")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/tasks/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
