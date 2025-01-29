const { Server } = require("socket.io");
const logger = require("../../logger").logger;

function initializeCastWebSocket(server) {
    const io = new Server(server, {
        path: '/ws-cast'
    })

    io.on('connection', (socket) => {
        console.log('new connection from ', socket.id);

        socket.on('offer', (offer) => {
            console.log('new offer from ', socket.id);
            socket.broadcast.emit('offer', offer);
        });

        socket.on('answer', (answer) => {
            console.log('new answer from ', socket.id);
            socket.broadcast.emit('answer', answer);
        });

        socket.on('icecandidate', (candidate) => {
            console.log('new ice candidate from ', socket.id);
            socket.broadcast.emit('icecandidate', candidate);
        });
    });
}

module.exports = initializeCastWebSocket;
