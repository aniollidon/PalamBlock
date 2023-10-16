const { Server } = require("socket.io");
const infoController = require("../../controllers/infoController");
const normaController = require("../../controllers/normaController");

function initializeWebSocket(server) {
    const io = new Server(server)

    io.on('connection', (socket) => {
        socket.emit('browsingActivity', infoController.getAlumnesBrowsingActivity());

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
    });


}

module.exports = initializeWebSocket;
