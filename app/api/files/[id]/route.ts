import { NextRequest, NextResponse } from "next/server";
import { liveblocks } from "@/lib/liveblocks-server";

// DELETE /api/files/[id] — delete a file (room) and its Yjs document
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await liveblocks.deleteRoom(id);

  return NextResponse.json({ deleted: true });
}
