import {socket} from "./socket.js";
import {drawGridGrup_update, preparaSelectorGrups, setAlumnesMachine, setGrupAlumnesList} from "./screens.js";

let grups_disponibles = false;
let maquines_disponibles = false;

// Botons principals
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
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('go', 'screens');
    window.location.href = "/admin/login?" + urlParams.toString();
});

socket.on('grupAlumnesList', function (data) {
    grups_disponibles = true;
    setGrupAlumnesList(data);

    if (grups_disponibles && maquines_disponibles)
        preparaSelectorGrups();
    }
);

socket.on('alumnesMachine', function (data) {
    maquines_disponibles = true;
    setAlumnesMachine(data);
    if(grups_disponibles && maquines_disponibles)
        preparaSelectorGrups()
});

socket.on('updateAlumnesMachine', function (data) {
    drawGridGrup_update(data);
});
