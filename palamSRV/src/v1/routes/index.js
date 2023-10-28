const express = require("express");
const router = express.Router();

const validacioController = require("../../controllers/validacioController");
const alumneController = require("../../controllers/alumneController");
const normaController = require("../../controllers/normaController");
const infoController = require("../../controllers/infoController");

//router.get("/historials", historialController.getHistorials);
//router.get("/historials?venda=[DATA-VENDA]", historialController.getHistorials);
//router.get("/historials?disponible", historialController.getHistorials);
//router.get("/historials/:id", historialController.getHistorialWeb);
//router.post("/historials", historialController.postHistorial);
//router.patch("/historials", historialController.modifyHistorial);
//router.delete("/historials/:id", historialController.deleteHistorial);

router.post("/alumne", alumneController.postAlumneAPI); // TODO moure al socket
router.post("/alumne/auth", alumneController.autentificaAlumneAPI);
router.post("/norma", normaController.postNormaAPI);
router.post("/validacio/tab", validacioController.postValidacioAPI);
router.post("/info/tab", infoController.postTabInfoAPI);
router.post("/info/browser", infoController.postBrowserInfoAPI);
router.post("/validacio/apps", validacioController.postAppsAPI);

module.exports = router;
