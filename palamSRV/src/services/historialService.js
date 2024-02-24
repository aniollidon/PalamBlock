const db = require("../database/db");
const logger = require("../logger").logger;

function saveWeb(browserDetails, tabDetails, timestamp) {
    if(tabDetails.webPage.protocol.includes("chrome")) return new Promise((resolve, reject) => {resolve();});
    if(tabDetails.webPage.protocol.includes("edge")) return new Promise((resolve, reject) => {resolve();});
    if(tabDetails.webPage.protocol.includes("secure")) return new Promise((resolve, reject) => {resolve();});
    if(tabDetails.webPage.protocol.includes("about")) return new Promise((resolve, reject) => {resolve();});

    // Si fa menys de 5 minuts, i és el mateix web actualitzem
    return db.HistorialWeb.findOneAndUpdate({
        alumneid: browserDetails.owner,
        tabId: tabDetails.tabId,
        browser: browserDetails.browser,
        protocol: tabDetails.webPage.protocol,
        host: tabDetails.webPage.host,
        pathname: tabDetails.webPage.pathname,
        search: tabDetails.webPage.search,
        timestamp: {
            $gte: new Date(Date.now() - 5 * 60 * 1000),
        }
    }, {
        title: tabDetails.webPage.title,
        incognito: tabDetails.incognito,
        favicon: tabDetails.webPage.favicon,
        pbAction: tabDetails.pbStatus
    }, {
        new: true
    }).then((doc) => {
        if (!doc) {
            // Si no, creem una nova
            db.HistorialWeb.create({
                alumneid: browserDetails.owner,
                browser: browserDetails.browser,
                timestamp: timestamp,
                protocol: tabDetails.webPage.protocol,
                host: tabDetails.webPage.host,
                pathname: tabDetails.webPage.pathname,
                search: tabDetails.webPage.search,
                title: tabDetails.webPage.title,
                tabId: tabDetails.tabId,
                incognito: tabDetails.incognito,
                favicon: tabDetails.webPage.favicon,
                pbAction: tabDetails.pbStatus
            });
        }
    });
}

function saveApp(alumne, timestamp, processName, processPath, caption, icon, iconType, onTaskBar) {
    logger.debug("saveApp: " + alumne + " " + timestamp + " " + processName + " " + processPath + " " + caption + " " + iconType + " " + onTaskBar);
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
                iconB64: iconType === "base64" ? icon : undefined,
                iconSVG: iconType === "svg" ? icon : undefined,
                onTaskBar: onTaskBar
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

async  function deleteHistorialFromAlumne(alumne) {
    const ret = await db.HistorialWeb.deleteMany({alumneid: alumne});
    const ret2 = await db.HistorialApps.deleteMany({alumneid: alumne});
    logger.info(`Eliminat ${ret.deletedCount} registres web i ${ret2.deletedCount} registres apps de l'alumne ${alumne}`);
}

module.exports = {
    saveWeb,
    getHistorialWeb,
    getHistorialApps,
    deleteHistorialFromAlumne,
    saveApp
};
