import {drawHistorialWeb, drawHistorialApps} from "./sidebar.js";
import {drawAlumnesActivity, preparaAlumnesGrups} from "./activity.js";
import {setnormesWebInfo, setnormesAppsInfo} from "./dialogs.js";
import {warnNormesWeb} from "./warnings.js";
import {socket} from "./socket.js";

socket.on('alumnesActivity', function (data) {
    drawAlumnesActivity(data);
});

socket.on('grupAlumnesList', function (data) {
    preparaAlumnesGrups(data);
});

socket.on('normesWeb', function (data) {
    setnormesWebInfo(data);
    warnNormesWeb(data);
});

socket.on('normesApps', function (data) {
    setnormesAppsInfo(data);
});

socket.on('historialWebAlumne', function (data) {
    drawHistorialWeb(data.alumne, data.historial);
});

socket.on('historialAppsAlumne', function (data) {
    drawHistorialApps(data.alumne, data.historial);
});

socket.on('connect', function () {
    console.log('Connected to server');
});

// Gestiona errors d'autenticació
socket.on('connect_error', (error) => {
    console.log('Error d\'autenticació:', error.message);
    window.location.href = "login.html";
});

