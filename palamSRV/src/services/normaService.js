const db = require("../database/db");
let onUpdateCallback = () => {};

async function creaNormaAlumne(alumneId, severity, mode, hosts_list, protocols_list, searches_list,
                   pathnames_list, titles_list, enabled_on) {

    const norma =  await _creaNorma(severity, mode, hosts_list, protocols_list,
        searches_list, pathnames_list, titles_list, enabled_on);

    const result = await db.Alumne.findOneAndUpdate({alumneId: alumneId}, {$push: {normes: norma}}).populate("normes");
    onUpdateCallback();
    return result;
}

async function creaNormaGrup(grupId, severity, mode, hosts_list, protocols_list, searches_list,
                   pathnames_list, titles_list, enabled_on) {

    const norma =  await _creaNorma(severity, mode, hosts_list, protocols_list,
        searches_list, pathnames_list, titles_list, enabled_on);

    const result = db.Grup.findOneAndUpdate({grupId: grupId}, {$push: {normes: norma}}).populate("normes");
    onUpdateCallback();
    return result;
}

async function _creaNorma(severity, mode, hosts_list, protocols_list, searches_list,
                         pathnames_list, titles_list, enabled_on) {
    return await db.Norma.create({
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

async function getAllNormes() {
    // Alumnes
    const alumnes = await db.Alumne.find({}).populate("normes");

    const normesAlumnnes = {};

    for (alumne of alumnes) {
        normesAlumnnes[alumne.alumneId] = {}
        for (norma of alumne.normes) {
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
        //await db.Grup.findOneAndUpdate({grupId: whoid}, {$pull: {normes: normaId}});
    } else if(who === "alumne"){
        //await db.Alumne.findOneAndUpdate({alumneId: whoid}, {$pull: {normes: normaId}});
        await db.Norma.deleteOne({_id: normaId});
        await db.Alumne.updateMany({}, {$pull: {normes: {_id: normaId}}});
    }

    onUpdateCallback();
}

function registerOnUpdateCallback(callback) {
    onUpdateCallback = callback;
}

module.exports = {
    creaNormaAlumne,
    creaNormaGrup,
    getAllNormes,
    removeNorma,
    registerOnUpdateCallback
}