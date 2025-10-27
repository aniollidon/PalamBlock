// In src/index.js
require("dotenv").config();

const path = require("path");
const express = require("express");
const v1Router = require("./api/v1/routes");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");
const initializeAdminWebSocket = require("./ws/ws-admin");
const initializeCastWebSocket = require("./ws/ws-cast");
const initializeExtentionWebSocket = require("./ws/ws-extention");
const initializeOSWebSocket = require("./ws/ws-os");
const logger = require("./logger").logger;

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;
const mongoString = process.env.DATABASE_URL;

// connect to the database
mongoose.connect(mongoString);

const database = mongoose.connection;

database.on("error", (error) => {
  logger.error(error);
});

database.once("connected", () => {
  logger.info("Database Connected");
});

// API
app.use(cors());
app.use(bodyParser.json());
// Redirigeix l'arrel a /admin
app.get("/", (req, res) => res.redirect("/admin"));
app.use("/api/v1", v1Router);
app.use("/admin", express.static(path.join(__dirname, "/public/admin")));
app.use("/privacy", express.static(path.join(__dirname, "/public/privacy")));
app.use("/cast", express.static(path.join(__dirname, "/public/cast"))); // TODO: Algun moment ho tancaré

// WebSocket
initializeAdminWebSocket(server);
initializeExtentionWebSocket(server);
// Primer cast per poder consultar emissions des de ws-os
initializeCastWebSocket(server);
initializeOSWebSocket(server);

server.listen(PORT, () => {
  logger.info(`Server is listening on port ${PORT}`);
});

// Gestió de tancament del servidor
const { getInstance: getTokenManager } = require("./services/authTokenManager");

function gracefulShutdown(signal) {
  logger.info(`${signal} rebut. Tancant el servidor...`);

  // Tanca el servidor HTTP
  server.close(() => {
    logger.info("Servidor HTTP tancat");

    // Neteja el TokenManager
    const tokenManager = getTokenManager();
    tokenManager.destroy();

    // Tanca la connexió a la base de dades
    mongoose.connection.close(false, () => {
      logger.info("Connexió a MongoDB tancada");
      process.exit(0);
    });
  });

  // Força el tancament després de 10 segons
  setTimeout(() => {
    logger.error("Forçant tancament del servidor després de 10 segons");
    process.exit(1);
  }, 10000);
}

// Escolta senyals de tancament
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Gestió d'errors no capturats
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});
