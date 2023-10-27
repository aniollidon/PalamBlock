const { Server } = require("socket.io");
const infoController = require("../../controllers/infoController");
const normaController = require("../../controllers/normaController");
const historialController = require("../../controllers/historialController");
const alumneController = require("../../controllers/alumneController");

function initializeWebSocket(server) {
    const io = new Server(server)

    io.on('connection', async (socket) => {
        socket.emit('grupAlumnesList', await alumneController.getGrupAlumnesList());
        socket.emit('browsingActivity', infoController.getAlumnesActivity());
        socket.emit('normesWeb', await normaController.getAllNormesWeb());

        infoController.registerOnUpdateCallback((toUpdate) => {
            socket.emit('alumnesActivity', infoController.getAlumnesActivity());
        });

        // on message closeTab
        socket.on('closeTab', (msg) => {
            infoController.remoteCloseTab(msg.alumne, msg.browser, msg.browserId, msg.tabId);
        });

        socket.on('addNorma', (msg) => {
            console.log('addNorma', msg);
            normaController.addNorma(msg.who, msg.whoid, msg.severity, msg.mode, msg.hosts_list,
                msg.protocols_list, msg.searches_list, msg.pathnames_list, msg.titles_list, msg.enabled_on);
        });

        socket.on('removeNorma', (msg) => {
            console.log('removeNorma', msg);
            normaController.removeNorma(msg.who, msg.whoid, msg.normaId);
        });

        normaController.registerOnUpdateCallback(async () => {
            infoController.normesWebHasChanged();
            socket.emit('normesWeb', await normaController.getAllNormesWeb());
        });

        socket.on('getHistorialWeb', async (msg) => {
            const historial = await historialController.getHistorialWeb(msg.alumne, msg.offset);
            socket.emit('historialWebAlumne', {alumne:msg.alumne, historial:historial});
        });

        socket.on('getHistorialApps', async (msg) => {
            const historial = await historialController.getHistorialApps(msg.alumne, msg.offset);
            socket.emit('historialAppsAlumne', {alumne:msg.alumne, historial:historial});
        });
    });


}

module.exports = initializeWebSocket;
