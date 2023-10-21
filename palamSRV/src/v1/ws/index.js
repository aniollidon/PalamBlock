const { Server } = require("socket.io");
const infoController = require("../../controllers/infoController");
const normaController = require("../../controllers/normaController");
const historialController = require("../../controllers/historialController");
const alumneController = require("../../controllers/alumneController");

function initializeWebSocket(server) {
    const io = new Server(server)

    io.on('connection', async (socket) => {
        socket.emit('grupAlumnesList', await alumneController.getGrupAlumnesList());
        socket.emit('browsingActivity', infoController.getAlumnesBrowsingActivity());
        socket.emit('normesList', await normaController.getAllNormes());

        infoController.registerOnUpdateCallback(() => {
            socket.emit('browsingActivity', infoController.getAlumnesBrowsingActivity());
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
            infoController.normesHasChanged();
            socket.emit('normesList', await normaController.getAllNormes());
        });

        socket.on('getHistorial', async (msg) => {
            const historial = await historialController.getHistorial(msg.alumne, msg.offset);
            socket.emit('historialAlumne', {alumne:msg.alumne, historial:historial});
        });
    });


}

module.exports = initializeWebSocket;
