const normaService = require('../services/normaService');


function addNorma2Web(who, whoid, severity, mode, webList, enabled_on) {
    if(who === "grup") {
        normaService.creaNorma2WebGrup(whoid, severity, mode, webList, enabled_on).then((alumne) => {
            //logger.info("NormaWeb afegida de grup");
        });
    } else if(who === "alumne"){
        normaService.creaNorma2WebAlumne(whoid, severity, mode, webList, enabled_on).then((alumne) => {
            //logger.info("NormaWeb afegida d'alumne");
        });
    }
}

function addNormaApps(who, whoid, severity, processName, processPath, processPathisRegex) {
    if(who === "grup") {
        normaService.creaNormaGrupApp(whoid, processName, processPath, processPathisRegex, severity).then((alumne) => {
            //logger.info("NormaApp afegida de grup");
        });
    } else if(who === "alumne"){
        normaService.creaNormaAlumneApp(whoid, processName, processPath, processPathisRegex, severity).then((alumne) => {
            //logger.info("NormaApp afegida d'alumne");
        });
    }
}

function updateNorma2Web(who, whoid, normaId, severity, mode, list, enabled_on, alive){
    if(who === "grup") {
        normaService.updateNorma2WebGrup(whoid, normaId, severity, mode, list, enabled_on, alive).then((alumne) => {
            //logger.info("NormaWeb actualitzada de grup");
        });
    } else if(who === "alumne"){
        normaService.updateNorma2WebAlumne(whoid, normaId, severity, mode, list, enabled_on, alive).then((alumne) => {
            //logger.info("NormaWeb actualitzada d'alumne");
        });
    }
}

const getAllNormes2Web = () => {
    return normaService.getAllNormes2Web();
}


const getAllNormesApps = () => {
    return normaService.getAllNormesApps();
}

const removeNorma2Web = (who, whoid, normaid) => {
    normaService.removeNorma2Web(who, whoid, normaid);
}

const removeNormaApp = (who, whoid, normaid) => {
    normaService.removeNormaApp(who, whoid, normaid);
}

const registerOnUpdateCallback = (callback) => {
    normaService.registerOnUpdateCallback(callback);
}

module.exports = {
    addNorma2Web,
    addNormaApps,
    getAllNormes2Web,
    getAllNormesApps,
    removeNorma2Web,
    removeNormaApp,
    updateNorma2Web,
    registerOnUpdateCallback,
}
