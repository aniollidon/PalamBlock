/**
 * Sessions History Service
 * Persisteix l'historial de sessions d'usuari temporal per màquina.
 * Desa/llegeix fitxers JSON a screenshots/{alumne}/{machineId}/sessions.json
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../logger');

// Ruta base: palamSRV/screenshots/
const screenshotsDir = path.join(__dirname, '../../screenshots');

/**
 * Obté la ruta al fitxer sessions.json d'una màquina.
 * @param {string} alumne
 * @param {string} machineId
 * @returns {string}
 */
function getSessionsFilePath(alumne, machineId) {
  return path.join(screenshotsDir, alumne, machineId, 'sessions.json');
}

/**
 * Llegeix el fitxer sessions.json.
 * @param {string} filePath
 * @returns {Array} Array de sessions (buid si no existeix)
 */
function readSessionsFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    logger.error(`[sessionsHistory] Error llegint ${filePath}:`, err.message);
    return [];
  }
}

/**
 * Escriu el fitxer sessions.json.
 * @param {string} filePath
 * @param {Array} sessions
 */
function writeSessionsFile(filePath, sessions) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(sessions, null, 2), 'utf8');
  } catch (err) {
    logger.error(`[sessionsHistory] Error escrivint ${filePath}:`, err.message);
  }
}

/**
 * Registra l'inici d'una nova sessió.
 * Si ja existia una sessió activa, la tanca automàticament.
 *
 * @param {string} alumne
 * @param {string} machineId
 * @param {Object} sessionData
 * @param {string} sessionData.sessionId - ID únic de la sessió (timestamp ms)
 * @param {string} sessionData.user - Usuari temporal
 * @param {string} sessionData.displayName - Nom a mostrar
 * @param {string} sessionData.startedAt - ISO timestamp d'inici
 */
function saveSession(alumne, machineId, sessionData) {
  if (!alumne || !machineId || !sessionData || !sessionData.sessionId) {
    logger.warn('[sessionsHistory] saveSession: falten dades obligatòries');
    return;
  }

  const filePath = getSessionsFilePath(alumne, machineId);
  const sessions = readSessionsFile(filePath);

  // Tanca qualsevol sessió activa prèvia
  for (const session of sessions) {
    if (session.active) {
      session.active = false;
      session.endedAt = sessionData.startedAt || new Date().toISOString();
    }
  }

  // Afegeix la nova sessió
  sessions.push({
    sessionId: sessionData.sessionId,
    user: sessionData.user || null,
    displayName: sessionData.displayName || null,
    startedAt: sessionData.startedAt || new Date().toISOString(),
    endedAt: null,
    active: true,
  });

  writeSessionsFile(filePath, sessions);
  logger.debug(`[sessionsHistory] Sessió iniciada: ${alumne}/${machineId}/${sessionData.sessionId} (${sessionData.displayName || sessionData.user || 'sense nom'})`);
}

/**
 * Tanca la sessió activa d'una màquina.
 *
 * @param {string} alumne
 * @param {string} machineId
 * @param {string} endedAt - ISO timestamp de fi (opcional, per defecte ara)
 */
function endSession(alumne, machineId, endedAt) {
  if (!alumne || !machineId) return;

  const filePath = getSessionsFilePath(alumne, machineId);
  const sessions = readSessionsFile(filePath);

  const endDate = endedAt || new Date().toISOString();
  let closed = false;

  for (const session of sessions) {
    if (session.active) {
      session.active = false;
      session.endedAt = endDate;
      closed = true;
    }
  }

  if (closed) {
    writeSessionsFile(filePath, sessions);
    logger.debug(`[sessionsHistory] Sessió tancada: ${alumne}/${machineId}`);
  }
}

/**
 * Retorna totes les sessions d'una màquina.
 *
 * @param {string} alumne
 * @param {string} machineId
 * @returns {Array} Array de sessions ordenades per startedAt (més recent primer)
 */
function getSessions(alumne, machineId) {
  if (!alumne || !machineId) return [];

  const filePath = getSessionsFilePath(alumne, machineId);
  const sessions = readSessionsFile(filePath);

  // Ordena per startedAt descendent (més recent primer)
  sessions.sort((a, b) => {
    const dateA = new Date(b.startedAt || 0).getTime();
    const dateB = new Date(a.startedAt || 0).getTime();
    return dateA - dateB;
  });

  return sessions;
}

module.exports = { saveSession, endSession, getSessions };
