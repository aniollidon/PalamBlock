const { Server } = require("socket.io");
const infoController = require("../../controllers/infoController");
const validacioController = require("../../controllers/validacioController");
const adminController = require("../../controllers/adminController");
const {logger} = require("../../logger");


function initializeOSWebSocket(server) {
    const io = new Server(server,
        {
            path: '/ws-os',
            cors:{
                origin: "*"
            }
        });

    io.on('connection', (socket) => {
        logger.info('S\'ha connectat un client ws-os ' + socket.id );

        socket.on('registerOS', (data) => {
            const executionCallback = async (cmd) => {
                socket.emit('execute', {command:cmd});
            }
            const isConnectionAlive = ()=> {
                return socket.connected;
            }

            infoController.registerMachine(socket.id, data.version, data.os, data.ip, data.ssid,
                data.alumne, executionCallback, isConnectionAlive);
        });

        socket.on('disconnect', () => {
            logger.info('S\'ha desconnectat un client ws-os ' + socket.id );
            infoController.unregisterMachine(socket.id);
        });

        socket.on('updateOS', (data) => {
            infoController.updateMachine(socket.id, data.version, data.os, data.ip, data.ssid, data.username);
        });
    });

}

module.exports = initializeOSWebSocket;
