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
    const browser_id = req.body.browserId;
    const tab_id = req.body.tabId;
    const incognito = req.body.incognito;
    const favicon = req.body.favicon;

    const timestamp = new Date().toLocaleString("es-CA", { timeZone: "Europe/Madrid" })

    historialService.save(alumne, timestamp, host, protocol, search, pathname, title, browser, tab_id, incognito);
    infoService.register(alumne, timestamp, host, protocol, search, pathname, title, browser, browser_id, tab_id, incognito, favicon);

    const validacioAlumne = new validacioService.Validacio(alumne);
    const validacio = validacioAlumne.check(host, protocol, search, pathname, title);

    validacio.then((status) => {
        console.log("host: " + host + " protocol: " + protocol + " search: " + search + " pathname: " + pathname + " title: " + title + " alumne: " + alumne + " browser: " + browser + " tab_id: " + tab_id + "incognito: " + incognito + " timestamp: " + timestamp);
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
