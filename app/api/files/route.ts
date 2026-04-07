import { NextRequest, NextResponse } from "next/server";
import { liveblocks } from "@/lib/liveblocks-server";

// GET /api/files — list all files (rooms)
export async function GET() {
  const { data: rooms } = await liveblocks.getRooms();

  const files = rooms.map((room) => ({
    id: room.id,
    name: room.metadata?.name ?? "untitled.py",
    lastConnectionAt: room.lastConnectionAt,
    createdAt: room.createdAt,
  }));

  // Sort by most recently active
  files.sort((a, b) => {
    const dateA = a.lastConnectionAt ?? a.createdAt;
    const dateB = b.lastConnectionAt ?? b.createdAt;
    return new Date(dateB!).getTime() - new Date(dateA!).getTime();
  });

  return NextResponse.json(files);
}

// POST /api/files — create a new file (room)
export async function POST(request: NextRequest) {
  const { name } = await request.json();

  if (!name) {
    return NextResponse.json({ error: "Missing file name" }, { status: 400 });
  }

  const filename = name.endsWith(".py") ? name : `${name}.py`;
  const roomId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const room = await liveblocks.createRoom(roomId, {
    defaultAccesses: ["room:write"],
    metadata: {
      name: filename,
    },
  });

  return NextResponse.json({
    id: room.id,
    name: filename,
    createdAt: room.createdAt,
  });
}
