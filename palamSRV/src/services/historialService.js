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

async function getEachBrowserLastUsage(alumne) {
    // Obtenim els últims usos de cada navegador
    const browsers = await db.HistorialWeb.distinct('browser', {alumneid: alumne});
    const lastUsage = {};
    for (const browser of browsers) {
        const last = await db.HistorialWeb.findOne({alumneid: alumne, browser: browser}).sort({timestamp: -1});
        lastUsage[browser] = last.timestamp;
    }

    return lastUsage;
}

async function getHistorialHostsSortedByUsage(alumne, pastDays) {

    const sortedHistorial = await db.HistorialWeb.aggregate([
        {
            $match: {
                alumneid: alumne,
                timestamp: {
                    $gte: new Date(Date.now() - pastDays * 24 * 60 * 60 * 1000)
                }
            }
        },
        {
            $group: {
                _id: {host: "$host"},
                count: {$sum: 1}
            }
        },
        {
            $sort: {count: -1}
        }
    ]).then((result) => {
        return result;
    });

    for (const host of sortedHistorial) {
        host.host = host._id.host;
        delete host._id;
    }

    return sortedHistorial;
}

async function searchHistorialWeb(alumne, query, offset = undefined) {
    let mquery = {};

    if(query.startsWith("host:")){
        // busca només a host
        mquery = {
            alumneid: alumne,
            host: {$regex: query.substring(5), $options: "i"}
        };
    }
    else if(query.startsWith("protocol:")){
        // busca només a protocol
        mquery = {
            alumneid: alumne,
            protocol: {$regex: query.substring(9), $options: "i"}
        };
    }
    else if(query.startsWith("title:")){
        // busca només a title
        mquery = {
            alumneid: alumne,
            title: {$regex: query.substring(6), $options: "i"}
        };
    }
    else if(query.startsWith("pathname:")){
        // busca només a pathname
        mquery = {
            alumneid: alumne,
            pathname: {$regex: query.substring(9), $options: "i"}
        };
    }
    else if(query.startsWith("search:")){
        // busca només a search
        mquery = {
            alumneid: alumne,
            search: {$regex: query.substring(7), $options: "i"}
        };
    }
    else {
        mquery = {
            alumneid: alumne,
            $or: [
                {title: {$regex: query, $options: "i"}},
                {host: {$regex: query, $options: "i"}},
                {pathname: {$regex: query, $options: "i"}},
                {search: {$regex: query, $options: "i"}}
            ]
        };
    }

   //Search query on title, host, pathname or search
    if (offset)
        return db.HistorialWeb.find(mquery).sort({timestamp: -1}).skip(offset).limit(50);
    else
        return db.HistorialWeb.find(mquery).sort({timestamp: -1}).limit(50);
}

module.exports = {
    saveWeb,
    getHistorialWeb,
    getEachBrowserLastUsage,
    getHistorialHostsSortedByUsage,
    searchHistorialWeb,
    getHistorialApps,
    deleteHistorialFromAlumne,
    saveApp
};
