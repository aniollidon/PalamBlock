const express = require("express");
const router = express.Router();

const validacioController = require("../../controllers/validacioController");
const alumneController = require("../../controllers/alumneController");
const normaController = require("../../controllers/normaController");
const infoController = require("../../controllers/infoController");
const adminController = require("../../controllers/adminController");


router.post("/alumne", alumneController.postAlumneAPI); // TODO mantenir endpoint (única manera de crear alumnes)
router.post("/alumne/auth", alumneController.autentificaAlumneAPI); // TODO mantenir endpoint
router.post("/admin/login", adminController.autentificaAdminAPI); // TODO mantenir endpoint

router.post("/alumne/:alumneId/validate/history", infoController.validateHistoryBrowsersAPI); // TODO deprecated?
router.post("/validacio/tab", validacioController.postValidacioAPI);
router.post("/info/tab", infoController.postTabInfoAPI);
router.post("/info/browser", infoController.postBrowserInfoAPI);

router.post("/validacio/apps", validacioController.postAppsAPI); // TODO Deprecated (únic endpoint)

module.exports = router;
