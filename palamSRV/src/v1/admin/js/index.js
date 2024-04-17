import {drawHistorialWeb, drawHistorialApps, drawHistorialStats, drawHistorialHostsSortedByUsage} from "./sidebar.js";
import {drawAlumnesActivity, preparaAlumnesGrups} from "./activity.js";
import {setnormesWebInfo, setnormesAppsInfo} from "./dialogs.js";
import {warnNormesWeb} from "./warnings.js";
import {socket} from "./socket.js";

function errorSendLog(e) {
    fetch('/api/v1/error/front', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({error:e.stack}),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

socket.on('alumnesActivity', function (data) {
    try {
        drawAlumnesActivity(data);
    } catch (e) {
        console.error(e);
        errorSendLog(e);
    }
});

socket.on('grupAlumnesList', function (data) {
    try {
        preparaAlumnesGrups(data);
    } catch (e) {
        console.error(e);
        errorSendLog(e);
    }
});

socket.on('normesWeb', function (data) {
    try {
        setnormesWebInfo(data);
        warnNormesWeb(data);
    } catch (e) {
        console.error(e);
        errorSendLog(e);
    }
});

socket.on('normesApps', function (data) {
    try {
        setnormesAppsInfo(data);
    } catch (e) {
        console.error(e);
        errorSendLog(e);
    }
});

socket.on('historialWebAlumne', function (data) {
    try {
        drawHistorialWeb(data.alumne, data.historial, data.query);
    } catch (e) {
        console.error(e);
        errorSendLog(e);
    }
});

socket.on('historialAppsAlumne', function (data) {
    try {
        drawHistorialApps(data.alumne, data.historial);
    } catch (e) {
        console.error(e);
        errorSendLog(e);
    }
});

socket.on('eachBrowserLastUsage', function (data) {
    try {
        drawHistorialStats(data.alumne, data.lastUsage);
    } catch (e) {
        console.error(e);
        errorSendLog(e);
    }
});

socket.on('historialHostsSortedByUsage', function (data) {
    try {
        drawHistorialHostsSortedByUsage(data.alumne, data.sortedHistorial, data.days);
    } catch (e) {
        console.error(e);
        errorSendLog(e);
    }
});

socket.on('connect', function () {
    console.log('Connected to server');
});

// Gestiona errors d'autenticació
socket.on('connect_error', (error) => {
    console.log('Error d\'autenticació:', error.message);
    window.location.href = "login.html";
});

