const db = require("../database/db");

function saveWeb(alumne, timestamp, host, protocol, search, pathname, title, browser, tabId, incognito, favicon) {
    return db.HistorialWeb.create({
        alumneid: alumne,
        timestamp: timestamp,
        host: host,
        protocol: protocol,
        search: search,
        pathname: pathname,
        title: title,
        browser: browser,
        tabId: tabId,
        incognito: incognito,
        favicon: favicon
    });
}

function saveApp(alumne, timestamp, processName, processPath, caption, iconB64) {
    return db.HistorialApps.create({
        alumneid: alumne,
        timestamp: timestamp,
        processName: processName,
        processPath: processPath,
        caption: caption,
        iconB64: iconB64
    });
}

function getHistorialWeb(alumne, offset = undefined) {
    if (offset)
        return db.HistorialWeb.find({alumneid: alumne}).sort({timestamp: -1}).skip(offset).limit(50);
    else
        return db.HistorialWeb.find({alumneid: alumne}).sort({timestamp: -1}).limit(50);
}

function getHistorialApps(alumne, offset = undefined) {
    if (offset)
        return db.HistorialApps.find({alumneid: alumne}).sort({timestamp: -1}).skip(offset).limit(50);
    else
        return db.HistorialApps.find({alumneid: alumne}).sort({timestamp: -1}).limit(50);
}

module.exports = {
    saveWeb,
    getHistorialWeb,
    getHistorialApps,
    saveApp
};
