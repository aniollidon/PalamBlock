const { Server } = require("socket.io");
const infoController = require("../../controllers/infoController");

function initializeWebSocket(server) {
    const io = new Server(server)

    io.on('connection', (socket) => {
        console.log('a user connected');

        socket.emit('browsingActivity', infoController.getAlumnesBrowsingActivity());

        infoController.registerOnUpdateCallback(() => {
            socket.emit('browsingActivity', infoController.getAlumnesBrowsingActivity());
        });

    });
}

module.exports = initializeWebSocket;
