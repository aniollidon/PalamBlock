import {socket} from "../js/socket.js";

let grupAlumnesList = {}
let alumnesMachines = {}

function drawGridGrup(grupName){

    // Ja es poden activar els botons de grup
    document.getElementById('globalGroupPowerOffButton').disabled = false;

    // Fes el grid
    const grid = document.getElementById("grid-container");
    grid.innerHTML = "";
    const grup = grupAlumnesList[grupName];
    for (let alumne in grup.alumnes) {
        if(!alumnesMachines[alumne]) continue;
        if(Object.keys(alumnesMachines[alumne]).length === 0) continue;

        const gridItem = document.createElement("div");
        gridItem.classList.add("grid-item");

        const gridItemContentHeader = document.createElement("div");
        gridItemContentHeader.classList.add("grid-item-content-header");

        const gridItemContentHeaderName = document.createElement("div");
        gridItemContentHeaderName.classList.add("grid-item-content-header-name");
        const h3 = document.createElement("h3");
        h3.innerHTML = `Alumne: ${alumne}`;
        gridItemContentHeaderName.appendChild(h3);
        gridItemContentHeader.appendChild(gridItemContentHeaderName);

        const itemButtons = document.createElement("div");
        itemButtons.classList.add("grid-item-buttons");
        // Botó de pantalla completa
        const buttonFull = document.createElement("button");
        buttonFull.classList.add("btn", "btn-sm", "btn-dark");
        buttonFull.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrows-fullscreen" viewBox="0 0 16 16">
                              <path fill-rule="evenodd" d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707m4.344 0a.5.5 0 0 1 .707 0l4.096 4.096V11.5a.5.5 0 1 1 1 0v3.975a.5.5 0 0 1-.5.5H11.5a.5.5 0 0 1 0-1h2.768l-4.096-4.096a.5.5 0 0 1 0-.707m0-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707m-4.344 0a.5.5 0 0 1-.707 0L1.025 1.732V4.5a.5.5 0 0 1-1 0V.525a.5.5 0 0 1 .5-.5H4.5a.5.5 0 0 1 0 1H1.732l4.096 4.096a.5.5 0 0 1 0 .707"/>
                            </svg>`;
        buttonFull.onclick = () => {
            iframe.requestFullscreen();
        }
        itemButtons.appendChild(buttonFull);
        // Botó actualitzar script
        const buttonScript = document.createElement("button");
        buttonScript.classList.add("btn", "btn-sm", "btn-dark");
        buttonScript.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-upload" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773 16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805 1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383"/>
  <path fill-rule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708z"/>
</svg>`;
        buttonScript.onclick = () => {
            socket.emit('sendCommandToAlumne', {alumne: alumne, command: "actualitza"});
        }
        itemButtons.appendChild(buttonScript);
        // Botó de congelar
        const buttonFreeze = document.createElement("button");
        buttonFreeze.classList.add("btn", "btn-sm", "btn-primary");
        buttonFreeze.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 16 16">
          <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5"/>
        </svg>`;
        buttonFreeze.onclick = () => {
            socket.emit('sendCommandToAlumne', {alumne: alumne, command: "pausa"});
        }
        itemButtons.appendChild(buttonFreeze);

        // Botó d'apagar
        const buttonOff = document.createElement("button");
        buttonOff.classList.add("btn", "btn-sm", "btn-danger");
        buttonOff.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-power" viewBox="0 0 16 16">
                              <path d="M7.5 1v7h1V1z"/>
                              <path d="M3 8.812a5 5 0 0 1 2.578-4.375l-.485-.874A6 6 0 1 0 11 3.616l-.501.865A5 5 0 1 1 3 8.812"/>
                            </svg>`;
        buttonOff.onclick = () => {
            socket.emit('sendCommandToAlumne', {alumne: alumne, command: "hibernar"});
        }
        itemButtons.appendChild(buttonOff);
        gridItemContentHeader.appendChild(itemButtons);
        gridItem.appendChild(gridItemContentHeader);

        const gridItemContentScreen = document.createElement("div");
        gridItemContentScreen.classList.add("grid-item-content-screen");
        const iframe = document.createElement("iframe");
        const alumneIP = Object.values(alumnesMachines[alumne])[0].ip;
        iframe.setAttribute("src",
            `http://${alumneIP}:6080/vnc_iframe.html?password=fpb123&reconnect&name=${alumne}`); // TODO
        iframe.setAttribute("width", "400px");
        iframe.setAttribute("height", "225px");
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute("scrolling", "no");
        iframe.style.backgroundImage = "url('../img/offline.jpg')";
        iframe.style.backgroundPosition = "center";
        iframe.style.backgroundRepeat = "no-repeat";
        iframe.style.backgroundSize = "contain";
        const overlay = document.createElement("div");
        overlay.classList.add("overlay");
        overlay.onclick = () => {
            iframe.requestFullscreen();
        }
        gridItemContentScreen.appendChild(overlay);
        gridItemContentScreen.appendChild(iframe);
        gridItem.appendChild(gridItemContentScreen);


        grid.appendChild(gridItem);
    }
}

export function preparaSelectorGrups() {
    // Lllegeix el parametre grup de la query
    const urlParams = new URLSearchParams(window.location.search);
    const grupGET = urlParams.get('grup');

    // Prepara el selector de grups
    const grupSelector = document.getElementById("grupSelector");
    grupSelector.innerHTML = "";
    const option = document.createElement("option");
    option.innerHTML = "Selecciona un grup";
    option.setAttribute("selected", "selected");
    option.setAttribute("disabled", "disabled");
    grupSelector.appendChild(option);

    for (let grup in grupAlumnesList) {
        const option = document.createElement("option");
        option.setAttribute("value", grup);
        option.innerHTML = grup;
        if (grupGET === grup) {
            option.setAttribute("selected", "selected");
            drawGridGrup(grupGET);
            // Neteja la query
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        grupSelector.appendChild(option);
    }

    grupSelector.onchange = (ev) => {
        drawGridGrup(ev.target.value);
    }
}


export function setAlumnesMachine(data) {
    alumnesMachines = data;
}

export function setGrupAlumnesList(data) {
    grupAlumnesList = data;
}
