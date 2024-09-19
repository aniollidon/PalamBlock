const { Server } = require("socket.io");
const infoController = require("../../controllers/infoController");
const normaController = require("../../controllers/normaController");
const historialController = require("../../controllers/historialController");
const alumneController = require("../../controllers/alumneController");
const adminController = require("../../controllers/adminController");
const logger = require("../../logger").logger;

function initializeAdminWebSocket(server) {
    const info_activityCallbacks = {};
    const norma_activityCallbacks = {};
    const io = new Server(server, {
        path: '/ws-admin'
    })

    io.use((socket, next) => {
        // Obtenim les credencials de l'usuari i la contrasenya
        const { user, authToken } = socket.handshake.query;

        // Verifiquem les credencials
        const auth = adminController.checkAdmin(user, authToken);
        if (auth) {
            return next();
        }

        return next(new Error('Autenticació fallida'));
    });

    infoController.registerActivityOnUpdateCallback(async (topic) => {
        for (const callback of Object.values(info_activityCallbacks)) {
            callback(topic);
        }
    });

    normaController.registerOnUpdateCallback(async () => {
        infoController.normesWebHasChanged();
        for (const callback of Object.values(norma_activityCallbacks)) {
            callback();
        }
    });


    io.on('connection', async (socket) => {
        logger.info('S\'ha connectat un client ws-admin ' + socket.id );
        socket.emit('grupAlumnesList', await alumneController.getGrupAlumnesList());
        socket.emit('alumnesActivity', await infoController.getAlumnesActivity());
        socket.emit('alumnesMachine', infoController.getAlumnesMachine());
        socket.emit('normesWeb', await normaController.getAllNormes2Web());

        info_activityCallbacks[socket.id] = (async (topic) => {
            if(topic.includes('browsers'))
                socket.emit('alumnesActivity', await infoController.getAlumnesActivity());
            if(topic.includes('machines'))
                socket.emit('updateAlumnesMachine', infoController.getAlumnesMachine());
        });

        norma_activityCallbacks[socket.id] = (async () => {
            socket.emit('normesWeb', await normaController.getAllNormes2Web());
        });

        socket.on('closeTab', (msg) => {
            infoController.remoteCloseTab(msg.alumne, msg.browser, msg.tabId);
        });

        socket.on('addNormaWeb', (msg) => {
            //logger.info('addNormaWeb', msg);
            normaController.addNorma2Web(msg.who, msg.whoid, msg.severity, msg.mode, msg.list, msg.enabled_on);
        });

        socket.on('removeNormaWeb', (msg) => {
            //logger.info('removeNormaWeb', msg);
            normaController.removeNorma2Web(msg.who, msg.whoid, msg.normaId);
        });

        socket.on('deleteHistorialFromAlumne', (msg) => {
            //logger.info('deleteHistorialFromAlumne', msg);
            historialController.deleteHistorialFromAlumne(msg.alumne);
        });

        socket.on('getHistorialWeb', async (msg) => {
            const historial = await historialController.getHistorialWeb(msg.alumne, msg.offset);
            socket.emit('historialWebAlumne', {alumne:msg.alumne, historial:historial});
        });

        socket.on('getSearchHistorialWeb', async (msg) => {
            const historial = await historialController.searchHistorialWeb(msg.alumne, msg.search, msg.offset);
            socket.emit('historialWebAlumne', {alumne:msg.alumne, historial:historial, query:msg.search});
        });

        socket.on('getEachBrowserLastUsage', async (msg) => {
            const lastUsage = await historialController.getEachBrowserLastUsage(msg.alumne);
            socket.emit('eachBrowserLastUsage', {alumne:msg.alumne, lastUsage:lastUsage});
        });

        socket.on('getHistorialHostsSortedByUsage', async (msg) => {
            const sortedHistorial = await historialController.getHistorialHostsSortedByUsage(msg.alumne, msg.pastDays||7);
            socket.emit('historialHostsSortedByUsage', {alumne:msg.alumne, sortedHistorial:sortedHistorial, days:msg.pastDays||7});
        });

        socket.on('setGrupStatus', async (msg) => {
            await alumneController.setGrupStatus(msg.grup, msg.status);
        });

        socket.on('setAlumneStatus', async (msg) => {
            await alumneController.setAlumneStatus(msg.alumne, msg.status);
        });

        socket.on('updateNormaWeb', async (msg) => {
            await normaController.updateNorma2Web(msg.who, msg.whoid, msg.normaId, msg.severity, msg.mode, msg.list, msg.enabled_on, msg.alive);
        });

        socket.on('sendMessageToAlumne', async (msg) => {
            await infoController.sendMessageToAlumne(msg.alumne, msg.message);
        });

        socket.on('sendCommandToAlumne', async (msg) => {
            await infoController.sendCommandToAlumne(msg.alumne, msg.command);
        });

        socket.on('disconnect', () => {
            logger.info('S\'ha desconnectat un client ws-admin ' + socket.id );
            delete info_activityCallbacks[socket.id];
            delete norma_activityCallbacks[socket.id];
        });
    });
}

module.exports = initializeAdminWebSocket;
