const db = require("../database/db");

function save(alumne, timestamp, host, protocol, search, pathname, title, browser, tabId, incognito, favicon) {
    db.Historial.create({
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

function getHistorial(alumne, offset = undefined) {
    if (offset)
        return db.Historial.find({alumneid: alumne}).sort({timestamp: -1}).skip(offset).limit(50);
    else
        return db.Historial.find({alumneid: alumne}).sort({timestamp: -1}).limit(50);
}
module.exports = {
    save,
    getHistorial
};
