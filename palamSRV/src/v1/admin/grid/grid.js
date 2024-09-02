import {socket} from "../js/socket.js";
import {preparaSelectorGrups} from "./activity.js";

// Botons principals
const globalGroupNormalViewButton = document.getElementById('globalGroupNormalViewButton');
globalGroupNormalViewButton.addEventListener('click', () => {
    window.location.href = "/admin";
});

const globalGroupPowerOffButton = document.getElementById('globalGroupPowerOffButton');
globalGroupPowerOffButton.addEventListener('click', () => {
    const currentGrup = document.getElementById('grupSelector').value;
    socket.emit('powerOffAll', {
        grup: currentGrup
    });
});


socket.on('connect', function () {
    console.log('Connected to server');
});

// Gestiona errors d'autenticació
socket.on('connect_error', (error) => {
    console.log('Error d\'autenticació:', error.message);
    window.location.href = "/admin/login.html";
});

socket.on('grupAlumnesList', function (data) {
    try {
        preparaSelectorGrups(data);
    } catch (e) {
        console.error(e);
    }
});


socket.on('getAlumnesMachine', function (data) {
    setAlumnesMachine(data);
});
