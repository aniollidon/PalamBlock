// In src/index.js
require('dotenv').config();

const path = require('path');
const express = require("express");
const v1Router = require("./v1/routes");
const bodyParser = require('body-parser');
const mongoose= require('mongoose');
const cors = require("cors")

const app = express();
const PORT = process.env.PORT || 4000;
const mongoString = process.env.DATABASE_URL;

// connect to the database
mongoose.connect(mongoString);

const database = mongoose.connection;

database.on('error', (error) => {
  console.log(error)
})

database.once('connected', () => {
  console.log('Database Connected');
})


app.use(cors())

app.use(bodyParser.json());
app.use("/api/v1", v1Router);

app.use('/admin', express.static(path.join(__dirname, 'admin')))

app.listen(PORT, () => {
  console.log(`API is listening on port ${PORT}`);
});
