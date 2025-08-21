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
app.use("/api/v1", v1Router);
app.use("/admin", express.static(path.join(__dirname, "/public/admin")));
app.use("/privacy", express.static(path.join(__dirname, "/public/privacy")));
app.use("/cast", express.static(path.join(__dirname, "/public/cast"))); // TODO: Algun moment ho tancaré

// WebSocket
initializeAdminWebSocket(server);
initializeExtentionWebSocket(server);
initializeOSWebSocket(server);
initializeCastWebSocket(server);

server.listen(PORT, () => {
  logger.info(`Server is listening on port ${PORT}`);
});
