const db = require("../database/db");

function save(alumne, timestamp, host, protocol, search, pathname, title) {
    db.Historial.create({
        alumneid: alumne,
        timestamp: timestamp,
        host: host,
        protocol: protocol,
        search: search,
        pathname: pathname,
        title: title
    });
}

module.exports = {
    save
};
