import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import type { ScheduledPost } from "@/lib/scheduler";

// ─── In-memory store for server side (complement to client localStorage) ──────
const serverSchedule = new Map<string, ScheduledPost>();

export function GET(): NextResponse {
  return NextResponse.json(Array.from(serverSchedule.values()));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as Omit<
    ScheduledPost,
    "id" | "status" | "createdAt"
  >;
  const post: ScheduledPost = {
    ...body,
    id: uuidv4(),
    status: "pending",
    createdAt: Date.now(),
  };
  serverSchedule.set(post.id, post);
  return NextResponse.json(post);
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) serverSchedule.delete(id);
  return NextResponse.json({ ok: true });
}
