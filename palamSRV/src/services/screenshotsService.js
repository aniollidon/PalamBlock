const fs = require('fs');
const path = require('path');
const { CronJob } = require('cron');
const { logger } = require('../logger');
const sessionsHistoryService = require('./sessionsHistoryService');

// Ruta base: palamSRV/screenshots/
const screenshotsDir = path.join(__dirname, '../../screenshots');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getMachineDir(alumne, machineId) {
  return path.join(screenshotsDir, alumne, machineId);
}

function getSessionDir(alumne, machineId, sessionId) {
  return path.join(screenshotsDir, alumne, machineId, String(sessionId));
}

/**
 * Desa una captura de pantalla al disc.
 * @param {string} alumne - Nom de l'alumne
 * @param {string} machineId - ID de la màquina (MAC)
 * @param {string} filename - Nom del fitxer (timestamp.webp)
 * @param {Buffer} buffer - Buffer de la imatge
 * @param {string} [sessionId] - ID de la sessió (opcional, 'legacy' si no n'hi ha)
 * @returns {string} Ruta absoluta del fitxer desat
 */
function saveScreenshot(alumne, machineId, filename, buffer, sessionId) {
  const sessionDir = getSessionDir(alumne, machineId, sessionId || 'legacy');
  ensureDir(sessionDir);

  const filePath = path.join(sessionDir, filename);
  fs.writeFileSync(filePath, buffer);

  logger.debug(`[screenshots] Desa: ${alumne}/${machineId}/${sessionId || 'legacy'}/${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);

  // Aplica el límit del buffer després de desar (per tota la màquina)
  applyBufferLimit(alumne, machineId);

  return filePath;
}

/**
 * Compta el total d'imatges d'una màquina (suma de totes les sessions).
 * @param {string} alumne
 * @param {string} machineId
 * @returns {Array} Array de {path, filename, mtime} de totes les imatges
 */
function _getAllImagesForMachine(alumne, machineId) {
  const machineDir = getMachineDir(alumne, machineId);
  if (!fs.existsSync(machineDir)) return [];

  const allImages = [];
  const entries = fs.readdirSync(machineDir);

  for (const entry of entries) {
    const entryPath = path.join(machineDir, entry);
    try {
      const stat = fs.statSync(entryPath);
      if (stat.isDirectory()) {
        // És una carpeta de sessió: llegeix les imatges dins
        const files = fs.readdirSync(entryPath)
          .filter(f => f.endsWith('.webp') || f.endsWith('.jpg'))
          .map(f => ({
            name: f,
            path: path.join(entryPath, f),
            mtime: fs.statSync(path.join(entryPath, f)).mtime.getTime(),
            sessionId: entry,
          }));
        allImages.push(...files);
      } else if (entry.endsWith('.webp') || entry.endsWith('.jpg')) {
        // Imatge directa a la carpeta de màquina (legacy, sense sessió)
        allImages.push({
          name: entry,
          path: entryPath,
          mtime: stat.mtime.getTime(),
          sessionId: 'legacy',
        });
      }
    } catch (_) { /* fitxer o carpeta inaccessibles */ }
  }

  return allImages;
}

/**
 * Manté només les SCREENSHOTS_BUFFER imatges més recents per màquina.
 * @param {string} alumne
 * @param {string} machineId
 */
function applyBufferLimit(alumne, machineId) {
  const machineDir = getMachineDir(alumne, machineId);
  if (!fs.existsSync(machineDir)) return;

  const limit = parseInt(process.env.SCREENSHOTS_BUFFER || 120, 10);

  const allImages = _getAllImagesForMachine(alumne, machineId)
    .sort((a, b) => a.mtime - b.mtime); // mes antics primer

  while (allImages.length > limit) {
    const oldest = allImages.shift();
    try {
      fs.unlinkSync(oldest.path);
      logger.debug(`[screenshots] Buffer limit: esborrat ${alumne}/${machineId}/${oldest.sessionId}/${oldest.name}`);
    } catch (e) {
      logger.error(`[screenshots] Error esborrant ${oldest.path}:`, e.message);
    }
  }
}

/**
 * Neteja imatges més antigues de CLEANUP_SCREENSHOTS_BUFFER_DAYS dies.
 * Esborra també carpetes buides.
 * @returns {number} Nombre d'imatges esborrades
 */
function cleanupOldScreenshots() {
  const maxAgeDays = parseInt(process.env.CLEANUP_SCREENSHOTS_BUFFER_DAYS || 7, 10);
  const now = Date.now();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  logger.info(`[screenshots] Iniciant neteja: imatges de més de ${maxAgeDays} dies...`);

  if (!fs.existsSync(screenshotsDir)) {
    logger.info('[screenshots] Cap carpeta de screenshots — neteja innecessària');
    return deletedCount;
  }

  // Recorre alumne/machineId/sessionId/
  const alumnes = fs.readdirSync(screenshotsDir);
  for (const alumne of alumnes) {
    const alumneDir = path.join(screenshotsDir, alumne);
    if (!fs.statSync(alumneDir).isDirectory()) continue;

    const machines = fs.readdirSync(alumneDir);
    for (const machineId of machines) {
      const machineDir = path.join(alumneDir, machineId);
      if (!fs.statSync(machineDir).isDirectory()) continue;

      const entries = fs.readdirSync(machineDir);
      for (const entry of entries) {
        const entryPath = path.join(machineDir, entry);
        try {
          const stat = fs.statSync(entryPath);
          if (stat.isDirectory()) {
            // Carpeta de sessió: neteja imatges dins
            const files = fs.readdirSync(entryPath).filter(f => f.endsWith('.webp') || f.endsWith('.jpg'));
            for (const file of files) {
              const filePath = path.join(entryPath, file);
              try {
                const fileStat = fs.statSync(filePath);
                if (now - fileStat.mtimeMs > maxAgeMs) {
                  fs.unlinkSync(filePath);
                  deletedCount++;
                }
              } catch (e) {
                logger.error(`[screenshots] Error processant ${filePath}:`, e.message);
              }
            }

            // Esborra carpeta de sessió si ha quedat buida
            try {
              const remaining = fs.readdirSync(entryPath).filter(f => f.endsWith('.webp') || f.endsWith('.jpg'));
              if (remaining.length === 0) {
                fs.rmdirSync(entryPath);
              }
            } catch (_) { /* buit */ }
          } else if (entry.endsWith('.webp') || entry.endsWith('.jpg')) {
            // Imatge directa (legacy)
            try {
              if (now - stat.mtimeMs > maxAgeMs) {
                fs.unlinkSync(entryPath);
                deletedCount++;
              }
            } catch (e) {
              logger.error(`[screenshots] Error processant ${entryPath}:`, e.message);
            }
          }
        } catch (_) { /* fitxer inabastable */ }
      }

      // Esborra carpeta de màquina si ha quedat buida
      try {
        const remaining = fs.readdirSync(machineDir).filter(e => e !== 'sessions.json');
        if (remaining.length === 0) {
          try { fs.unlinkSync(path.join(machineDir, 'sessions.json')); } catch (_) {}
          fs.rmdirSync(machineDir);
        }
      } catch (_) { /* buit */ }
    }

    // Esborra carpeta d'alumne si ha quedat buida
    try {
      const remaining = fs.readdirSync(alumneDir);
      if (remaining.length === 0) {
        fs.rmdirSync(alumneDir);
      }
    } catch (_) { /* buit */ }
  }

  logger.info(`[screenshots] Neteja completada: ${deletedCount} imatges esborrades`);
  return deletedCount;
}

/**
 * Llista totes les màquines i sessions amb captures per a un alumne.
 * @param {string} alumne
 * @returns {Object} { alumne, machines: { machineId: { sessions: [...] } } }
 */
function listScreenshotsByAlumne(alumne) {
  const alumneDir = path.join(screenshotsDir, alumne);
  const result = { alumne, machines: {} };

  if (!fs.existsSync(alumneDir)) return result;

  const machines = fs.readdirSync(alumneDir);
  for (const machineId of machines) {
    const machineDir = path.join(alumneDir, machineId);
    if (!fs.statSync(machineDir).isDirectory()) continue;

    const sessions = [];
    const sessionMetaFromFile = sessionsHistoryService.getSessions(alumne, machineId);
    const sessionMetaMap = {};
    for (const meta of sessionMetaFromFile) {
      sessionMetaMap[meta.sessionId] = meta;
    }

    const entries = fs.readdirSync(machineDir);
    for (const entry of entries) {
      const entryPath = path.join(machineDir, entry);
      try {
        const stat = fs.statSync(entryPath);
        if (stat.isDirectory()) {
          const images = fs.readdirSync(entryPath)
            .filter(f => f.endsWith('.webp') || f.endsWith('.jpg'))
            .map(f => {
              const fileStat = fs.statSync(path.join(entryPath, f));
              return {
                filename: f,
                timestamp: new Date(parseInt(f.split('.')[0])).toISOString(),
                size: fileStat.size,
                url: `/api/v1/screenshots/${alumne}/${machineId}/${entry}/${f}`,
              };
            })
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

          const meta = sessionMetaMap[entry] || {};
          sessions.push({
            sessionId: entry,
            user: meta.user || null,
            displayName: meta.displayName || null,
            startedAt: meta.startedAt || null,
            endedAt: meta.endedAt || null,
            active: meta.active || false,
            imageCount: images.length,
            images,
          });
        }
      } catch (_) { /* carpeta inaccessible */ }
    }

    sessions.sort((a, b) => {
      const dateA = new Date(b.startedAt || 0).getTime();
      const dateB = new Date(a.startedAt || 0).getTime();
      return dateA - dateB;
    });

    result.machines[machineId] = { sessions };
  }

  return result;
}

function groupSessionsByOverlap(individualSessions, grupId, marginMs = 5 * 60 * 1000) {
  const sortedSessions = [...individualSessions].sort((a, b) => a.startMs - b.startMs);
  const classSessions = [];

  for (const session of sortedSessions) {
    let classSession = classSessions[classSessions.length - 1];
    if (!classSession || session.startMs > classSession.endMs + marginMs) {
      classSession = {
        groupId: grupId,
        startMs: session.startMs,
        endMs: session.endMs,
        sessions: [],
        images: [],
      };
      classSessions.push(classSession);
    }

    classSession.startMs = Math.min(classSession.startMs, session.startMs);
    classSession.endMs = Math.max(classSession.endMs, session.endMs);
    classSession.sessions.push({
      alumne: session.alumne,
      studentName: session.studentName,
      machineId: session.machineId,
      sessionId: session.sessionId,
      user: session.user,
      displayName: session.displayName,
      userLabel: session.userLabel,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      imageCount: session.images.length,
    });
    classSession.images.push(...session.images);
  }

  return classSessions
    .map(classSession => {
      const { startMs, endMs, ...data } = classSession;
      const usersConnected = new Set(data.sessions.map(session => session.alumne)).size;
      data.startedAt = new Date(startMs).toISOString();
      data.endedAt = new Date(endMs).toISOString();
      data.id = `${startMs}-${endMs}`;
      data.usersConnected = usersConnected;
      data.images.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
      return data;
    })
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
}

/**
 * Descobreix les sessions de classe a partir de les sessions individuals
 * de les màquines del grup. Un marge de cinc minuts uneix sessions contigües.
 */
async function listClassScreenshotSessions(grupId) {
  const { getGrupAlumnesList } = require('./alumneService');
  const grups = await getGrupAlumnesList();
  const grup = grups[grupId];
  if (!grup) return null;

  const individualSessions = [];
  for (const [alumne, alumneInfo] of Object.entries(grup.alumnes || {})) {
    const alumneData = listScreenshotsByAlumne(alumne);
    for (const [machineId, machineData] of Object.entries(alumneData.machines)) {
      for (const session of machineData.sessions || []) {
        const images = session.images || [];
        if (images.length === 0) continue;

        const imageTimes = images
          .map(image => Date.parse(image.timestamp))
          .filter(Number.isFinite)
          .sort((a, b) => a - b);
        if (imageTimes.length === 0) continue;

        const startedAt = Date.parse(session.startedAt) || imageTimes[0];
        const endedAt = Date.parse(session.endedAt) || imageTimes[imageTimes.length - 1];
        const temporaryUser = session.displayName || session.user || null;

        individualSessions.push({
          alumne,
          studentName: [alumneInfo.nom, alumneInfo.cognoms].filter(Boolean).join(' ') || alumne,
          machineId,
          sessionId: session.sessionId,
          user: session.user || null,
          displayName: session.displayName || null,
          userLabel: temporaryUser || alumne,
          startedAt: new Date(startedAt).toISOString(),
          endedAt: new Date(Math.max(startedAt, endedAt)).toISOString(),
          startMs: startedAt,
          endMs: Math.max(startedAt, endedAt),
          images: images.map(image => ({
            ...image,
            alumne,
            machineId,
            sessionId: session.sessionId,
            userLabel: temporaryUser || alumne,
          })),
        });
      }
    }
  }

  return groupSessionsByOverlap(individualSessions, grupId);
}

/**
 * Programa la neteja de captures antigues cada dia a les 20:00.
 * @returns {CronJob} Instància del job
 */
function scheduleScreenshotsCleanup() {
  const job = new CronJob(
    '0 0 20 * * *',
    cleanupOldScreenshots,
    null,
    true,
    'Europe/Madrid'
  );
  logger.info('[screenshots] Scheduled cleanup daily at 20:00 (Europe/Madrid)');
  return job;
}

module.exports = {
  saveScreenshot,
  applyBufferLimit,
  cleanupOldScreenshots,
  scheduleScreenshotsCleanup,
  listScreenshotsByAlumne,
  listClassScreenshotSessions,
  groupSessionsByOverlap,
};
