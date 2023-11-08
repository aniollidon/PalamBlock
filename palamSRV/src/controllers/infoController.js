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
    const windowId = req.body.windowId;
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
        infoService.registerTabAction(action, alumne, timestamp, host, protocol, search, pathname, title, browser, windowId, tabId, incognito, favicon, active, audible);
        if(action === "update") {
            historialService.saveWeb(alumne, timestamp, host, protocol, search, pathname, title, browser, tabId, incognito, favicon);
        }
    }

    res.send({ status: "OK", actions: infoService.getBrowserPendingActions(alumne, browser) });
}

const postBrowserInfoAPI = (req, res) => {
    const alumne = req.body.alumne;
    const browser = req.body.browser;
    const timestamp = new Date();
    const tabsInfos = req.body.tabsInfos;
    const activeTab = req.body.activeTab;

    if (!alumne || !browser) {
        res.status(500).send({ status: "ERROR", data: "Falten dades de la info. Cal especificar alumne, browser." })
        return;
    }

    infoService.registerBrowserInfo(alumne, browser, tabsInfos, activeTab, timestamp);

    res.send({ status: "OK", actions: infoService.getBrowserPendingActions(alumne, browser) });
}

function getAlumnesActivity() {
    return infoService.getAlumnesActivity();
}

function registerOnUpdateCallback(callback) {
    infoService.registerOnUpdateCallback(callback);
}

function remoteCloseTab(alumne, browser, tab) {
    infoService.remoteCloseTab(alumne, browser, tab);
}

function normesWebHasChanged() {
    infoService.normesWebHasChanged();
}

const operaHasInfoAPI = (req, res) => {
    const alumne = req.params.alumneId;
    const caption = req.query.caption;
    const since = req.query.since;

    if(!alumne) {
        res.status(500).send({status: "ERROR", data: "Falten dades de la info. Cal especificar alumne"});
        return;
    }

    const news = infoService.operaHasInfo(alumne, caption, since);
    res.send({news: news});
}

module.exports = {
    postTabInfoAPI,
    postBrowserInfoAPI,
    getAlumnesActivity,
    registerOnUpdateCallback,
    remoteCloseTab,
    normesWebHasChanged,
    operaHasInfoAPI
}
