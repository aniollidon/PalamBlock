const { Server } = require("socket.io");
const infoController = require("../../controllers/infoController");
const validacioController = require("../../controllers/validacioController");
const adminController = require("../../controllers/adminController");
const logger = require("../../logger").logger;


function initializeExtentionWebSocket(server) {
    const io = new Server(server,
        {
            path: '/ws-extention',
            cors:{
                origin: "*"
            }
        });

    io.on('connection', (socket) => {
        logger.info('S\'ha connectat un client ws-extention ' + socket.id );

        socket.on('registerBrowser', (data) => {
            infoController.registerActionListenerBrowserWS(socket.id, data, (action, tabId, message= undefined) => {
                socket.emit('do', {action: action, tabId: tabId, message: message});
            });
        });

        socket.on('disconnect', () => {
            infoController.disconnectBrowserWS(socket.id);
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
