const db = require("../database/db");

function save(alumne, timestamp, host, protocol, search, pathname, title, browser, tabId, incognito) {
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
        incognito: incognito
    });
}

module.exports = {
    save
};
