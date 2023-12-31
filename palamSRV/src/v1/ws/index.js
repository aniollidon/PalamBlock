const { Server } = require("socket.io");
const infoController = require("../../controllers/infoController");
const normaController = require("../../controllers/normaController");
const historialController = require("../../controllers/historialController");
const alumneController = require("../../controllers/alumneController");
const adminController = require("../../controllers/adminController");
const logger = require("../../logger").logger;

function initializeWebSocket(server) {
    const io = new Server(server)

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
        socket.emit('normesWeb', await normaController.getAllNormesWeb());
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
            normaController.addNormaWeb(msg.who, msg.whoid, msg.severity, msg.mode, msg.hosts_list,
                msg.protocols_list, msg.searches_list, msg.pathnames_list, msg.titles_list, msg.enabled_on);
        });

        socket.on('addNormaApps', (msg) => {
            //logger.info('addNormaApps', msg);
            normaController.addNormaApps(msg.who, msg.whoid, msg.severity, msg.processName, msg.processPath,
                msg.processPathisRegex);
        });

        socket.on('removeNormaWeb', (msg) => {
            //logger.info('removeNormaWeb', msg);
            normaController.removeNormaWeb(msg.who, msg.whoid, msg.normaId);
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
            socket.emit('normesWeb', await normaController.getAllNormesWeb());
            socket.emit('normesApps', await normaController.getAllNormesApps());

        });

        socket.on('getHistorialWeb', async (msg) => {
            const historial = await historialController.getHistorialWeb(msg.alumne, msg.offset);
            socket.emit('historialWebAlumne', {alumne:msg.alumne, historial:historial});
        });

        socket.on('getHistorialApps', async (msg) => {
            const historial = await historialController.getHistorialApps(msg.alumne, msg.offset);
            socket.emit('historialAppsAlumne', {alumne:msg.alumne, historial:historial});
        });

        socket.on('setGrupStatus', async (msg) => {
            await alumneController.setGrupStatus(msg.grup, msg.status);
        });

        socket.on('setAlumneStatus', async (msg) => {
            await alumneController.setAlumneStatus(msg.alumne, msg.status);
        });
    });


}

module.exports = initializeWebSocket;
