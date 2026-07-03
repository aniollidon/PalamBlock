const db = require("../database/db");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const fs = require("fs");
const path = require("path");
const logger = require("../logger").logger;
const cryptoSalt = process.env.CRYPTO_SALT;

// Google OAuth Client Setup
let googleClientId = "";
let googleClientSecret = "";
let googleRedirectUri = "http://localhost"; // Ha de coincidir amb Electron

try {
  // Llegeix el client_id des de l'arrel de palamSRV
  const rootDir = path.join(__dirname, "../../");
  const files = fs.readdirSync(rootDir);
  const jsonFile = files.find(f => f.startsWith('client_secret_') && f.endsWith('.json'));
  
  if (jsonFile) {
    const rawData = fs.readFileSync(path.join(rootDir, jsonFile));
    const googleData = JSON.parse(rawData);
    // Sol estar dins de la key web o installed depenent de l'app
    const clientData = googleData?.web || googleData?.installed;
    
    googleClientId = clientData?.client_id;
    googleClientSecret = clientData?.client_secret;
    if (clientData?.redirect_uris && clientData?.redirect_uris.length > 0) {
      googleRedirectUri = clientData.redirect_uris[0];
    }
    
    logger.info("Google Client ID i Secret carregats exitosament.");
  } else {
    logger.warn("No s'ha trobat cap fitxer client_secret a l'arrel.");
  }
} catch (error) {
  logger.error("Error llegint el fitxer o configuració de google-auth:", error);
}

const client = new OAuth2Client(googleClientId, googleClientSecret, googleRedirectUri);

function encriptaClau(clau) {
  return crypto
    .pbkdf2Sync(clau, cryptoSalt, 1000, 64, `sha512`)
    .toString(`hex`);
}

function checkClau(clau, clauEncriptada) {
  return clauEncriptada === encriptaClau(clau);
}

async function creaAlumne(alumneId, grupId, clau, nom, cognoms) {
  // Si no existeix el grup, el crea.
  let grup = await db.Grup.findOne({ grupId: grupId });
  if (!grup) {
    grup = await db.Grup.create({
      grupId: grupId,
      nom: grupId,
      status: "RuleOn",
    });
  }

  return db.Alumne.create({
    alumneId: alumneId,
    nom: nom,
    cognoms: cognoms,
    clauEncriptada: encriptaClau(clau),
    status: "RuleOn",
    grup: grupId,
  });
}

async function autentificaAlumne(alumneId, clau) {
  const alumne = await db.Alumne.findOne({ alumneId: alumneId });
  if (!alumne) throw { status: 404, message: "Alumne no trobat" };

  if (!checkClau(clau, alumne.clauEncriptada))
    throw { status: 401, message: "Clau incorrecta" };

  return alumne;
}

async function autentificaAlumneGoogle(authCode) {
  if (!googleClientId || !googleClientSecret) {
    throw { status: 500, message: "OAuth no està configurat al servidor." };
  }

  try {
    const { tokens } = await client.getToken(authCode);

    const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: googleClientId,  
    });
    const payload = ticket.getPayload();
    
    // Obtenim correu i domini
    const email = payload.email.toLowerCase();
    const domain = payload.hd; // hosted domain

    // Validem el domini
    if (domain !== "inspalamos.cat" && !email.endsWith("@inspalamos.cat")) {
        throw { status: 403, message: "Només es permeten comptes de @inspalamos.cat" };
    }

    // Busquem l'alumne a la base de dades. 
    // Actualment alumneId és l'identificador principal (ex: examen1). 
    // Com que es tracta d'un login temporal d'examen, no validem si existeix a DB,
    // ja que l'agent usarà la sessió de l'alumne genèric i les dades temporals de Google.
    // Així que en aquest cas simplement retornem les dades validades de Google per defecte, 
    // o bé l'agent es responsabilitza d'enviar el correu vàlid cap a "startExamSession" intern.
    
    // Retornem el payload bàsic
    return {
      email: email,
      nom: payload.given_name,
      cognoms: payload.family_name,
      oauthId: payload.sub,
      picture: payload.picture
    };

  } catch (error) {
     if (error.status) throw error; // Re-llençar errors coneguts
     logger.error("Error al verificar token de Google:", error);
     throw { status: 401, message: "Token de Google invàlid o expirat" };
  }
}

