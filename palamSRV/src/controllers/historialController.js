const historialService = require("../services/historialService")

async function getHistorial(alumne, offset= undefined){
    return historialService.getHistorial(alumne, offset);
}

module.exports = {
    getHistorial
}