const { Server } = require("socket.io");
const infoController = require("../../controllers/infoController");
const validacioController = require("../../controllers/validacioController");
const adminController = require("../../controllers/adminController");


function initializeExtentionWebSocket(server) {
    const io = new Server(server,
        {
            path: '/ws-extention',
            cors:{
                origin: "*"
            }
        });

    io.on('connection', (socket) => {
        console.log('Un client s\'ha connectat ' + socket.id );

        socket.on('registerBrowser', (data) => {
            infoController.registerActionListenerWS(socket.id, data, (action, tabId, message= undefined) => {
                socket.emit('do', {action: action, tabId: tabId, message: message});
            });
        });

        socket.on('disconnect', () => {
            infoController.disconnectWS(socket.id);
        });

        socket.on('browserInfo', (data) => {
            infoController.postBrowserInfoWS(socket.id, data);
        });

        socket.on('tabInfo', (data) => {
            infoController.postTabInfoWS(socket.id, data);
        });
    });

}

module.exports = initializeExtentionWebSocket;
