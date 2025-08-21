const { Server } = require("socket.io");
const logger = require("../../logger").logger;
const infoController = require("../../controllers/infoController");
const alumneController = require("../../controllers/alumneController");

// roomName -> {
//   broadcasterId: string|null,
//   viewers: Set<string>,
//   mode: 'webrtc'|'url'|null,
//   urlState: { url: string, interactive: boolean }|null,
//   type: 'individual'|'group'|null
// }
const rooms = new Map();

// socketId -> { role: 'broadcaster'|'viewer', room: string, originalTarget?: string }
const socketMeta = new Map();

function getOrCreateRoom(roomName) {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, {
      broadcasterId: null,
      viewers: new Set(),
      mode: null,
      urlState: null,
      type: null,
    });
  }
  return rooms.get(roomName);
}

function initializeCastWebSocket(server) {
  const io = new Server(server, {
    path: "/ws-cast",
  });

  // Funció per trobar la room activa per un alumne (individual o grup)
  async function findActiveRoomForAlumne(alumne) {
    // 1. Comprova si hi ha emissió individual per l'alumne
    if (rooms.has(alumne)) {
      const room = rooms.get(alumne);
      if (room.broadcasterId) {
        return { roomName: alumne, room, type: "individual" };
      }
    }

    // 2. Comprova si hi ha emissió per al seu grup
    try {
      const grupAlumnesList = await alumneController.getGrupAlumnesList();
      for (const grupId in grupAlumnesList) {
        const grup = grupAlumnesList[grupId];
        if (grup.alumnes && grup.alumnes[alumne]) {
          // L'alumne pertany a aquest grup
          if (rooms.has(grupId)) {
            const room = rooms.get(grupId);
            if (room.broadcasterId) {
              return { roomName: grupId, room, type: "group" };
            }
          }
        }
      }
    } catch (err) {
      logger.error("Error finding grup for alumne:", err);
    }

    return null;
  }

  // Funció per notificar als alumnes d'un grup que hi ha una emissió activa
  async function notifyGroupMembersOfBroadcast(grupId, isStarting) {
    try {
      const grupAlumnesList = await alumneController.getGrupAlumnesList();
      if (grupAlumnesList[grupId] && grupAlumnesList[grupId].alumnes) {
        for (const alumneId in grupAlumnesList[grupId].alumnes) {
          // Busca si l'alumne té viewers connectats esperant
          for (const [socketId, meta] of socketMeta.entries()) {
            if (meta.role === "viewer" && meta.originalTarget === alumneId) {
              if (isStarting) {
                // Redirigeix l'alumne a la room del grup
                const socket = io.sockets.sockets.get(socketId);
                if (socket) {
                  socket.leave(alumneId);
                  socket.join(grupId);

                  // Actualitza la metadata
                  meta.room = grupId;

                  // Actualitza les estructures de dades de rooms
                  const individualRoom = rooms.get(alumneId);
                  const groupRoom = rooms.get(grupId);

                  if (individualRoom) {
                    individualRoom.viewers.delete(socketId);
                  }
                  if (groupRoom) {
                    groupRoom.viewers.add(socketId);

                    // Envia l'estat de l'emissió
                    if (groupRoom.mode === "url" && groupRoom.urlState) {
                      io.to(socketId).emit("url-broadcast-started", {
                        url: groupRoom.urlState.url,
                        interactive: !!groupRoom.urlState.interactive,
                      });
                    } else {
                      io.to(socketId).emit("broadcaster-available");
                    }
                  }

                  logger.debug(
                    `Redirected alumne ${alumneId} to group emission ${grupId}`
                  );
                }
              }
            }
          }
        }
      }
    } catch (err) {
      logger.error("Error notifying group members:", err);
    }
  }

  // Funció per gestionar quan un alumne té una emissió individual que pot substituir la de grup
  async function handleIndividualEmissionForAlumne(alumneId) {
    try {
      // Busca si l'alumne estava connectat a una emissió de grup
      for (const [socketId, meta] of socketMeta.entries()) {
        if (
          meta.role === "viewer" &&
          meta.originalTarget === alumneId &&
          meta.room !== alumneId
        ) {
          // L'alumne estava connectat a una room diferent (probablement grup)
          const socket = io.sockets.sockets.get(socketId);
          if (socket) {
            // Desconnecta de la room anterior
            socket.leave(meta.room);
            const oldRoom = rooms.get(meta.room);
            if (oldRoom) {
              oldRoom.viewers.delete(socketId);
            }

            // Connecta a la seva room individual
            socket.join(alumneId);
            meta.room = alumneId;

            const individualRoom = rooms.get(alumneId);
            if (individualRoom) {
              individualRoom.viewers.add(socketId);

              // Envia l'estat de la nova emissió
              if (individualRoom.mode === "url" && individualRoom.urlState) {
                io.to(socketId).emit("url-broadcast-started", {
                  url: individualRoom.urlState.url,
                  interactive: !!individualRoom.urlState.interactive,
                });
              } else {
                io.to(socketId).emit("broadcaster-available");
              }
            }

            logger.debug(
              `Moved alumne ${alumneId} from group to individual emission`
            );
          }
        }
      }
    } catch (err) {
      logger.error("Error handling individual emission:", err);
    }
  }

  io.on("connection", (socket) => {
    socket.on("viewer-join", async ({ room }) => {
      if (!room || typeof room !== "string") return;

      // Busca la room activa per aquest alumne (individual o grup)
      const activeRoom = await findActiveRoomForAlumne(room);

      if (activeRoom) {
        // Hi ha una emissió activa, connecta a la room corresponent
        const { roomName, room: r, type } = activeRoom;
        socket.join(roomName);
        r.viewers.add(socket.id);
        socketMeta.set(socket.id, {
          role: "viewer",
          room: roomName,
          originalTarget: room,
        });

        if (r.mode === "url" && r.urlState) {
          io.to(socket.id).emit("url-broadcast-started", {
            url: r.urlState.url,
            interactive: !!r.urlState.interactive,
          });
        } else {
          io.to(socket.id).emit("broadcaster-available");
        }

        logger.debug(
          `Alumne ${room} connected to ${type} emission in room ${roomName}`
        );
      } else {
        // No hi ha emissió activa, connecta a la room original i espera
        const r = getOrCreateRoom(room);
        socket.join(room);
        r.viewers.add(socket.id);
        socketMeta.set(socket.id, {
          role: "viewer",
          room,
          originalTarget: room,
        });

        logger.debug(`Alumne ${room} waiting for emission in room ${room}`);
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
      async ({ room, kind, url, interactive }) => {
        if (!room || typeof room !== "string") return;
        const r = getOrCreateRoom(room);

        if (r.broadcasterId && r.broadcasterId !== socket.id) {
          io.to(socket.id).emit("replace-required");
          return;
        }

        // Determina el tipus d'emissió (individual o grup)
        let emissionType = "individual";
        try {
          const grupAlumnesList = await alumneController.getGrupAlumnesList();
          if (grupAlumnesList[room]) {
            emissionType = "group";
          }
        } catch (err) {
          logger.error("Error determining emission type:", err);
        }

        // No broadcaster currently
        r.broadcasterId = socket.id;
        r.type = emissionType;
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

        // Enviar ordre open-display a les màquines dels alumnes
        try {
          infoController.sendDisplayCommand(room, "open-display");
        } catch (err) {
          logger.error("Error sending open-display command:", err);
        }

        // Si és una emissió de grup, notifica als alumnes del grup que hi ha emissió
        if (emissionType === "group") {
          try {
            await notifyGroupMembersOfBroadcast(room, true);
          } catch (err) {
            logger.error("Error notifying group members:", err);
          }
        } else if (emissionType === "individual") {
          // Si és una emissió individual, gestiona la possible substitució de grup
          try {
            await handleIndividualEmissionForAlumne(room);
          } catch (err) {
            logger.error("Error handling individual emission:", err);
          }
        }
      }
    );

    socket.on(
      "confirm-replace",
      async ({ room, confirm, kind, url, interactive }) => {
        const r = getOrCreateRoom(room);
        if (!r) return;

        if (confirm === true) {
          const oldId = r.broadcasterId;
          if (oldId && oldId !== socket.id) {
            io.to(oldId).emit("force-disconnect");
          }

          // Determina el tipus d'emissió
          let emissionType = "individual";
          try {
            const grupAlumnesList = await alumneController.getGrupAlumnesList();
            if (grupAlumnesList[room]) {
              emissionType = "group";
            }
          } catch (err) {
            logger.error("Error determining emission type:", err);
          }

          r.broadcasterId = socket.id;
          r.type = emissionType;
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

          // Enviar ordre open-display a les màquines dels alumnes
          try {
            infoController.sendDisplayCommand(room, "open-display");
          } catch (err) {
            logger.error("Error sending open-display command:", err);
          }

          // Si és una emissió de grup, notifica als alumnes del grup
          if (emissionType === "group") {
            try {
              await notifyGroupMembersOfBroadcast(room, true);
            } catch (err) {
              logger.error("Error notifying group members:", err);
            }
          } else if (emissionType === "individual") {
            // Si és una emissió individual, gestiona la possible substitució de grup
            try {
              await handleIndividualEmissionForAlumne(room);
            } catch (err) {
              logger.error("Error handling individual emission:", err);
            }
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

    socket.on("stop-broadcast", async () => {
      const meta = socketMeta.get(socket.id);
      if (!meta || meta.role !== "broadcaster") return;
      const room = meta.room;
      const r = rooms.get(room);
      if (!r) return;

      if (r.broadcasterId === socket.id) {
        const wasGroupEmission = r.type === "group";

        r.broadcasterId = null;
        r.mode = null;
        r.urlState = null;
        r.type = null;
        io.to(room).emit("broadcaster-ended");

        // Enviar ordre close-display a les màquines dels alumnes
        try {
          infoController.sendDisplayCommand(room, "close-display");
        } catch (err) {
          logger.error("Error sending close-display command:", err);
        }

        // Si era una emissió de grup, notifica als alumnes del grup
        if (wasGroupEmission) {
          try {
            await notifyGroupMembersOfBroadcast(room, false);
          } catch (err) {
            logger.error("Error notifying group members of end:", err);
          }
        }
      }
    });

    socket.on("disconnecting", async () => {
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
          const wasGroupEmission = r.type === "group";

          r.broadcasterId = null;
          r.mode = null;
          r.urlState = null;
          r.type = null;
          io.to(room).emit("broadcaster-ended");

          // Enviar ordre close-display a les màquines dels alumnes
          try {
            infoController.sendDisplayCommand(room, "close-display");
          } catch (err) {
            logger.error("Error sending close-display command:", err);
          }

          // Si era una emissió de grup, notifica als alumnes del grup
          if (wasGroupEmission) {
            try {
              await notifyGroupMembersOfBroadcast(room, false);
            } catch (err) {
              logger.error("Error notifying group members of end:", err);
            }
          }
        }
      }

      socketMeta.delete(socket.id);
    });
  });
}

module.exports = initializeCastWebSocket;
