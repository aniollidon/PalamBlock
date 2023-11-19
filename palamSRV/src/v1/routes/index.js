const express = require("express");
const router = express.Router();

const validacioController = require("../../controllers/validacioController");
const alumneController = require("../../controllers/alumneController");
const normaController = require("../../controllers/normaController");
const infoController = require("../../controllers/infoController");
const adminController = require("../../controllers/adminController");


router.post("/alumne", alumneController.postAlumneAPI); // TODO moure al socket
router.post("/alumne/:alumneId/validate/history", infoController.validateHistoryBrowsersAPI);
router.post("/alumne/auth", alumneController.autentificaAlumneAPI);
router.post("/norma", normaController.postNormaAPI);
router.post("/validacio/tab", validacioController.postValidacioAPI);
router.post("/info/tab", infoController.postTabInfoAPI);
router.post("/info/browser", infoController.postBrowserInfoAPI);
router.post("/validacio/apps", validacioController.postAppsAPI);
router.post("/admin/login", adminController.autentificaAdminAPI);

module.exports = router;
