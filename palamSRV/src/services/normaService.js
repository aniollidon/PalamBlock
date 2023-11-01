const db = require("../database/db");
let onUpdateCallback = () => {};

async function addNormaWebAlumne(alumneId, severity, mode, hosts_list, protocols_list, searches_list,
                   pathnames_list, titles_list, enabled_on) {

    const norma =  await _creaNormaWeb(severity, mode, hosts_list, protocols_list,
        searches_list, pathnames_list, titles_list, enabled_on);

    const result = await db.Alumne.findOneAndUpdate({alumneId: alumneId}, {$push: {normesWeb: norma}}).populate("normesWeb");
    onUpdateCallback();
    return result;
}

async function creaNormaWebGrup(grupId, severity, mode, hosts_list, protocols_list, searches_list,
                   pathnames_list, titles_list, enabled_on) {

    const norma =  await _creaNormaWeb(severity, mode, hosts_list, protocols_list,
        searches_list, pathnames_list, titles_list, enabled_on);

    const result = db.Grup.findOneAndUpdate({grupId: grupId}, {$push: {normesWeb: norma}}).populate("normesWeb");
    onUpdateCallback();
    return result;
}

async function _creaNormaWeb(severity, mode, hosts_list, protocols_list, searches_list,
                         pathnames_list, titles_list, enabled_on) {
    return await db.NormaWeb.create({
        severity: severity,
        hosts_list: hosts_list,
        protocols_list: protocols_list,
        searches_list: searches_list,
        pathnames_list: pathnames_list,
        titles_list: titles_list,
        mode: mode,
        enabled_on: []
    });
}

async function _creaNormaApp(processName, processPath, processPathisRegex, severity) {
    return await db.NormaApp.create({
        processName: processName,
        processPath: processPath,
        processPathisRegex: processPathisRegex,
        severity: severity
    });
}

async function creaNormaAlumneApp(alumneId, processName, processPath, processPathisRegex, severity) {
    const norma =  await _creaNormaApp(processName, processPath, processPathisRegex, severity);

    const result = await db.Alumne.findOneAndUpdate({alumneId: alumneId}, {$push: {normesApp: norma}}).populate("normesApp");
    onUpdateCallback();
    return result;
}

async function creaNormaGrupApp(grupId, processName, processPath, processPathisRegex, severity) {
    const norma =  await _creaNormaApp(processName, processPath, processPathisRegex,  severity);

    const result = await db.Grup.findOneAndUpdate({grupId: grupId}, {$push: {normesApp: norma}}).populate("normesApp");
    onUpdateCallback();
    return result;
}

async function getAllNormesWeb() {
    // Alumnes
    const alumnes = await db.Alumne.find({}).populate("normesWeb");

    const normesAlumnnes = {};

    for (const alumne of alumnes) {
        normesAlumnnes[alumne.alumneId] = {}
        for (norma of alumne.normesWeb) {
            normesAlumnnes[alumne.alumneId][norma._id] = {
                severity: norma.severity,
                mode: norma.mode,
                hosts_list: norma.hosts_list,
                protocols_list: norma.protocols_list,
                searches_list: norma.searches_list,
                pathnames_list: norma.pathnames_list,
                titles_list: norma.titles_list,
                enabled_on: norma.enabled_on
            };
        }
    }

    // Grups
    const grups = await db.Grup.find({}).populate("normesWeb");
    const normesGrups = {};

    for (const grup of grups) {
        normesGrups[grup.grupId] = {}
        for (norma of grup.normesWeb) {
            normesGrups[grup.grupId][norma._id] = {
                severity: norma.severity,
                mode: norma.mode,
                hosts_list: norma.hosts_list,
                protocols_list: norma.protocols_list,
                searches_list: norma.searches_list,
                pathnames_list: norma.pathnames_list,
                titles_list: norma.titles_list,
                enabled_on: norma.enabled_on
            };
        }
    }

    return {
        "alumnes": normesAlumnnes,
        "grups": normesGrups
    };
}

async function getAllNormesApps() {
    // Alumnes
    const alumnes = await db.Alumne.find({}).populate("normesApp");

    const normesAlumnnes = {};

    for (const alumne of alumnes) {
        normesAlumnnes[alumne.alumneId] = {}
        for (norma of alumne.normesApp) {
            normesAlumnnes[alumne.alumneId][norma._id] = {
                severity: norma.severity,
                processName: norma.processName,
                processPath: norma.processPath
            };
        }
    }

    // Grups
    const grups = await db.Grup.find({}).populate("normesApp");
    const normesGrups = {};

    for (const grup of grups) {
        normesGrups[grup.grupId] = {}
        for (norma of grup.normesApp) {
            normesGrups[grup.grupId][norma._id] = {
                severity: norma.severity,
                processName: norma.processName,
                processPath: norma.processPath
            };
        }
    }

    return {
        "alumnes": normesAlumnnes,
        "grups": normesGrups
    };
}

async function removeNormaWeb(who, whoid, normaId) {
    if(who === "grup") {
        await db.NormaWeb.deleteOne({_id: normaId});
        await db.Grup.updateMany({}, {$pull: {normesWeb: {_id: normaId}}});
    } else if(who === "alumne"){
        await db.NormaWeb.deleteOne({_id: normaId});
        await db.Alumne.updateMany({}, {$pull: {normesWeb: {_id: normaId}}});
    }

    onUpdateCallback();
}

async function removeNormaApp(who, whoid, normaId) {
    if(who === "grup") {
        await db.NormaApp.deleteOne({_id: normaId});
        await db.Grup.updateMany({}, {$pull: {normesApp: {_id: normaId}}});
    } else if(who === "alumne"){
        await db.NormaApp.deleteOne({_id: normaId});
        await db.Alumne.updateMany({}, {$pull: {normesApp: {_id: normaId}}});
    }
}
function registerOnUpdateCallback(callback) {
    onUpdateCallback = callback;
}

module.exports = {
    addNormaWebAlumne,
    creaNormaWebGrup,
    getAllNormesWeb,
    getAllNormesApps,
    removeNormaWeb,
    removeNormaApp,
    registerOnUpdateCallback,
    creaNormaGrupApp,
    creaNormaAlumneApp
}