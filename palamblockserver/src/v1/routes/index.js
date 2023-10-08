const express = require("express");
const router = express.Router();

//const historialController = require("../../controllers/Historials");
const validacioController = require("../../controllers/validacioController");
const alumneController = require("../../controllers/alumneController");
const normaController = require("../../controllers/normaController");

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
module.exports = router;
