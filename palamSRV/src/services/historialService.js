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

    // Fa una hora
    const now = new Date();
    const faUnaHora = new Date(Date.now() - 60 * 60 * 1000)

    // si fa una hora és d'un dia diferent, queda't a les 00:00:00
    if (faUnaHora.getDate() !== now.getDate()) {
        faUnaHora.setHours(0,0,0,0);
    }

    // Si la app ha estat creada o actualitzada en l'última hora del mateix dia només l'actualitzem
    return db.HistorialApps.findOneAndUpdate({
        alumneid: alumne,
        processPath: processPath,
        updatedTimestamp: {
            $gte: faUnaHora,
        }
    }, {
        updatedTimestamp: timestamp
    }, {
        new: true
    }).then((doc) => {
        if (!doc) {
            // Si no, creem una nova
            db.HistorialApps.create({
                alumneid: alumne,
                startedTimestamp: timestamp,
                updatedTimestamp: timestamp,
                processName: processName,
                processPath: processPath,
                caption: caption,
                iconB64: iconB64
            });
        }
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
