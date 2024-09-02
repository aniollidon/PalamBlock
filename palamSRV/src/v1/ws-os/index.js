const { Server } = require("socket.io");
const infoController = require("../../controllers/infoController");
const validacioController = require("../../controllers/validacioController");
const adminController = require("../../controllers/adminController");


function initializeOSWebSocket(server) {
    const io = new Server(server,
        {
            path: '/ws-os',
            cors:{
                origin: "*"
            }
        });

    io.on('connection', (socket) => {
        console.log('Un client s\'ha connectat ' + socket.id );

        socket.on('registerOS', (data) => {
            const executionCallback = async (data) => {
                socket.emit('execute', {command:data.command}); //OJU PELIGRU!!
            }
            infoController.registerMachine(socket.id, data.version, data.os, data.username, executionCallback);
        });

        socket.on('disconnect', () => {
            infoController.unregisterMachine(socket.id);
        });

        socket.on('newIP', (data) => {
            infoController.updateMachine(socket.id, data.ip, data.username);
        });
    });

}

module.exports = initializeOSWebSocket;
