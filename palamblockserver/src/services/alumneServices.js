const db = require("../database/db");


async function creaAlumne(alumneId, grupId, nom, cognoms){
    // Si no existeix el grup, el crea.
    let grup = await db.Grup.findOne({grupId: grupId});
    if(!grup) {
        grup = await db.Grup.create({
            grupId: grupId,
            nom: grupId,
            normes: [],
            status: "RuleOn"
        });
    }

    return db.Alumne.create({
        alumneId: alumneId,
        nom: nom,
        cognoms: cognoms,
        status: "RuleOn",
        normes: [],
        grup: grupId
    });

}

module.exports = {
    creaAlumne
}