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

    if(!alumne || !browser || !tabId) {
        res.status(500).send({ status: "ERROR", data: "Falten dades de la info. Cal especificar alumne, browser i tabId" })
        return;
    }

    if(action !== "active" && action !== "close" && action !== "update") {
        res.status(500).send({status: "ERROR", data: "Action incorrecte. Ha de ser active, close o update"});
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

    if (!alumne || !browser || !tabsInfos || !activeTab) {
        res.status(500).send({ status: "ERROR", data: "Falten dades de la info. Cal especificar alumne, browser, tabsInfos i activeTab" });
        return;
    }

    infoService.registerBrowserInfo(alumne, browser, tabsInfos, activeTab, timestamp);

    res.send({ status: "OK", actions: infoService.getBrowserPendingActions(alumne, browser) });
}

function getAlumnesActivity() {
    return infoService.getAlumnesActivity();
}

function registerOnUpdateCallback(callback) {
    if(!callback) return;
    infoService.registerOnUpdateCallback(callback);
}

function remoteCloseTab(alumne, browser, tab) {
    if(!alumne || !browser || !tab) return;
    infoService.remoteCloseTab(alumne, browser, tab);
}

function normesWebHasChanged() {
    infoService.normesWebHasChanged();
}

const validateHistoryBrowsersAPI = (req, res) => {
    const alumne = req.params.alumneId;
    const { body } = req;
    const history = body.history;

    if(!alumne) {
        res.status(500).send({status: "ERROR", data: "Falten dades de la info. Cal especificar alumne"});
        return;
    }

    const news = infoService.checkBrowserHistorial(alumne, history);
    res.send({news: news});
}

module.exports = {
    postTabInfoAPI,
    postBrowserInfoAPI,
    getAlumnesActivity,
    registerOnUpdateCallback,
    remoteCloseTab,
    normesWebHasChanged,
    validateHistoryBrowsersAPI
}
