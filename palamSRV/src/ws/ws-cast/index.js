const { Server } = require("socket.io");
const logger = require("../../logger").logger;

// roomName -> {
//   broadcasterId: string|null,
//   viewers: Set<string>,
//   mode: 'webrtc'|'url'|null,
//   urlState: { url: string, interactive: boolean }|null
// }
const rooms = new Map();

// socketId -> { role: 'broadcaster'|'viewer', room: string }
const socketMeta = new Map();

function getOrCreateRoom(roomName) {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, {
      broadcasterId: null,
      viewers: new Set(),
      mode: null,
      urlState: null,
    });
  }
  return rooms.get(roomName);
}

function initializeCastWebSocket(server) {
  const io = new Server(server, {
    path: "/ws-cast",
  });

  io.on("connection", (socket) => {
    socket.on("viewer-join", ({ room }) => {
      if (!room || typeof room !== "string") return;
      const r = getOrCreateRoom(room);
      socket.join(room);
      r.viewers.add(socket.id);
      socketMeta.set(socket.id, { role: "viewer", room });

      if (r.broadcasterId) {
        if (r.mode === "url" && r.urlState) {
          io.to(socket.id).emit("url-broadcast-started", {
            url: r.urlState.url,
            interactive: !!r.urlState.interactive,
          });
        } else {
          io.to(socket.id).emit("broadcaster-available");
        }
      }
    });

    // New: check room status (ack with hasBroadcaster)
    socket.on("check-room", ({ room }, ack) => {
      if (!room || typeof room !== "string") {
        if (typeof ack === "function") ack({ hasBroadcaster: false });
        return;
      }
      const r = getOrCreateRoom(room);
      const hasBroadcaster = Boolean(r.broadcasterId);
      if (typeof ack === "function") ack({ hasBroadcaster });
    });

    socket.on(
      "broadcaster-join-request",
      ({ room, kind, url, interactive }) => {
        if (!room || typeof room !== "string") return;
        const r = getOrCreateRoom(room);

        if (r.broadcasterId && r.broadcasterId !== socket.id) {
          io.to(socket.id).emit("replace-required");
          return;
        }

        // No broadcaster currently
        r.broadcasterId = socket.id;
        socket.join(room);
        socketMeta.set(socket.id, { role: "broadcaster", room });
        // Set mode and notify viewers
        if (kind === "url") {
          r.mode = "url";
          r.urlState = {
            url: typeof url === "string" ? url : "",
            interactive: !!interactive,
          };
          io.to(room).emit("url-broadcast-started", {
            url: r.urlState.url,
            interactive: r.urlState.interactive,
          });
          io.to(socket.id).emit("broadcaster-accepted");
        } else {
          r.mode = "webrtc";
          r.urlState = null;
          io.to(room).emit("broadcaster-available");
          io.to(socket.id).emit("broadcaster-accepted");
        }
      }
    );

    socket.on(
      "confirm-replace",
      ({ room, confirm, kind, url, interactive }) => {
        const r = getOrCreateRoom(room);
        if (!r) return;

        if (confirm === true) {
          const oldId = r.broadcasterId;
          if (oldId && oldId !== socket.id) {
            io.to(oldId).emit("force-disconnect");
          }
          r.broadcasterId = socket.id;
          socket.join(room);
          socketMeta.set(socket.id, { role: "broadcaster", room });
          if (kind === "url") {
            r.mode = "url";
            r.urlState = {
              url: typeof url === "string" ? url : "",
              interactive: !!interactive,
            };
            io.to(room).emit("url-broadcast-started", {
              url: r.urlState.url,
              interactive: r.urlState.interactive,
            });
            io.to(socket.id).emit("broadcaster-accepted");
          } else {
            r.mode = "webrtc";
            r.urlState = null;
            io.to(room).emit("broadcaster-available");
            io.to(socket.id).emit("broadcaster-accepted");
          }
        } else {
          io.to(socket.id).emit("replace-declined");
        }
      }
    );

    // Signaling: viewer -> broadcaster (offer)
    socket.on("viewer-offer", ({ room, sdp }) => {
      const r = rooms.get(room);
      if (!r || !r.broadcasterId) return;
      io.to(r.broadcasterId).emit("viewer-offer", { viewerId: socket.id, sdp });
    });

    // Signaling: broadcaster -> viewer (answer)
    socket.on("broadcaster-answer", ({ room, toViewerId, sdp }) => {
      if (!toViewerId) return;
      io.to(toViewerId).emit("broadcaster-answer", { sdp });
    });

    // ICE candidates
    socket.on("ice-candidate", ({ room, toViewerId, candidate }) => {
      const meta = socketMeta.get(socket.id);
      const r = rooms.get(room);
      if (!meta || !r) return;

      if (meta.role === "viewer") {
        // forward to broadcaster with viewerId info
        if (r.broadcasterId) {
          io.to(r.broadcasterId).emit("ice-candidate", {
            viewerId: socket.id,
            candidate,
          });
        }
      } else if (meta.role === "broadcaster") {
        if (toViewerId) {
          io.to(toViewerId).emit("ice-candidate", { candidate });
        }
      }
    });

    socket.on("stop-broadcast", () => {
      const meta = socketMeta.get(socket.id);
      if (!meta || meta.role !== "broadcaster") return;
      const room = meta.room;
      const r = rooms.get(room);
      if (!r) return;

      if (r.broadcasterId === socket.id) {
        r.broadcasterId = null;
        r.mode = null;
        r.urlState = null;
        io.to(room).emit("broadcaster-ended");
      }
    });

    socket.on("disconnecting", () => {
      const meta = socketMeta.get(socket.id);
      if (!meta) return;
      const room = meta.room;
      const r = rooms.get(room);
      if (!r) return;

      if (meta.role === "viewer") {
        r.viewers.delete(socket.id);
        const bc = r.broadcasterId;
        if (bc) {
          io.to(bc).emit("viewer-left", { viewerId: socket.id });
        }
      } else if (meta.role === "broadcaster") {
        if (r.broadcasterId === socket.id) {
          r.broadcasterId = null;
          r.mode = null;
          r.urlState = null;
          io.to(room).emit("broadcaster-ended");
        }
      }

      socketMeta.delete(socket.id);
    });
  });
}

module.exports = initializeCastWebSocket;
