const db = require("../database/db");
const crypto = require("crypto");
const { getInstance: getTokenManager } = require("./authTokenManager");

/**
 * Autentifica un administrador amb les seves credencials
 * Si les credencials són correctes, genera i retorna un token d'autenticació
 * @param {string} user - Nom d'usuari de l'administrador
 * @param {string} clauMd5 - Hash MD5 de la contrasenya
 * @returns {Promise<Object|null>} Objecte amb authToken si l'autenticació és correcta, null altrament
 */
async function autentificaAdmin(user, clauMd5) {
  if (!user || !clauMd5) {
    return null;
  }

  // Obtenim l'administrador de la base de dades
  const admin = await db.Admin.findOne({ user: user });

  if (admin && admin.clauMd5 === clauMd5) {
    // Credencials correctes - genera o reutilitza token
    const tokenManager = getTokenManager();
    const authToken = tokenManager.createToken(user);
    return { authToken };
  }

  return null;
}

/**
 * Verifica si un token d'autenticació és vàlid per a un usuari
 * @param {string} user - Nom d'usuari de l'administrador
 * @param {string} authToken - Token a verificar
 * @returns {boolean} True si el token és vàlid
 */
function checkAdmin(user, authToken) {
  if (!user || !authToken) {
    return false;
  }

  const tokenManager = getTokenManager();
  return tokenManager.validateToken(user, authToken);
}

/**
 * Obtenir llista de tots els administradors
 */
async function llistarAdmins() {
  const admins = await db.Admin.find({}).select("user -_id").lean();
  return admins;
}

/**
 * Crear un nou administrador
 */
async function crearAdmin(user, clau) {
  // Validar que l'usuari no existeix
  const existeix = await db.Admin.findOne({ user });
  if (existeix) {
    throw new Error("Ja existeix un administrador amb aquest usuari");
  }

  // Crear hash MD5 de la contrasenya
  const clauMd5 = crypto.createHash("md5").update(clau).digest("hex");

  const nouAdmin = new db.Admin({
    user,
    clauMd5,
  });

  await nouAdmin.save();
  return { user };
}

/**
 * Actualitzar contrasenya d'un administrador
 * Invalida tots els tokens d'autenticació existents per forçar re-login
 * @param {string} user - Nom d'usuari de l'administrador
 * @param {string} novaClau - Nova contrasenya en text pla
 * @returns {Promise<Object>} Objecte amb el nom d'usuari
 */
async function actualitzarAdmin(user, novaClau) {
  if (!user || !novaClau) {
    throw new Error("Usuari i contrasenya són obligatoris");
  }

  const admin = await db.Admin.findOne({ user });
  if (!admin) {
    throw new Error("Administrador no trobat");
  }

  // Crear hash MD5 de la nova contrasenya
  const clauMd5 = crypto.createHash("md5").update(novaClau).digest("hex");
  admin.clauMd5 = clauMd5;
  await admin.save();

  // Invalidar tots els tokens d'autenticació per forçar re-login
  const tokenManager = getTokenManager();
  tokenManager.invalidateUserTokens(user);

  return { user };
}

/**
 * Esborrar un administrador
 * Invalida tots els tokens d'autenticació associats
 * @param {string} user - Nom d'usuari de l'administrador a esborrar
 * @returns {Promise<Object>} Objecte amb el nom d'usuari
 */
async function esborrarAdmin(user) {
  if (!user) {
    throw new Error("L'usuari és obligatori");
  }

  const result = await db.Admin.deleteOne({ user });
  if (result.deletedCount === 0) {
    throw new Error("Administrador no trobat");
  }

  // Invalidar tots els tokens d'autenticació
  const tokenManager = getTokenManager();
  tokenManager.invalidateUserTokens(user);

  return { user };
}

/**
 * Obté estadístiques del sistema de tokens d'autenticació
 * @returns {Object} Estadístiques dels tokens actius
 */
function getAuthTokenStats() {
  const tokenManager = getTokenManager();
  return tokenManager.getStats();
}

/**
 * Neteja manualment els tokens expirats
 * @returns {number} Nombre de tokens eliminats
 */
function cleanupExpiredTokens() {
  const tokenManager = getTokenManager();
  return tokenManager.cleanupExpiredTokens();
}

module.exports = {
  autentificaAdmin,
  checkAdmin,
  llistarAdmins,
  crearAdmin,
  actualitzarAdmin,
  esborrarAdmin,
  getAuthTokenStats,
  cleanupExpiredTokens,
};
