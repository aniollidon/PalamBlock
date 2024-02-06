const { Server } = require("socket.io");
const infoController = require("../../controllers/infoController");
const validacioController = require("../../controllers/validacioController");


function initializeExtentionWebSocket(server) {
    const io = new Server(server, {
        path: '/ws-extention',
    })

    io.on('connection', async (socket) => {
        socket.on('tabInfo', infoController.postTabInfoWS);
        socket.on('browserInfo', infoController.postBrowserInfoWS);
        socket.on("validaTab", (msg)=>{
            validacioController.postValidacioWS(msg, (tabId, status)=>{
                socket.emit('respostaTab', {tabId:tabId, do:status});
            })
            }
        )
    });


}

module.exports = initializeExtentionWebSocket;
