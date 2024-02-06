const { Server } = require("socket.io");
const infoController = require("../../controllers/infoController");
const validacioController = require("../../controllers/validacioController");
const adminController = require("../../controllers/adminController");


function initializeExtentionWebSocket(server) {
    const io = new Server(server ,
        {
            path: '/ws-extention',
            cors:{
                origin: "*"
            }
        })

    io.use((socket, next) => {
        return next();
    });

   /* io.on('connection', async (socket) => {
        socket.on('tabInfo', infoController.postTabInfoWS);
        socket.on('browserInfo', infoController.postBrowserInfoWS);
        socket.on("validaTab", (msg)=>{
            validacioController.postValidacioWS(msg, (tabId, status)=>{
                socket.emit('respostaTab', {tabId:tabId, do:status});
            })
            }
        )
    });*/
    io.on('connection', (socket) => {
        console.log('Un client s\'ha connectat');

        socket.on('disconnect', () => {
            console.log('El client s\'ha desconnectat');
        });

        socket.on('message', (data) => {
            console.log('Missatge rebut del client:', data);

            // Enviar missatge de resposta
            socket.emit('reply', 'Missatge rebut: ' + data);
        });
    });



}

module.exports = initializeExtentionWebSocket;
