const infoService = require("../services/infoService");
const historialService = require("../services/historialService");

const postTabInfoAPI = (req, res) => {
    const action = req.body.action;
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
    const audible = req.body.audible;


    const timestamp = new Date();

    if(action !== "active" && action !== "close" && action !== "update") {
        res.status(500).send({status: "ERROR", data: "Action incorrecte. Ha de ser active, close o update"});
        return;
    }

    if (!tabId) {
        res.status(500).send({ status: "ERROR", data: "Falten dades de la info. Cal especificar action i tabId" })
        return;
    }

    if (action === "active" || action === "close" || action === "update") {
        infoService.registerTabAction(action, alumne, timestamp, host, protocol, search, pathname, title, browser, browserId, tabId, incognito, favicon, active, audible);
        if(action === "update") {
            historialService.saveWeb(alumne, timestamp, host, protocol, search, pathname, title, browser, tabId, incognito, favicon);
        }
    }

    res.send({ status: "OK", actions: infoService.getBrowserPendingActions(alumne, browser, browserId) });
}

const postBrowserInfoAPI = (req, res) => {
    const alumne = req.body.alumne;
    const browser = req.body.browser;
    const browserId = req.body.browserId;
    const timestamp = new Date();
    const tabsInfos = req.body.tabsInfos;
    const activeTab = req.body.activeTab;

    if (!alumne || !browser || !browserId) {
        res.status(500).send({ status: "ERROR", data: "Falten dades de la info. Cal especificar alumne, browser, browserId." })
        return;
    }

    infoService.registerBrowserInfo(alumne, browser, browserId, tabsInfos, activeTab, timestamp);

    res.send({ status: "OK", actions: infoService.getBrowserPendingActions(alumne, browser, browserId) });
}

function getAlumnesActivity() {
    return infoService.getAlumnesActivity();
}

function registerOnUpdateCallback(callback) {
    infoService.registerOnUpdateCallback(callback);
}

function remoteCloseTab(alumne, browser, browserId, tab) {
    infoService.remoteCloseTab(alumne, browser, browserId, tab);
}

function normesWebHasChanged() {
    infoService.normesWebHasChanged();
}

module.exports = {
    postTabInfoAPI,
    postBrowserInfoAPI,
    getAlumnesActivity,
    registerOnUpdateCallback,
    remoteCloseTab,
    normesWebHasChanged
}