const db = require("../database/db");
let onUpdateCallback = () => {};

async function creaNormaAlumne(alumneId, severity, mode, hosts_list, protocols_list, searches_list,
                   pathnames_list, titles_list, enabled_on) {

    const norma =  await _creaNorma(severity, mode, hosts_list, protocols_list,
        searches_list, pathnames_list, titles_list, enabled_on);

    const result = await db.Alumne.findOneAndUpdate({alumneId: alumneId}, {$push: {normesWeb: norma}}).populate("normesWeb");
    onUpdateCallback();
    return result;
}

async function creaNormaGrup(grupId, severity, mode, hosts_list, protocols_list, searches_list,
                   pathnames_list, titles_list, enabled_on) {

    const norma =  await _creaNorma(severity, mode, hosts_list, protocols_list,
        searches_list, pathnames_list, titles_list, enabled_on);

    const result = db.Grup.findOneAndUpdate({grupId: grupId}, {$push: {normesWeb: norma}}).populate("normesWeb");
    onUpdateCallback();
    return result;
}

async function _creaNorma(severity, mode, hosts_list, protocols_list, searches_list,
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

async function getAllNormesWeb() {
    // Alumnes
    const alumnes = await db.Alumne.find({}).populate("normesWeb");

    const normesAlumnnes = {};

    for (alumne of alumnes) {
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

    return {
        "alumnes": normesAlumnnes
    };
}

async function removeNorma(who, whoid, normaId) {
    if(who === "grup") {
        //await db.Grup.findOneAndUpdate({grupId: whoid}, {$pull: {normesWeb: normaId}});
    } else if(who === "alumne"){
        //await db.Alumne.findOneAndUpdate({alumneId: whoid}, {$pull: {normesWeb: normaId}});
        await db.NormaWeb.deleteOne({_id: normaId});
        await db.Alumne.updateMany({}, {$pull: {normesWeb: {_id: normaId}}});
    }

    onUpdateCallback();
}

function registerOnUpdateCallback(callback) {
    onUpdateCallback = callback;
}

module.exports = {
    creaNormaAlumne,
    creaNormaGrup,
    getAllNormesWeb,
    removeNorma,
    registerOnUpdateCallback
}