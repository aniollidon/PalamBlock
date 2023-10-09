const db = require("../database/db");

function save(alumne, timestamp, host, protocol, search, pathname, title, browser, tab_id, incognito) {
    db.Historial.create({
        alumneid: alumne,
        timestamp: timestamp,
        host: host,
        protocol: protocol,
        search: search,
        pathname: pathname,
        title: title,
        browser: browser,
        tab_id: tab_id,
        incognito: incognito
    });
}

module.exports = {
    save
};
