const infoService = require("../services/infoService");
const historialService = require("../services/historialService");
const {WebPage, BrowserDetails, TabDetails} = require("../services/structures");
const {logger} = require("../logger");
const validacioService = require("../services/validacioService");

const postTabInfoAPI = (req, res) => { //DEPRECATED
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

    if (!alumne || !browser || !tabId) {
        res.status(500).send({
            status: "ERROR",
            data: "Falten dades de la info. Cal especificar alumne, browser i tabId"
        })
        return;
    }

    if (action !== "active" && action !== "close" && action !== "update") {
        res.status(500).send({status: "ERROR", data: "Action incorrecte. Ha de ser active, close o update"});
        return;
    }

    const browserDetails = new BrowserDetails(alumne, browser, "1.0", "API");
    const tabDetails = new TabDetails(tabId, new WebPage(host, protocol, search, pathname, title, favicon), windowId, incognito, active, audible);

    if (action === "active" || action === "close" || action === "update") {
        infoService.registerTab(action, browserDetails, tabDetails, timestamp);
        if (action === "update") {
            historialService.saveWeb(browserDetails, tabDetails, timestamp);
        }
    }

    res.send({status: "OK", actions: infoService.getBrowserPendingActions(alumne, browser)});
}

const postBrowserInfoAPI = (req, res) => {
    const alumne = req.body.alumne;
    const browser = req.body.browser;
    const timestamp = new Date();
    const tabsInfos = req.body.tabsInfos;
    const activeTab = req.body.activeTab;

    if (!alumne || !browser || !tabsInfos || !activeTab) {
        res.status(500).send({
            status: "ERROR",
            data: "Falten dades de la info. Cal especificar alumne, browser, tabsInfos i activeTab"
        });
        return;
    }

    const browserDetails = new BrowserDetails(alumne, browser, "1.0", "API");
    const structuredTabsInfos = {};

    for (const tabId in tabsInfos) {
        const tab = tabsInfos[tabId];
        structuredTabsInfos[tabId] = new TabDetails(tab.tabId, new WebPage(tab.host, tab.protocol, tab.search, tab.pathname, tab.title, tab.favicon), tab.windowId, tab.incognito, tab.active, tab.audible);
    }
    infoService.registerBrowser(browserDetails, structuredTabsInfos, activeTab, timestamp);

    res.send({status: "OK", actions: infoService.getBrowserPendingActions(alumne, browser)});
}

const postMachineInfoAPI = (req, res) => {
    const alumne = req.body.alumne;
    const timestamp = new Date();
    const currentIp = req.body.currentIp;

    if (!alumne || !currentIp) {
        res.status(500).send({
            status: "ERROR",
            data: "Falten dades de la info. Cal especificar alumne i currentIp"
        });
        return;
    }

    infoService.registerMachine(alumne, currentIp, timestamp);
}

const postTabInfoWS = (sid, msg) => {
    const action = msg.action;
    const timestamp = new Date();

    const webPage = new WebPage(msg.host, msg.protocol, msg.search, msg.pathname, msg.title, msg.favicon);
    const browserDetails = new BrowserDetails(msg.alumne, msg.browser, msg.extVersion, sid);
    const tabDetails = new TabDetails(msg.tabId, webPage, msg.windowId, msg.incognito, msg.active, msg.audible);

    if (action !== "active" && action !== "close" && action !== "update" && action !== "complete") {
        return;
    }

    logger.trace("postTabInfoWS: " + action + " " + browserDetails.toString() + " " + tabDetails.toString() + " at:" + timestamp);

    if (action === "complete") {
        const validacioAlumne = new validacioService.Validacio(msg.alumne);
        const validacio = validacioAlumne.checkWeb(webPage);

        validacio.then((status) => {
            tabDetails.pbStatus = status;
            infoService.registerTab("complete", browserDetails, tabDetails, timestamp);
            infoService.remoteSetTabStatus(browserDetails, tabDetails.tabId, status);
            historialService.saveWeb(browserDetails, tabDetails, timestamp).catch((err) => {
                logger.error(err);
            });

        }).catch((err) => {
            logger.error(err);
        });
    } else {
        infoService.registerTab(action, browserDetails, tabDetails, timestamp);

        if (action === "update") {
            historialService.saveWeb(browserDetails, tabDetails, timestamp);
        }
    }
}

const postBrowserInfoWS = async (sid, msg) => {
    const timestamp = new Date();
    const tabsInfos = msg.tabsInfos;
    const browserDetails = new BrowserDetails(msg.alumne, msg.browser, msg.extVersion, sid);
    const structuredTabsInfos = {};

    const validacioAlumne = new validacioService.Validacio(msg.alumne);

    for (const tabId in tabsInfos) {
        const tab = tabsInfos[tabId];
        const webPage = new WebPage(tab.host, tab.protocol, tab.search, tab.pathname, tab.title, tab.favicon);
        const status = await validacioAlumne.checkWeb(webPage);
        structuredTabsInfos[tabId] = new TabDetails(tab.tabId, webPage, tab.windowId, tab.incognito, tab.active, tab.audible, status);

        infoService.remoteSetTabStatus(browserDetails, structuredTabsInfos[tabId].tabId, status);
    }
    logger.trace("postBrowserInfoWS: " + browserDetails.toString() + " at:" + timestamp);
    infoService.registerBrowser(browserDetails, structuredTabsInfos, msg.activeTab, timestamp);
}

const disconnectBrowserWS = (sid) => {
    const timestamp = new Date();

    logger.trace("disconnectBrowserWS: " + sid + " at:" + timestamp);
    infoService.unregisterBrowser(sid, timestamp);
}

function getAlumnesActivity() {
    return infoService.getAlumnesActivity();
}

function registerOnUpdateCallback(callback) {
    if (!callback) return;
    infoService.registerOnUpdateCallback(callback);
}

function remoteCloseTab(alumne, browser, tab) {
    if (!alumne || !browser || !tab) return;
    infoService.remoteCloseTab(alumne, browser, tab);
}

function normesWebHasChanged() { //DEPRECATED
    infoService.normesWebHasChanged();
}

function registerActionListenerBrowserWS(sid, msg, callback) {
    if (!callback) return;
    const browserDetails = new BrowserDetails(msg.alumne, msg.browser, msg.extVersion, sid);
    infoService.registerActionListener(browserDetails, callback);
}

function sendMessageToAlumne(alumne, msg) {
    infoService.sendMessageToAlumne(alumne, msg);
}

module.exports = {
    postTabInfoAPI,
    postBrowserInfoAPI,
    postMachineInfoAPI,
    postTabInfoWS,
    postBrowserInfoWS,
    getAlumnesActivity,
    registerOnUpdateCallback,
    remoteCloseTab,
    normesWebHasChanged,
    disconnectBrowserWS,
    registerActionListenerBrowserWS,
    sendMessageToAlumne,
}
