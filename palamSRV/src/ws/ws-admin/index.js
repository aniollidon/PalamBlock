const { Server } = require("socket.io");
const infoController = require("../../controllers/infoController");
const normaController = require("../../controllers/normaController");
const historialController = require("../../controllers/historialController");
const alumneController = require("../../controllers/alumneController");
const adminController = require("../../controllers/adminController");
const logger = require("../../logger").logger;

// ============================================
// HELPERS DE FILTRAT PER ROL
// ============================================

/**
 * Comprova si un socket pertany a un superadmin
 */
function isSuperAdmin(socket) {
  return socket.adminRole === 'superadmin';
}

/**
 * Obté el conjunt d'alumneIds permesos per a un socket
 * @returns {Set<string>|null} - null = accés total (superadmin), Set = alumnes permesos
 */
function getAllowedAlumneIds(socket, grupAlumnesCache) {
  if (isSuperAdmin(socket)) return null;
  if (!socket.adminGrupsPermesos || socket.adminGrupsPermesos.length === 0) return new Set();

  const allowed = new Set();
  for (const grupId of socket.adminGrupsPermesos) {
    const grup = grupAlumnesCache[grupId];
    if (grup && grup.alumnes) {
      for (const alumneId of Object.keys(grup.alumnes)) {
        allowed.add(alumneId);
      }
    }
  }
  return allowed;
}

/**
 * Filtra grupAlumnesList segons el rol del socket
 */
function filterGrupAlumnesList(grups, socket) {
  if (isSuperAdmin(socket)) return grups;
  if (!socket.adminGrupsPermesos || socket.adminGrupsPermesos.length === 0) return {};

  const filtered = {};
  for (const grupId of socket.adminGrupsPermesos) {
    if (grups[grupId]) {
      filtered[grupId] = grups[grupId];
    }
  }
  return filtered;
}

/**
 * Filtra alumnesActivity segons el rol del socket
 */
function filterAlumnesActivity(activity, socket, grupAlumnesCache) {
  if (isSuperAdmin(socket)) return activity;
  const allowedIds = getAllowedAlumneIds(socket, grupAlumnesCache);
  if (!allowedIds || allowedIds.size === 0) return {};

  const filtered = {};
  for (const alumneId of Object.keys(activity || {})) {
    if (allowedIds.has(alumneId)) {
      filtered[alumneId] = activity[alumneId];
    }
  }
  return filtered;
}

/**
 * Filtra alumnesMachine segons el rol del socket
 */
function filterAlumnesMachine(machines, socket, grupAlumnesCache) {
  if (isSuperAdmin(socket)) return machines;
  const allowedIds = getAllowedAlumneIds(socket, grupAlumnesCache);
  if (!allowedIds || allowedIds.size === 0) return {};

  const filtered = {};
  for (const alumneId of Object.keys(machines || {})) {
    if (allowedIds.has(alumneId)) {
      filtered[alumneId] = machines[alumneId];
    }
  }
  return filtered;
}

/**
 * Emet grupAlumnesList filtrat a cada socket connectat
 */
async function emitFilteredGrupAlumnesList(io) {
  const grups = await alumneController.getGrupAlumnesList();
  for (const [id, sock] of io.of("/").sockets) {
    if (sock.adminRole) {
      sock.emit("grupAlumnesList", filterGrupAlumnesList(grups, sock));
    }
  }
}

/**
 * Emet adminsList només als sockets superadmin
 */
async function emitAdminsListToSuperAdmins(io) {
  const admins = await adminController.llistarAdmins();
  for (const [id, sock] of io.of("/").sockets) {
    if (isSuperAdmin(sock)) {
      sock.emit("adminsList", admins);
    }
  }
}

// ============================================
// INICIALITZACIÓ DEL WEBSOCKET ADMIN
// ============================================

