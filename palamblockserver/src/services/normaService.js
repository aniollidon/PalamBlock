const db = require("../database/db");

async function creaNormaAlumne(alumneId, severity, mode, hosts_list, protocols_list, searches_list,
                   pathnames_list, titles_list, enabled_on) {

    const norma =  await creaNorma(severity, mode, hosts_list, protocols_list,
        searches_list, pathnames_list, titles_list, enabled_on);

    return db.Alumne.findOneAndUpdate({alumneId: alumneId}, {$push: {normes: norma}}).populate("normes");
}

async function creaNormaGrup(grupId, severity, mode, hosts_list, protocols_list, searches_list,
                   pathnames_list, titles_list, enabled_on) {

    const norma =  await creaNorma(severity, mode, hosts_list, protocols_list,
        searches_list, pathnames_list, titles_list, enabled_on);

    return db.Grup.findOneAndUpdate({grupId: grupId}, {$push: {normes: norma}}).populate("normes");
}

async function creaNorma(severity, mode, hosts_list, protocols_list, searches_list,
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

module.exports = {
    creaNormaAlumne,
    creaNormaGrup
}