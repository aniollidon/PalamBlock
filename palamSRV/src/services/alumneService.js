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
            normesWeb: [],
            status: "RuleOn"
        });
    }

    return db.Alumne.create({
        alumneId: alumneId,
        nom: nom,
        cognoms: cognoms,
        clauEncriptada: encriptaClau(clau),
        status: "RuleOn",
        normesWeb: [],
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

async function getGrupAlumnesList(){
    const list = {};
    const grups = await db.Grup.find();
    for (let grup of grups) {
        list[grup.grupId] = {
            grupId: grup.grupId,
            status: grup.status,
            alumnes: {}
        }
    }
    for (let alumne of await db.Alumne.find()) {

        if(!list[alumne.grup]){
            console.error("No existeix el grup " + alumne.grup);
            continue;
        }

        list[alumne.grup].alumnes[alumne.alumneId] = {
            alumneId: alumne.alumneId,
            nom: alumne.nom,
            cognoms: alumne.cognoms,
            status: alumne.status,
            grup: alumne.grup
        }
    }
    return list;
}

function setAlumneStatus(alumneId, status){
    return db.Alumne.updateOne({alumneId: alumneId}, {status: status});
}

function setGrupStatus(grupId, status){
    return db.Grup.updateOne({grupId: grupId}, {status: status});
}

async function getAlumneStatus(alumneId){
    const alumne = await db.Alumne.findOne({alumneId: alumneId});
    if(!alumne)
        throw {status: 404, message: "Alumne " + alumneId +" no trobat"};

    return alumne.status;
}

module.exports = {
    creaAlumne,
    autentificaAlumne,
    getGrupAlumnesList,
    setAlumneStatus,
    setGrupStatus,
    getAlumneStatus
}
