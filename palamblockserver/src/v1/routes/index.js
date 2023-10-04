const express = require("express");
const router = express.Router();

//const historialController = require("../../controllers/Historials");
const validacioController = require("../../controllers/Validacio");

router.route("/").get((req, res) => {
  res.send(`<h2>Hello from ${req.baseUrl}</h2>`);
});

//router.get("/historials", historialController.getHistorials);
//router.get("/historials?venda=[DATA-VENDA]", historialController.getHistorials);
//router.get("/historials?disponible", historialController.getHistorials);
//router.get("/historials/:id", historialController.getHistorial);
//router.post("/historials", historialController.postHistorial);
//router.patch("/historials", historialController.modifyHistorial);
//router.delete("/historials/:id", historialController.deleteHistorial);

router.post("/validacio", validacioController.postValidacio);
module.exports = router;