function initializeAdminWebSocket(server) {
  const info_activityCallbacks = {};
  const norma_activityCallbacks = {};
  const io = new Server(server, {
    path: "/ws-admin",
  });

  // Cache local de grupAlumnesList per filtrat ràpid
  let grupAlumnesCache = {};

  io.use((socket, next) => {
    const { user, authToken } = socket.handshake.query;
    try {
      const tokenPreview = authToken
        ? `${String(authToken).slice(0, 6)}…(${String(authToken).length})`
        : "<cap>";
      logger.debug(
        `[ws-admin handshake] user=${user || "<cap>"} token=${tokenPreview}`
      );
    } catch (_) {}

    // Verifiquem les credencials i obtenim rol + grupsPermesos
    const auth = adminController.checkAdmin(user, authToken);
    if (auth && auth.valid) {
      // Emmagatzemar rol i grups al socket
      socket.adminRole = auth.role || 'admin';
      socket.adminGrupsPermesos = auth.grupsPermesos || [];
      socket.adminUser = user;
      logger.debug(
        `[ws-admin handshake] autenticació OK per ${user} (role=${socket.adminRole}, grups=${socket.adminGrupsPermesos.length})`
      );
      return next();
    }

    logger.debug(
      `[ws-admin handshake] autenticació FALLIDA per ${user || "<cap>"}`
    );
    return next(new Error("Autenticació fallida"));
  });

  infoController.registerActivityOnUpdateCallback(async (topic) => {
    for (const callback of Object.values(info_activityCallbacks)) {
      callback(topic);
    }
  });

  normaController.registerOnUpdateCallback(async () => {
    infoController.normesWebHasChanged();
    for (const callback of Object.values(norma_activityCallbacks)) {
      callback();
    }
  });

  io.on("connection", async (socket) => {
    const { user } = socket.handshake.query || {};
    logger.info(
      `S'ha connectat un client ws-admin ${socket.id} (user=${user || "<cap>"}, role=${socket.adminRole})`
    );

    // Emetre roleInfo al client perquè sàpiga el seu rol
    socket.emit("roleInfo", {
      role: socket.adminRole,
      grupsPermesos: socket.adminGrupsPermesos,
      expectedNetwork: process.env.EXPECTED_NETWORK || null,
      remoteVncPassword: process.env.REMOTE_VNC_PASSWORD || null,
    });

    // Emissions inicials amb filtrat
    try {
      const grups = await alumneController.getGrupAlumnesList();
      grupAlumnesCache = grups;
      socket.emit("grupAlumnesList", filterGrupAlumnesList(grups, socket));

      const activity = await infoController.getAlumnesActivity();
      socket.emit("alumnesActivity", filterAlumnesActivity(activity, socket, grupAlumnesCache));

      const machines = infoController.getAlumnesMachine();
      socket.emit("alumnesMachine", filterAlumnesMachine(machines, socket, grupAlumnesCache));

      const normes = await normaController.getAllNormes2Web();
      socket.emit("normesWeb", normes);
    } catch (e) {
      logger.warn(`[ws-admin ${socket.id}] error paquet inicial: ${e.message}`);
    }

    // Callback d'activitat amb filtrat
    info_activityCallbacks[socket.id] = async (topic) => {
      if (topic.includes("browsers")) {
        const activity = await infoController.getAlumnesActivity();
        socket.emit(
          "alumnesActivity",
          filterAlumnesActivity(activity, socket, grupAlumnesCache)
        );
      }
      if (topic.includes("machines")) {
        const machines = infoController.getAlumnesMachine();
        socket.emit(
          "updateAlumnesMachine",
          filterAlumnesMachine(machines, socket, grupAlumnesCache)
        );
      }
    };

    // Callback de normes
    norma_activityCallbacks[socket.id] = async () => {
      socket.emit("normesWeb", await normaController.getAllNormes2Web());
    };

    // ============================================
    // OPERACIONS GENERALS (disponibles per tothom)
    // ============================================

    socket.on("closeTab", (msg) => {
      infoController.remoteCloseTab(msg.alumne, msg.browser, msg.tabId);
    });

    socket.on("addNormaWeb", (msg) => {
      normaController.addNorma2Web(
        msg.who, msg.whoid, msg.severity, msg.mode,
        msg.list, msg.enabled_on, msg.categories
      );
    });

    socket.on("removeNormaWeb", (msg) => {
      normaController.removeNorma2Web(msg.who, msg.whoid, msg.normaId);
    });

    socket.on("deleteHistorialFromAlumne", (msg) => {
      historialController.deleteHistorialFromAlumne(msg.alumne);
    });

    socket.on("getHistorialWeb", async (msg) => {
      const historial = await historialController.getHistorialWeb(msg.alumne, msg.offset);
      socket.emit("historialWebAlumne", { alumne: msg.alumne, historial });
    });

    socket.on("getSearchHistorialWeb", async (msg) => {
      const historial = await historialController.searchHistorialWeb(msg.alumne, msg.search, msg.offset);
      socket.emit("historialWebAlumne", { alumne: msg.alumne, historial, query: msg.search });
    });

    socket.on("getEachBrowserLastUsage", async (msg) => {
      const lastUsage = await historialController.getEachBrowserLastUsage(msg.alumne);
      socket.emit("eachBrowserLastUsage", { alumne: msg.alumne, lastUsage });
    });

    socket.on("getHistorialHostsSortedByUsage", async (msg) => {
      const sortedHistorial = await historialController.getHistorialHostsSortedByUsage(
        msg.alumne, msg.pastDays || 7
      );
      socket.emit("historialHostsSortedByUsage", {
        alumne: msg.alumne, sortedHistorial, days: msg.pastDays || 7,
      });
    });

    socket.on("updateNormaWeb", async (msg) => {
      await normaController.updateNorma2Web(
        msg.who, msg.whoid, msg.normaId, msg.severity, msg.mode,
        msg.list, msg.enabled_on, msg.alive, msg.categories
      );
    });

    socket.on("getAllCategories", async () => {
      try {
        const categories = await normaController.getAllCategories();
        socket.emit("allCategories", categories);
      } catch (e) {
        logger.warn("No s'han pogut obtenir les categories", e);
        socket.emit("allCategories", []);
      }
    });

    socket.on("setCategoryAlive", async (msg) => {
      try {
        await normaController.setCategoryAlive(msg.who, msg.whoid, msg.category, msg.alive);
      } catch (e) {
        logger.warn("No s'ha pogut canviar l'estat de la categoria", e);
      }
    });

    socket.on("sendMessageToAlumne", async (msg) => {
      await infoController.sendMessageToAlumne(msg.alumne, msg.message);
    });

    socket.on("sendCommandToAlumne", async (msg) => {
      await infoController.sendCommandToAlumne(msg.alumne, msg.command);
    });

    // Petició explícita de la llista de grups (filtrat)
    socket.on("getGrupAlumnesList", async () => {
      try {
        const grups = await alumneController.getGrupAlumnesList();
        grupAlumnesCache = grups;
        socket.emit("grupAlumnesList", filterGrupAlumnesList(grups, socket));
        logger.trace(`[ws-admin ${socket.id}] getGrupAlumnesList -> ${grups ? Object.keys(grups).length : 0}`);
      } catch (e) {
        logger.warn("No s'ha pogut tornar a enviar grupAlumnesList", e);
      }
    });

    // Paquet inicial complet (filtrat)
    socket.on("getInitialData", async () => {
      try {
        logger.trace(`[ws-admin ${socket.id}] getInitialData request`);
        const grups = await alumneController.getGrupAlumnesList();
        grupAlumnesCache = grups;
        socket.emit("grupAlumnesList", filterGrupAlumnesList(grups, socket));
        const activity = await infoController.getAlumnesActivity();
        socket.emit("alumnesActivity", filterAlumnesActivity(activity, socket, grupAlumnesCache));
        socket.emit("alumnesMachine", filterAlumnesMachine(infoController.getAlumnesMachine(), socket, grupAlumnesCache));
        socket.emit("normesWeb", await normaController.getAllNormes2Web());
      } catch (e) {
        logger.warn("No s'ha pogut re-emetre el paquet inicial", e);
      }
    });

    // ============================================
    // OPERACIONS RESTRINGIDES A SUPERADMIN
    // ============================================

    const requireSuperAdmin = (operation, callback) => {
      if (!isSuperAdmin(socket)) {
        logger.warn(`[ws-admin ${socket.id}] Intent d'operació ${operation} sense permisos de superadmin`);
        if (callback) callback({ status: "ERROR", error: "Accés denegat. Es necessita rol superadmin." });
        return false;
      }
      return true;
    };

    socket.on("setGrupStatus", async (msg) => {
      if (!requireSuperAdmin("setGrupStatus")) return;
      await alumneController.setGrupStatus(msg.grup, msg.status);
    });

    socket.on("setAlumneStatus", async (msg) => {
      if (!requireSuperAdmin("setAlumneStatus")) return;
      await alumneController.setAlumneStatus(msg.alumne, msg.status);
    });

    socket.on("powerOffAll", async (msg) => {
      if (!requireSuperAdmin("powerOffAll")) return;
      await infoController.powerOffAll(msg.grup);
    });

    // ========== SUPER MODE: Gestió d'alumnes ==========
    socket.on("createAlumne", async (msg, callback) => {
      if (!requireSuperAdmin("createAlumne", callback)) return;
      try {
        const { alumneId, grupId, clau, nom, cognoms } = msg;
        if (!alumneId || !grupId || !clau || !nom || !cognoms) {
          throw new Error("Falten dades. Es necessiten: alumneId, grupId, clau, nom, cognoms");
        }
        const alumne = await alumneController.creaAlumne(alumneId, grupId, clau, nom, cognoms);
        await emitFilteredGrupAlumnesList(io);
        logger.info(`[ws-admin ${socket.id}] Alumne creat: ${alumneId}`);
        if (callback) callback({ status: "OK", data: alumne });
      } catch (error) {
        logger.error(`[ws-admin ${socket.id}] Error creant alumne:`, error);
        if (callback) callback({ status: "ERROR", error: error.message || "Error creant l'alumne" });
      }
    });

    socket.on("updateAlumne", async (msg, callback) => {
      if (!requireSuperAdmin("updateAlumne", callback)) return;
      try {
        const { alumneId, updates } = msg;
        if (!alumneId || !updates) throw new Error("Falten dades. Es necessiten: alumneId, updates");
        await alumneController.updateAlumne(alumneId, updates);
        await emitFilteredGrupAlumnesList(io);
        logger.info(`[ws-admin ${socket.id}] Alumne actualitzat: ${alumneId}`);
        if (callback) callback({ status: "OK" });
      } catch (error) {
        logger.error(`[ws-admin ${socket.id}] Error actualitzant alumne:`, error);
        if (callback) callback({ status: "ERROR", error: error.message || "Error actualitzant l'alumne" });
      }
    });

    socket.on("deleteAlumne", async (msg, callback) => {
      if (!requireSuperAdmin("deleteAlumne", callback)) return;
      try {
        const { alumneId } = msg;
        if (!alumneId) throw new Error("Falta alumneId");
        await alumneController.deleteAlumne(alumneId);
        await emitFilteredGrupAlumnesList(io);
        logger.info(`[ws-admin ${socket.id}] Alumne esborrat: ${alumneId}`);
        if (callback) callback({ status: "OK" });
      } catch (error) {
        logger.error(`[ws-admin ${socket.id}] Error esborrant alumne:`, error);
        if (callback) callback({ status: "ERROR", error: error.message || "Error esborrant l'alumne" });
      }
    });

    // ========== SUPER MODE: Gestió de grups ==========
    socket.on("createGrup", async (msg, callback) => {
      if (!requireSuperAdmin("createGrup", callback)) return;
      try {
        const { grupId, nom } = msg;
        if (!grupId) throw new Error("Falta grupId");
        await alumneController.creaGrup(grupId, nom);
        await emitFilteredGrupAlumnesList(io);
        logger.info(`[ws-admin ${socket.id}] Grup creat: ${grupId}`);
        if (callback) callback({ status: "OK" });
      } catch (error) {
        logger.error(`[ws-admin ${socket.id}] Error creant grup:`, error);
        if (callback) callback({ status: "ERROR", error: error.message || "Error creant el grup" });
      }
    });

    socket.on("updateGrup", async (msg, callback) => {
      if (!requireSuperAdmin("updateGrup", callback)) return;
      try {
        const { grupId, updates } = msg;
        if (!grupId || !updates) throw new Error("Falten dades. Es necessiten: grupId, updates");
        await alumneController.updateGrup(grupId, updates);
        await emitFilteredGrupAlumnesList(io);
        logger.info(`[ws-admin ${socket.id}] Grup actualitzat: ${grupId}`);
        if (callback) callback({ status: "OK" });
      } catch (error) {
        logger.error(`[ws-admin ${socket.id}] Error actualitzant grup:`, error);
        if (callback) callback({ status: "ERROR", error: error.message || "Error actualitzant el grup" });
      }
    });

    socket.on("deleteGrup", async (msg, callback) => {
      if (!requireSuperAdmin("deleteGrup", callback)) return;
      try {
        const { grupId } = msg;
        if (!grupId) throw new Error("Falta grupId");
        await alumneController.deleteGrup(grupId);
        await emitFilteredGrupAlumnesList(io);
        logger.info(`[ws-admin ${socket.id}] Grup esborrat: ${grupId}`);
        if (callback) callback({ status: "OK" });
      } catch (error) {
        logger.error(`[ws-admin ${socket.id}] Error esborrant grup:`, error);
        if (callback) callback({ status: "ERROR", error: error.message || "Error esborrant el grup" });
      }
    });

    // ============================================
    // GESTIÓ D'ADMINISTRADORS (només superadmin)
    // ============================================

    socket.on("getAdminsList", async (callback) => {
      if (!requireSuperAdmin("getAdminsList", callback)) return;
      try {
        const admins = await adminController.llistarAdmins();
        logger.trace(`[ws-admin ${socket.id}] getAdminsList -> ${admins.length} admins`);
        if (callback) callback({ status: "OK", data: admins });
      } catch (error) {
        logger.error(`[ws-admin ${socket.id}] Error obtenint admins:`, error);
        if (callback) callback({ status: "ERROR", error: error.message || "Error obtenint administradors" });
      }
    });

    socket.on("createAdmin", async (data, callback) => {
      if (!requireSuperAdmin("createAdmin", callback)) return;
      try {
        const { user, clau, role, grupsPermesos } = data;
        if (!user || !clau) throw new Error("Falten dades obligatòries (user, clau)");
        await adminController.crearAdmin({ user, clau, role, grupsPermesos });
        await emitAdminsListToSuperAdmins(io);
        logger.info(`[ws-admin ${socket.id}] Admin creat: ${user} (role=${role || 'admin'})`);
        if (callback) callback({ status: "OK" });
      } catch (error) {
        logger.error(`[ws-admin ${socket.id}] Error creant admin:`, error);
        if (callback) callback({ status: "ERROR", error: error.message || "Error creant administrador" });
      }
    });

    socket.on("updateAdmin", async (data, callback) => {
      if (!requireSuperAdmin("updateAdmin", callback)) return;
      try {
        const { user, clau, role, grupsPermesos } = data;
        if (!user) throw new Error("Falta user");
        await adminController.actualitzarAdmin(user, clau, role, grupsPermesos);
        await emitAdminsListToSuperAdmins(io);
        logger.info(`[ws-admin ${socket.id}] Admin actualitzat: ${user}`);
        if (callback) callback({ status: "OK" });
      } catch (error) {
        logger.error(`[ws-admin ${socket.id}] Error actualitzant admin:`, error);
        if (callback) callback({ status: "ERROR", error: error.message || "Error actualitzant administrador" });
      }
    });

    socket.on("deleteAdmin", async (data, callback) => {
      if (!requireSuperAdmin("deleteAdmin", callback)) return;
      try {
        const { user } = data;
        if (!user) throw new Error("Falta user");
        await adminController.esborrarAdmin(user);
        await emitAdminsListToSuperAdmins(io);
        logger.info(`[ws-admin ${socket.id}] Admin esborrat: ${user}`);
        if (callback) callback({ status: "OK" });
      } catch (error) {
        logger.error(`[ws-admin ${socket.id}] Error esborrant admin:`, error);
        if (callback) callback({ status: "ERROR", error: error.message || "Error esborrant administrador" });
      }
    });

    socket.on("disconnect", () => {
      logger.info("S'ha desconnectat un client ws-admin " + socket.id);
      delete info_activityCallbacks[socket.id];
      delete norma_activityCallbacks[socket.id];
    });
  });
}

module.exports = initializeAdminWebSocket;
