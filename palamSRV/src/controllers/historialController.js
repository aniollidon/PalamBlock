const historialService = require("../services/historialService")

async function getHistorialWeb(alumne, offset= undefined){
    return historialService.getHistorialWeb(alumne, offset);
}

async function getHistorialApps(alumne, offset= undefined){
    return historialService.getHistorialApps(alumne, offset);
}

module.exports = {
    getHistorialWeb,
    getHistorialApps
}