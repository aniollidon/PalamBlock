const db = require("../database/db");
let onUpdateCallback = () => {};


async function creaNorma2WebAlumne(alumneId, severity, mode, webList, enabled_on) {

    const norma =  await _creaNorma2Web(severity, mode, webList, enabled_on);

    const result = await db.Alumne.findOneAndUpdate({alumneId: alumneId}, {$push: {normes2Web: norma}}).populate("normes2Web");
    onUpdateCallback();
    return result;
}


async function creaNorma2WebGrup(grupId, severity, mode, webList, enabled_on) {

    const norma =  await _creaNorma2Web(severity, mode, webList, enabled_on);

    const result = db.Grup.findOneAndUpdate({grupId: grupId}, {$push: {normes2Web: norma}}).populate("normes2Web");
    onUpdateCallback();
    return result;
}

async function _creaNorma2Web(severity, mode, webList, enabled_on) {

    const wlist = [];
    for (const web of webList) {
        //wlist.push(db.createWebLine(web.host, web.protocol, web.search, web.pathname, web.browser, web.incognito, web.audible));
        wlist.push({
            host: web.host,
            protocol: web.protocol,
            search: web.search,
            pathname: web.pathname,
            title: web.title,
            browser: web.browser,
            incognito: web.incognito,
            audible: web.audible
        })
    }


    return await db.Norma2Web.create({
        severity: severity,
        mode: mode,
        alive: true,
        enabled_on: [],
        lines: wlist,
        categories: ["general"]
        }
    );
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

async function updateNorma2WebGrup(whoid, normaId, severity, mode, list, enabled_on, alive){
    const result = await db.Grup.findOneAndUpdate({grupId: whoid, "normes2Web._id": normaId}, {
        $set: {
            "normes2Web.$.alive": alive
        }
    }).populate("normes2Web");
    onUpdateCallback();
    return result;
}

async function updateNorma2WebAlumne(whoid, normaId, severity, mode, list, enabled_on, alive){

    const result = await db.Alumne.findOneAndUpdate({alumneId: whoid, "normes2Web._id": normaId}, {
        $set: {
            "normes2Web.$.alive": alive
        }
    }).populate("normes2Web");
    onUpdateCallback();
    return result;
}

async function getAllNormes2Web() {
    // Alumnes
    const alumnes = await db.Alumne.find({}).populate("normes2Web")

    const normesAlumnnes = {};

    for (const alumne of alumnes) {
        normesAlumnnes[alumne.alumneId] = {}
        for (const norma of alumne.normes2Web) {
            const lines = [];
            for (const line of norma.lines) {
                lines.push({
                    host: line.host,
                    protocol: line.protocol,
                    search: line.search,
                    pathname: line.pathname,
                    title: line.title,
                    browser: line.browser,
                    incognito: line.incognito,
                    audible: line.audible
                })
            }

            normesAlumnnes[alumne.alumneId][norma._id] = {
                severity: norma.severity,
                mode: norma.mode,
                lines: lines,
                enabled_on: norma.enabled_on,
                alive: norma.alive
            };
        }
    }

    // Grups
    const grups = await db.Grup.find({}).populate("normesWeb");
    const normesGrups = {};

    for (const grup of grups) {
        normesGrups[grup.grupId] = {}
        for (const norma of grup.normes2Web) {
            const lines = [];
            for (const line of norma.lines) {
                lines.push({
                    host: line.host,
                    protocol: line.protocol,
                    search: line.search,
                    pathname: line.pathname,
                    title: line.title,
                    browser: line.browser,
                    incognito: line.incognito,
                    audible: line.audible
                })
            }

            normesGrups[grup.grupId][norma._id] = {
                severity: norma.severity,
                mode: norma.mode,
                lines: lines,
                enabled_on: norma.enabled_on,
                alive: norma.alive
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
        for (const norma of alumne.normesApp) {
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
        for (const norma of grup.normesApp) {
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


async function removeNorma2Web(who, whoid, normaId) {
    if(who === "grup") {
        await db.Norma2Web.deleteOne({_id: normaId});
        await db.Grup.updateMany({}, {$pull: {normes2Web: {_id: normaId}}});
    } else if(who === "alumne"){
        await db.Norma2Web.deleteOne({_id: normaId});
        await db.Alumne.updateMany({}, {$pull: {normes2Web: {_id: normaId}}});
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
    creaNorma2WebAlumne,
    creaNorma2WebGrup,
    getAllNormes2Web,
    getAllNormesApps,
    removeNorma2Web,
    removeNormaApp,
    registerOnUpdateCallback,
    creaNormaGrupApp,
    creaNormaAlumneApp,
    updateNorma2WebGrup,
    updateNorma2WebAlumne
}
