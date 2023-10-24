// Create small server to handle login requests
const express = require('express');
const killable = require('killable');
const path = require("path");
const {exec} = require('child_process');
const bodyParser = require('body-parser');
const fs = require("fs");
const cors = require("cors")
const axios = require('axios');

const app = express();
const PORT = 3111;
const router = express.Router();

const onAuth = (req, res) => {
    const { body } = req;
    const alumne = body.alumne;
    const clau = body.clau;

    axios.post(process.env.API_PALAMBLOCK + '/alumne/auth', {alumne: alumne, clau: clau})
        .then((response) => {
            if (response.status === 200) {
                res.send('OK');
                //Guardar la informacio de l'usuari
                fs.writeFileSync(path.join(__dirname, 'login.txt'), alumne, 'utf8');
                //Tancar el servidor
                server.kill();
            } else {
                res.status(401).send('FAILED');
            }
        }).catch((error) => {
            if(error.response.status === 401 || error.response.status === 404){
                res.status(401).send('FAILED');
            }
            else
            {
                console.error(error);
                res.status(500).send('ERROR');
            }
    });
}
app.use(cors())
app.use(bodyParser.json());
app.use('/login', express.static(path.join(__dirname, '/login-web')))
app.use('/login/',router);
router.post('/auth', onAuth);

const server = app.listen(PORT, () => {
    console.log(`Login launcher mini server listening at http://localhost:${PORT}`);
});
killable(server);

// On run
exec(`start http://localhost:${PORT}/login`, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error: ${error.message}`);
        return undefined;
    }

    if (stderr) {
        console.error(`Error: ${stderr}`);
        return undefined;
    }
});