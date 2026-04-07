import { NextRequest, NextResponse } from "next/server";
import { liveblocks } from "@/lib/liveblocks-server";

const COLORS = ["#58a6ff", "#f778ba"];

export async function POST(request: NextRequest) {
  const { room, username } = await request.json();

  if (!username || !room) {
    return NextResponse.json(
      { error: "Missing username or room" },
      { status: 400 }
    );
  }

  // Deterministic color based on username so each person always gets the same one
  const colorIndex =
    username.split("").reduce((sum: number, c: string) => sum + c.charCodeAt(0), 0) % COLORS.length;

  const session = liveblocks.prepareSession(`user-${username}`, {
    userInfo: {
      name: username,
      color: COLORS[colorIndex],
    },
  });

  session.allow(room, session.FULL_ACCESS);

  const { body, status } = await session.authorize();
  return new Response(body, { status });
}
