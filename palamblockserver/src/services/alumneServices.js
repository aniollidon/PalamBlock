const db = require("../database/db");
const crypto = require('crypto');
const cryptoSalt = process.env.CRYPTO_SALT;


function encriptaClau(clau){
    return  crypto.pbkdf2Sync(clau, cryptoSalt,
        1000, 64, `sha512`).toString(`hex`);
}

function checkClau(clau, clauEncriptada){
    return clauEncriptada === encriptaClau(clau);
}

async function creaAlumne(alumneId, grupId, clau, nom, cognoms){
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
        clauEncriptada: encriptaClau(clau),
        status: "RuleOn",
        normes: [],
        grup: grupId
    });

}

async function autentificaAlumne(alumneId, clau){
    const alumne = await db.Alumne.findOne({alumneId: alumneId});
    if(!alumne)
        throw {status: 404, message: "Alumne no trobat"};

    if(!checkClau(clau, alumne.clauEncriptada))
        throw {status: 401, message: "Clau incorrecta"};

    return alumne;
}

module.exports = {
    creaAlumne,
    autentificaAlumne
}