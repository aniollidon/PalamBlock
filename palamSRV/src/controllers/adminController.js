const adminService = require('../services/adminService');

function autentificaAdminAPI(req, res, next) {
    // Obtenim les credencials de l'usuari i la contrasenya
    const { user, clauMd5 } = req.body;

    adminService.autentificaAdmin(user, clauMd5).then((auth) => {
        if (auth) {
            res.send(JSON.stringify({ authToken: auth.authToken }));
        } else
            res.status(401).json({ error: 'Autenticació fallida' });
    });
}

function checkAdmin(user, authToken){
    return adminService.checkAdmin(user, authToken);
}

module.exports = {
    autentificaAdminAPI,
    checkAdmin

}