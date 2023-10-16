const historialService = require("../services/historialService");
const validacioService = require("../services/validacioService");
const infoService = require("../services/infoService");

const postValidacio = (req, res) => {
    const host = req.body.host;
    const protocol = req.body.protocol;
    const search = req.body.search;
    const pathname = req.body.pathname;
    const title = req.body.title;
    const alumne = req.body.alumne;
    const browser = req.body.browser
    const browserId = req.body.browserId;
    const tabId = req.body.tabId;
    const incognito = req.body.incognito;
    const favicon = req.body.favicon;
    const active = req.body.active;

    const timestamp = new Date();

    const validacioAlumne = new validacioService.Validacio(alumne);
    const validacio = validacioAlumne.check(host, protocol, search, pathname, title);

    validacio.then((status) => {
        console.log("host: " + host + " protocol: " + protocol + " search: " + search + " pathname: " + pathname + " title: " + title + " alumne: " + alumne + " browser: " + browser + " tabId: " + tabId + "incognito: " + incognito + " timestamp: " + timestamp);
        console.log("Do: " + status);
        res.status(200).send({ do:status} );
        historialService.save(alumne, timestamp, host, protocol, search, pathname, title, browser, tabId, incognito);
        infoService.register(alumne, timestamp, host, protocol, search, pathname, title, browser, browserId, tabId, incognito, favicon, active, status);

    }).catch((err) => {
        console.error(err);
        res.status(500).send({ error: err });
    });
}


module.exports = {
    postValidacio
};
