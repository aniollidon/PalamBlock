const express = require("express");
const router = express.Router();

const validacioController = require("../../../controllers/validacioController");
const alumneController = require("../../../controllers/alumneController");
const normaController = require("../../../controllers/normaController");
const infoController = require("../../../controllers/infoController");
const screenshotsController = require("../../../controllers/screenshotsController");
const adminController = require("../../../controllers/adminController");
const errorController = require("../../../controllers/errorController");

router.post("/alumne", alumneController.postAlumneAPI);
router.post("/alumne/auth", alumneController.autentificaAlumneAPI);
router.post("/alumne/auth/google", alumneController.autentificaAlumneGoogleAPI);
router.get("/alumne/active_whitelist", alumneController.getActiveWhitelistAPI);
router.get("/grup/:grup/ips", alumneController.getGrupIpsAPI);
router.post("/admin/login", adminController.autentificaAdminAPI);

// Screenshots (historial de captures) — autenticació admin via query token
router.get("/screenshots/:alumne", screenshotsController.listScreenshots);
router.get("/screenshots/:alumne/:machineId/:sessionId", screenshotsController.listSessionImages);
router.get("/screenshots/:alumne/:machineId/:sessionId/:filename", screenshotsController.serveScreenshot);

router.post("/validacio/tab", validacioController.postValidacioAPI);
router.post("/info/tab", infoController.postTabInfoAPI);
router.post("/info/browser", infoController.postBrowserInfoAPI);
router.post("/info/machine", infoController.postMachineInfoAPI);

router.post("/error/front", errorController.postErrorLoggingAPI); // TODO mantenir endpoint (debugging)

router.post("/validacio/apps", validacioController.postAppsAPI); // TODO Deprecated (únic endpoint)

module.exports = router;
