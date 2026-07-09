const fs = require('fs');
const path = require('path');
const { CronJob } = require('cron');
const { logger } = require('../logger');

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

/**
 * Desa una captura de pantalla al disc.
 * @param {string} alumne - Nom de l'alumne
 * @param {string} machineId - ID de la màquina (MAC)
 * @param {string} filename - Nom del fitxer (timestamp.webp)
 * @param {Buffer} buffer - Buffer de la imatge WebP
 * @returns {string} Ruta absoluta del fitxer desat
 */
function saveScreenshot(alumne, machineId, filename, buffer) {
  const machineDir = getMachineDir(alumne, machineId);
  ensureDir(machineDir);

  const filePath = path.join(machineDir, filename);
  fs.writeFileSync(filePath, buffer);

  logger.debug(`[screenshots] Desa: ${alumne}/${machineId}/${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);

  // Aplica el límit del buffer després de desar
  applyBufferLimit(alumne, machineId);

  return filePath;
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

  const files = fs.readdirSync(machineDir)
    .filter(f => f.endsWith('.webp') || f.endsWith('.jpg'))
    .map(f => ({
      name: f,
      path: path.join(machineDir, f),
      mtime: fs.statSync(path.join(machineDir, f)).mtime.getTime(),
    }))
    .sort((a, b) => a.mtime - b.mtime); // mes antics primer

  while (files.length > limit) {
    const oldest = files.shift();
    try {
      fs.unlinkSync(oldest.path);
      logger.debug(`[screenshots] Buffer limit: esborrat ${alumne}/${machineId}/${oldest.name}`);
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

  // Recorre alumne/machineId/
  const alumnes = fs.readdirSync(screenshotsDir);
  for (const alumne of alumnes) {
    const alumneDir = path.join(screenshotsDir, alumne);
    if (!fs.statSync(alumneDir).isDirectory()) continue;

    const machines = fs.readdirSync(alumneDir);
    for (const machineId of machines) {
      const machineDir = path.join(alumneDir, machineId);
      if (!fs.statSync(machineDir).isDirectory()) continue;

      const files = fs.readdirSync(machineDir).filter(f => f.endsWith('.webp') || f.endsWith('.jpg'));
      for (const file of files) {
        const filePath = path.join(machineDir, file);
        try {
          const stat = fs.statSync(filePath);
          if (now - stat.mtimeMs > maxAgeMs) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        } catch (e) {
          logger.error(`[screenshots] Error processant ${filePath}:`, e.message);
        }
      }

      // Esborra carpeta de màquina si ha quedat buida
      try {
        const remaining = fs.readdirSync(machineDir).filter(f => f.endsWith('.webp') || f.endsWith('.jpg'));
        if (remaining.length === 0) {
          fs.rmdirSync(machineDir);
        }
      } catch (_) { /* buit intencionadament */ }
    }

    // Esborra carpeta d'alumne si ha quedat buida
    try {
      const remaining = fs.readdirSync(alumneDir);
      if (remaining.length === 0) {
        fs.rmdirSync(alumneDir);
      }
    } catch (_) { /* buit intencionadament */ }
  }

  logger.info(`[screenshots] Neteja completada: ${deletedCount} imatges esborrades`);
  return deletedCount;
}

/**
 * Programa la neteja de captures antigues cada hora en punt.
 * @returns {CronJob} Instància del job (per poder aturar-lo al shutdown)
 */
function scheduleScreenshotsCleanup() {
  const job = new CronJob(
    '0 0 20 * * *', // cada dia a les 20:00
    cleanupOldScreenshots,
    null,
    true,
    'Europe/Madrid'
  );
  logger.info('[screenshots] Scheduled cleanup daily at 20:00 (Europe/Madrid)');
  return job;
}

module.exports = { saveScreenshot, applyBufferLimit, cleanupOldScreenshots, scheduleScreenshotsCleanup };
