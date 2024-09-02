const { Server } = require("socket.io");
const infoController = require("../../controllers/infoController");
const normaController = require("../../controllers/normaController");
const historialController = require("../../controllers/historialController");
const alumneController = require("../../controllers/alumneController");
const adminController = require("../../controllers/adminController");
const logger = require("../../logger").logger;

function initializeAdminWebSocket(server) {
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

    io.on('connection', async (socket) => {
        socket.emit('grupAlumnesList', await alumneController.getGrupAlumnesList());
        socket.emit('alumnesActivity', await infoController.getAlumnesActivity());
        socket.emit('getAlumnesMachine', infoController.getAlumnesMachine());
        socket.emit('normesWeb', await normaController.getAllNormes2Web());
        socket.emit('normesApps', await normaController.getAllNormesApps());

        infoController.registerOnUpdateCallback(async (toUpdate) => {
            socket.emit('alumnesActivity', await infoController.getAlumnesActivity());
        });

        // on message closeTab
        socket.on('closeTab', (msg) => {
            infoController.remoteCloseTab(msg.alumne, msg.browser, msg.tabId);
        });

        socket.on('addNormaWeb', (msg) => {
            //logger.info('addNormaWeb', msg);
            normaController.addNorma2Web(msg.who, msg.whoid, msg.severity, msg.mode, msg.list, msg.enabled_on);
        });

        socket.on('addNormaApps', (msg) => {
            //logger.info('addNormaApps', msg);
            normaController.addNormaApps(msg.who, msg.whoid, msg.severity, msg.processName, msg.processPath,
                msg.processPathisRegex);
        });

        socket.on('removeNormaWeb', (msg) => {
            //logger.info('removeNormaWeb', msg);
            normaController.removeNorma2Web(msg.who, msg.whoid, msg.normaId);
        });


        socket.on('removeNormaApps', (msg) => {
            //logger.info('removeNormaApps', msg);
            normaController.removeNormaApp(msg.who, msg.whoid, msg.normaId);
        });

        socket.on('deleteHistorialFromAlumne', (msg) => {
            //logger.info('deleteHistorialFromAlumne', msg);
            historialController.deleteHistorialFromAlumne(msg.alumne);
        });

        normaController.registerOnUpdateCallback(async () => {
            infoController.normesWebHasChanged();
            socket.emit('normesWeb', await normaController.getAllNormes2Web());
            socket.emit('normesApps', await normaController.getAllNormesApps());

        });

        socket.on('getHistorialWeb', async (msg) => {
            const historial = await historialController.getHistorialWeb(msg.alumne, msg.offset);
            socket.emit('historialWebAlumne', {alumne:msg.alumne, historial:historial});
        });

        socket.on('getSearchHistorialWeb', async (msg) => {
            const historial = await historialController.searchHistorialWeb(msg.alumne, msg.search, msg.offset);
            socket.emit('historialWebAlumne', {alumne:msg.alumne, historial:historial, query:msg.search});
        });

        socket.on('getHistorialApps', async (msg) => {
            const historial = await historialController.getHistorialApps(msg.alumne, msg.offset);
            socket.emit('historialAppsAlumne', {alumne:msg.alumne, historial:historial});
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
    });


}

module.exports = initializeAdminWebSocket;
