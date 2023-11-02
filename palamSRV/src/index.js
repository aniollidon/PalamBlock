// In src/index.js
require('dotenv').config();

const path = require('path');
const express = require("express");
const v1Router = require("./v1/routes");
const bodyParser = require('body-parser');
const mongoose= require('mongoose');
const http = require('http');
const cors = require("cors")
const initializeWebSocket = require('./v1/ws');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;
const mongoString = process.env.DATABASE_URL;

// connect to the database
mongoose.connect(mongoString);

const database = mongoose.connection;

database.on('error', (error) => {
  console.error(error)
})

database.once('connected', () => {
  console.log('Database Connected');
})


// API
app.use(cors())
app.use(bodyParser.json());
app.use("/api/v1", v1Router);
app.use('/admin', express.static(path.join(__dirname, '/v1/admin')))

// WebSocket
initializeWebSocket(server);

server.listen(PORT, () => {
  console.log(`API is listening on port ${PORT}`);
});


