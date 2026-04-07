"use client";

import { ReactNode } from "react";
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";
import { getUsername } from "@/lib/username";

export function LiveblocksWrapper({
  roomId,
  children,
}: {
  roomId: string;
  children: ReactNode;
}) {
  return (
    <LiveblocksProvider
      authEndpoint={async (room) => {
        const res = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room, username: getUsername() }),
        });
        return res.json();
      }}
    >
      <RoomProvider id={roomId}>{children}</RoomProvider>
    </LiveblocksProvider>
  );
}
