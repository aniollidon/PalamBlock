const historialService = require("../services/historialService");
const validacioService = require("../services/validacioService");
const infoService = require("../services/infoService");
const logger = require("../logger").logger;

const postValidacioAPI = (req, res) => {
    const host = req.body.host;
    const protocol = req.body.protocol;
    const search = req.body.search;
    const pathname = req.body.pathname;
    const title = req.body.title;
    const alumne = req.body.alumne;
    const browser = req.body.browser
    const windowId = req.body.windowId;
    const tabId = req.body.tabId;
    const incognito = req.body.incognito;
    const favicon = req.body.favicon;
    const active = req.body.active;
    const audible = req.body.audible;

    const timestamp = new Date();

    if(!alumne || !browser || !tabId) {
        res.status(500).send({ status: "ERROR", data: "Falten dades de la info. Cal especificar alumne, browser i tabId" })
        return;
    }

    const validacioAlumne = new validacioService.Validacio(alumne);
    const validacio = validacioAlumne.checkWeb(host, protocol, search, pathname, title);

    validacio.then((status) => {
        //logger.info("host: " + host + " protocol: " + protocol + " search: " + search + " pathname: " + pathname + " title: " + title + " alumne: " + alumne + " browser: " + browser + " tabId: " + tabId + "incognito: " + incognito + " timestamp: " + timestamp);
        //logger.info("Do: " + status);
        res.status(200).send({ do:status} );
        historialService.saveWeb(alumne, timestamp, host, protocol, search, pathname, title, browser, tabId, incognito, favicon);
        infoService.register(alumne, timestamp, host, protocol, search, pathname, title, browser, windowId, tabId, incognito, favicon, active, status, audible);

    }).catch((err) => {
        logger.error(err);
        res.status(500).send({ error: err });
    });
}

const postAppsAPI = (req, res) => {
    const apps = req.body.apps;
    const alumne = req.body.alumne;
    const timestamp = new Date();

    if(!alumne || !apps) {
        res.status(500).send({ status: "ERROR", data: "Falten dades de la info. Cal especificar alumne i apps" })
        return;
    }

    const validacioAlumne = new validacioService.Validacio(alumne);
    validacioAlumne.checkApps(apps).then((status) => {
        infoService.registerApps(apps, alumne, status, timestamp);
        for (const app of apps) {
            historialService.saveApp(alumne, timestamp, app.name, app.path, app.title, app.icon, app.iconType);
        }
        res.status(200).send({ do:status} );
    }).catch((err) => {
        logger.error(err);
        res.status(500).send({ error: err });
    });
}

module.exports = {
    postValidacioAPI,
    postAppsAPI
};