async function getGrupAlumnesList() {
  const list = {};
  const grups = await db.Grup.find();
  for (let grup of grups) {
    list[grup.grupId] = {
      grupId: grup.grupId,
      status: grup.status,
      alumnes: {},
    };
  }
  for (let alumne of await db.Alumne.find()) {
    if (!list[alumne.grup]) {
      logger.error("No existeix el grup " + alumne.grup);
      continue;
    }

    list[alumne.grup].alumnes[alumne.alumneId] = {
      alumneId: alumne.alumneId,
      nom: alumne.nom,
      cognoms: alumne.cognoms,
      status: alumne.status,
      grup: alumne.grup,
    };
  }
  return list;
}

function setAlumneStatus(alumneId, status) {
  return db.Alumne.updateOne({ alumneId: alumneId }, { status: status });
}

function setGrupStatus(grupId, status) {
  return db.Grup.updateOne({ grupId: grupId }, { status: status });
}

async function getAlumneStatus(alumneId) {
  const alumne = await db.Alumne.findOne({ alumneId: alumneId });
  if (!alumne)
    throw { status: 404, message: "Alumne " + alumneId + " no trobat" };

  return alumne.status;
}

async function updateAlumne(alumneId, updates) {
  const alumne = await db.Alumne.findOne({ alumneId: alumneId });
  if (!alumne)
    throw { status: 404, message: "Alumne " + alumneId + " no trobat" };

  // Si es canvia la clau, l'encriptem
  if (updates.clau) {
    updates.clauEncriptada = encriptaClau(updates.clau);
    delete updates.clau;
  }

  // Si es canvia de grup, validem que el grup existeix
  if (updates.grup && updates.grup !== alumne.grup) {
    const grup = await db.Grup.findOne({ grupId: updates.grup });
    if (!grup)
      throw { status: 404, message: "Grup " + updates.grup + " no trobat" };
  }

  return db.Alumne.updateOne({ alumneId: alumneId }, updates);
}

async function deleteAlumne(alumneId) {
  const alumne = await db.Alumne.findOne({ alumneId: alumneId });
  if (!alumne)
    throw { status: 404, message: "Alumne " + alumneId + " no trobat" };

  return db.Alumne.deleteOne({ alumneId: alumneId });
}

async function creaGrup(grupId, nom) {
  const grupExistent = await db.Grup.findOne({ grupId: grupId });
  if (grupExistent)
    throw { status: 409, message: "El grup " + grupId + " ja existeix" };

  return db.Grup.create({
    grupId: grupId,
    nom: nom || grupId,
    status: "RuleOn",
  });
}

async function updateGrup(grupId, updates) {
  const grup = await db.Grup.findOne({ grupId: grupId });
  if (!grup) throw { status: 404, message: "Grup " + grupId + " no trobat" };

  return db.Grup.updateOne({ grupId: grupId }, updates);
}

async function deleteGrup(grupId) {
  const grup = await db.Grup.findOne({ grupId: grupId });
  if (!grup) throw { status: 404, message: "Grup " + grupId + " no trobat" };

  // Comprovar si hi ha alumnes en aquest grup
  const alumnesCount = await db.Alumne.countDocuments({ grup: grupId });
  if (alumnesCount > 0)
    throw {
      status: 409,
      message:
        "No es pot esborrar el grup " +
        grupId +
        " perquè té " +
        alumnesCount +
        " alumnes assignats",
    };

  return db.Grup.deleteOne({ grupId: grupId });
}

module.exports = {
  creaAlumne,
  autentificaAlumne,
  autentificaAlumneGoogle,
  getGrupAlumnesList,
  setAlumneStatus,
  setGrupStatus,
  getAlumneStatus,
  updateAlumne,
  deleteAlumne,
  creaGrup,
  updateGrup,
  deleteGrup,
};
