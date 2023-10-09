const express = require("express");
const router = express.Router();

const validacioController = require("../../controllers/validacioController");
const alumneController = require("../../controllers/alumneController");
const normaController = require("../../controllers/normaController");
const infoController = require("../../controllers/infoController");

//router.get("/historials", historialController.getHistorials);
//router.get("/historials?venda=[DATA-VENDA]", historialController.getHistorials);
//router.get("/historials?disponible", historialController.getHistorials);
//router.get("/historials/:id", historialController.getHistorial);
//router.post("/historials", historialController.postHistorial);
//router.patch("/historials", historialController.modifyHistorial);
//router.delete("/historials/:id", historialController.deleteHistorial);

router.post("/validacio", validacioController.postValidacio);
router.post("/alumne", alumneController.postAlumne);
router.post("/norma", normaController.postNorma);
router.post("/info", infoController.postInfo);
module.exports = router;
