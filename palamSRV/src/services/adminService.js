const db = require("../database/db");
const crypto = require("crypto");

const authTokens = {};

async function autentificaAdmin(user, clauMd5) {
  // Obtenim l'alumne de la base de dades
  const admin = await db.Admin.findOne({ user: user });

  if (admin && admin.clauMd5 === clauMd5) {
    if (authTokens[user]) return { authToken: authTokens[user] };
    else {
      const authToken =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      authTokens[user] = authToken;
      return { authToken: authToken };
    }
  } else return null;
}

function checkAdmin(user, authToken) {
  return authTokens[user] === authToken;
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
 */
async function actualitzarAdmin(user, novaClau) {
  const admin = await db.Admin.findOne({ user });
  if (!admin) {
    throw new Error("Administrador no trobat");
  }

  // Crear hash MD5 de la nova contrasenya
  const clauMd5 = crypto.createHash("md5").update(novaClau).digest("hex");
  admin.clauMd5 = clauMd5;
  await admin.save();

  // Invalidar token d'autenticació per forçar re-login
  delete authTokens[user];

  return { user };
}

/**
 * Esborrar un administrador
 */
async function esborrarAdmin(user) {
  const result = await db.Admin.deleteOne({ user });
  if (result.deletedCount === 0) {
    throw new Error("Administrador no trobat");
  }

  // Invalidar token d'autenticació
  delete authTokens[user];

  return { user };
}

module.exports = {
  autentificaAdmin,
  checkAdmin,
  llistarAdmins,
  crearAdmin,
  actualitzarAdmin,
  esborrarAdmin,
};
