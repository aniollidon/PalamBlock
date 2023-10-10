const infoService = require("../services/infoService");

const postInfo = (req, res) => {
    const alumne = req.body.alumne;
    const action = req.body.action;
    const tabId = req.body.tabId;
    const browser = req.body.browser;
    const browser_id = req.body.browserId;
    const tabsIds = req.body.tabsIds;

    const timestamp = new Date().toLocaleString("es-CA", { timeZone: "Europe/Madrid" });

    if(action !== "active" && action !== "close" && action !== "ping") {
        res.status(500).send({status: "ERROR", data: "Action incorrecte. Ha de ser active, close, ping"});
        return;
    }

    if (!tabId) {
        res.status(500).send({ status: "ERROR", data: "Falten dades de la info. Cal especificar action i tabId" })
        return;
    }

    if(action === "ping" && !tabsIds) {
        res.status(500).send({ status: "ERROR", data: "Falten dades de la info. Cal especificar tabsIds" })
        return;
    }

    if (action === "active" || action === "close")
        infoService.registerAction(alumne, action, tabId, browser, browser_id, timestamp);
    else if (action === "ping")
        infoService.registerPing(alumne, tabsIds, tabId, browser, browser_id, timestamp);

    res.send({ status: "OK" });
}

function getAlumnesBrowsingActivity() {
    return infoService.getAlumnesBrowsingActivity();
}

function registerOnUpdateCallback(callback) {
    infoService.registerOnUpdateCallback(callback);
}

function remoteCloseTab(alumne, browser, browserId, tab) {
    infoService.remoteCloseTab(alumne, browser, browserId, tab);
}

module.exports = {
    postInfo,
    getAlumnesBrowsingActivity,
    registerOnUpdateCallback,
    remoteCloseTab,
}