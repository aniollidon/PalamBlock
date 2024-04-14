const historialService = require("../services/historialService")

async function getHistorialWeb(alumne, offset= undefined){
    return historialService.getHistorialWeb(alumne, offset);
}

async function getHistorialApps(alumne, offset= undefined){
    return historialService.getHistorialApps(alumne, offset);
}

async function deleteHistorialFromAlumne(alumne){
    return historialService.deleteHistorialFromAlumne(alumne);
}

async function getEachBrowserLastUsage(alumne){
    return historialService.getEachBrowserLastUsage(alumne);
}

async function getHistorialHostsSortedByUsage(alumne, pastDays){
    return historialService.getHistorialHostsSortedByUsage(alumne, pastDays);
}

async function searchHistorialWeb(alumne, search, offset= undefined){
    return historialService.searchHistorialWeb(alumne, search, offset);
}

module.exports = {
    getHistorialWeb,
    getHistorialApps,
    deleteHistorialFromAlumne,
    getEachBrowserLastUsage,
    getHistorialHostsSortedByUsage,
    searchHistorialWeb
}
