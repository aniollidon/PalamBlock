const screenshotsService = require('../services/screenshotsService');
const { logger } = require('../logger');
const { netejaText } = require('./utils');
const path = require('path');

// Ruta base per servir imatges
const screenshotsDir = path.join(__dirname, '../../screenshots');

/**
 * Processa un upload de captura de pantalla via WebSocket.
 */
function handleScreenshotUpload(socket, data, buffer) {
  try {
    const alumne = netejaText(data.alumne || '');
    const machineId = netejaText(data.machineId || '');
    const filename = netejaText(data.filename || '');
    const sessionId = netejaText(data.sessionId || '');

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
      socket.emit('screenshot_ack', { filename, status: 'error', message: 'Buffer buit' });
      return;
    }

    if (!/^\d+\.(webp|jpg)$/.test(filename)) {
      logger.warn(`[screenshots] Upload rebutjat: nom invalid "${filename}"`);
      socket.emit('screenshot_ack', {
        filename,
        status: 'error',
        message: 'Nom de fitxer invalid (format esperat: timestamp.webp o timestamp.jpg)',
      });
      return;
    }

    screenshotsService.saveScreenshot(alumne, machineId, filename, buffer, sessionId || undefined);

    socket.emit('screenshot_ack', { filename, status: 'ok' });

    logger.debug(`[screenshots] Upload OK: ${alumne}/${machineId}/${sessionId || 'legacy'}/${filename}`);
  } catch (err) {
    logger.error('[screenshots] Error processant upload:', err);
    try {
      socket.emit('screenshot_ack', {
        filename: (data && data.filename) || 'unknown',
        status: 'error',
        message: err.message || 'Error intern del servidor',
      });
    } catch (_) {}
  }
}

/**
 * GET /api/v1/screenshots/:alumne
 * Llista màquines i sessions amb captures per a un alumne.
 */
function listScreenshots(req, res) {
  try {
    const alumne = netejaText(req.params.alumne || '');
    if (!alumne) {
      return res.status(400).json({ status: 'ERROR', message: 'Cal especificar alumne' });
    }

    const data = screenshotsService.listScreenshotsByAlumne(alumne);
    res.json({ status: 'OK', data });
  } catch (err) {
    logger.error('[screenshots] Error listant:', err);
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
}

/**
 * GET /api/v1/screenshots/:alumne/:machineId/:sessionId
 * Llista les imatges d'una sessió concreta.
 */
function listSessionImages(req, res) {
  try {
    const alumne = netejaText(req.params.alumne || '');
    const machineId = netejaText(req.params.machineId || '');
    const sessionId = netejaText(req.params.sessionId || '');

    if (!alumne || !machineId || !sessionId) {
      return res.status(400).json({ status: 'ERROR', message: 'Cal especificar alumne, machineId i sessionId' });
    }

    const sessionDir = path.join(screenshotsDir, alumne, machineId, sessionId);
    if (!require('fs').existsSync(sessionDir)) {
      return res.json({ status: 'OK', data: { alumne, machineId, sessionId, images: [] } });
    }

    const fs = require('fs');
    const images = fs.readdirSync(sessionDir)
      .filter(f => f.endsWith('.webp') || f.endsWith('.jpg'))
      .map(f => {
        const stat = fs.statSync(path.join(sessionDir, f));
        return {
          filename: f,
          timestamp: new Date(parseInt(f.split('.')[0])).toISOString(),
          size: stat.size,
          url: `/api/v1/screenshots/${alumne}/${machineId}/${sessionId}/${f}`,
        };
      })
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({ status: 'OK', data: { alumne, machineId, sessionId, images } });
  } catch (err) {
    logger.error('[screenshots] Error listant imatges:', err);
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
}

/**
 * GET /api/v1/screenshots/:alumne/:machineId/:sessionId/:filename
 * Serveix el fitxer d'imatge.
 */
function serveScreenshot(req, res) {
  try {
    const alumne = netejaText(req.params.alumne || '');
    const machineId = netejaText(req.params.machineId || '');
    const sessionId = netejaText(req.params.sessionId || '');
    const filename = netejaText(req.params.filename || '');

    if (!alumne || !machineId || !sessionId || !filename) {
      return res.status(400).json({ status: 'ERROR', message: 'Paràmetres insuficients' });
    }

    if (!/^\d+\.(webp|jpg)$/.test(filename)) {
      return res.status(400).json({ status: 'ERROR', message: 'Nom de fitxer invalid' });
    }

    const filePath = path.join(screenshotsDir, alumne, machineId, sessionId, filename);

    if (!require('fs').existsSync(filePath)) {
      return res.status(404).json({ status: 'ERROR', message: 'Imatge no trobada' });
    }

    const ext = path.extname(filename).toLowerCase();
    const contentType = ext === '.webp' ? 'image/webp' : 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.sendFile(filePath);
  } catch (err) {
    logger.error('[screenshots] Error servint imatge:', err);
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
}

module.exports = { handleScreenshotUpload, listScreenshots, listSessionImages, serveScreenshot };
