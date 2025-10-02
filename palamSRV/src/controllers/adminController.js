const adminService = require("../services/adminService");

function autentificaAdminAPI(req, res, next) {
  // Obtenim les credencials de l'usuari i la contrasenya
  const { user, clauMd5 } = req.body;

  adminService.autentificaAdmin(user, clauMd5).then((auth) => {
    if (auth) {
      res.send(JSON.stringify({ authToken: auth.authToken }));
    } else res.status(401).json({ error: "Autenticació fallida" });
  });
}

function checkAdmin(user, authToken) {
  return adminService.checkAdmin(user, authToken);
}

/**
 * Llistar tots els administradors
 */
async function llistarAdmins() {
  return await adminService.llistarAdmins();
}

/**
 * Crear un nou administrador
 */
async function crearAdmin(data) {
  return await adminService.crearAdmin(data.user, data.clau);
}

/**
 * Actualitzar contrasenya d'un administrador
 */
async function actualitzarAdmin(user, novaClau) {
  return await adminService.actualitzarAdmin(user, novaClau);
}

/**
 * Esborrar un administrador
 */
async function esborrarAdmin(user) {
  return await adminService.esborrarAdmin(user);
}

module.exports = {
  autentificaAdminAPI,
  checkAdmin,
  llistarAdmins,
  crearAdmin,
  actualitzarAdmin,
  esborrarAdmin,
};
