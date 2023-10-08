const historialService = require("../services/historialService");
const validacioService = require("../services/validacioService");

const postValidacio = (req, res) => {
    const host = req.body.host;
    const protocol = req.body.protocol;
    const search = req.body.search;
    const pathname = req.body.pathname;
    const title = req.body.title;
    const alumne = req.body.alumne;
    const browser = req.body.browser;
    const tab_id = req.body.tabId;

    const timestamp = new Date().toLocaleString("es-CA", { timeZone: "Europe/Madrid" })

    historialService.save(alumne, timestamp, host, protocol, search, pathname, title);

    const validacioAlumne = new validacioService.Validacio(alumne);
    const validacio = validacioAlumne.check(host, protocol, search, pathname, title);

    validacio.then((status) => {
        console.log("host: " + host + " protocol: " + protocol + " search: " + search + " pathname: " + pathname + " title: " + title + " alumne: " + alumne + " browser: " + browser + " tab_id: " + tab_id + " timestamp: " + timestamp);
        console.log("Do: " + status);
        res.status(200).send({ do:status} );
    }).catch((err) => {
        console.error(err);
        res.status(500).send({ error: err });
    });
}


module.exports = {
    postValidacio
};
