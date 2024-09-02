import {socket} from "../js/socket.js";
import {preparaSelectorGrups, setAlumnesMachine, setGrupAlumnesList} from "./activity.js";

let grups_disponibles = false;
let maquines_disponibles = false;

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
    grups_disponibles = true;
    setGrupAlumnesList(data);

    if (grups_disponibles && maquines_disponibles)
        preparaSelectorGrups();
    }
);


socket.on('getAlumnesMachine', function (data) {
    maquines_disponibles = true;
    setAlumnesMachine(data);
    if(grups_disponibles && maquines_disponibles)
        preparaSelectorGrups()
});
