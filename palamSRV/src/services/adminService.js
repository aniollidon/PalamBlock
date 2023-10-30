const db = require('../database/db')

const authTokens = {};

async function autentificaAdmin(user, clauMd5) {
    // Obtenim l'alumne de la base de dades
    const admin = await db.Admin.findOne({user: user});

    if (admin && admin.clauMd5 === clauMd5) {
        if(authTokens[user])
            return { authToken: authTokens[user] };
        else {
            const authToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            authTokens[user] = authToken;
            return { authToken: authToken };
        }
    }
    else
        return null;
}

function checkAdmin(user, authToken) {
    return authTokens[user] === authToken;
}

module.exports = {
    autentificaAdmin,
    checkAdmin
}