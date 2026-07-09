const screenshotsService = require('../services/screenshotsService');
const { logger } = require('../logger');
const { netejaText } = require('./utils');

/**
 * Processa un upload de captura de pantalla via WebSocket.
 * Valida les dades, desa la imatge i envia confirmació al client.
 *
 * @param {Socket} socket - Socket.io del client ws-os
 * @param {Object} data - Metadades { alumne, machineId, filename, timestamp }
 * @param {Buffer} buffer - Buffer de la imatge WebP
 */
function handleScreenshotUpload(socket, data, buffer) {
  try {
    const alumne = netejaText(data.alumne || '');
    const machineId = netejaText(data.machineId || '');
    const filename = netejaText(data.filename || '');

    // Validació de camps obligatoris
    if (!alumne || !machineId || !filename) {
      logger.warn('[screenshots] Upload rebutjat: falten dades', {
        alumne: alumne || '(buit)',
        machineId: machineId || '(buit)',
        filename: filename || '(buit)',
      });
      socket.emit('screenshot_ack', {
        filename: filename || 'unknown',
        status: 'error',
        message: 'Falten dades obligatòries: alumne, machineId o filename',
      });
      return;
    }

    if (!buffer || buffer.length === 0) {
      logger.warn(`[screenshots] Upload rebutjat: buffer buit (${filename})`);
      socket.emit('screenshot_ack', {
        filename,
        status: 'error',
        message: 'Buffer buit',
      });
      return;
    }

    // Validacio del format del nom (timestamp.webp o timestamp.jpg)
    if (!/^\d+\.(webp|jpg)$/.test(filename)) {
      logger.warn(`[screenshots] Upload rebutjat: nom invalid "${filename}"`);
      socket.emit('screenshot_ack', {
        filename,
        status: 'error',
        message: 'Nom de fitxer invalid (format esperat: timestamp.webp o timestamp.jpg)',
      });
      return;
    }

    // Desa la imatge
    screenshotsService.saveScreenshot(alumne, machineId, filename, buffer);

    // Confirma al client
    socket.emit('screenshot_ack', {
      filename,
      status: 'ok',
    });

    logger.debug(`[screenshots] Upload OK: ${alumne}/${machineId}/${filename}`);
  } catch (err) {
    logger.error('[screenshots] Error processant upload:', err);
    try {
      socket.emit('screenshot_ack', {
        filename: (data && data.filename) || 'unknown',
        status: 'error',
        message: err.message || 'Error intern del servidor',
      });
    } catch (_) { /* socket pot estar tancat */ }
  }
}

module.exports = { handleScreenshotUpload };
