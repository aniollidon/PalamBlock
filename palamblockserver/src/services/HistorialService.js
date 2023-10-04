const db = require("../database/Historials");

function save(alumne, timestamp, host, protocol, search, pathname, title) {
    db.addHistorial(alumne, timestamp, host, protocol, search, pathname, title);
}

module.exports = {
    save
};
