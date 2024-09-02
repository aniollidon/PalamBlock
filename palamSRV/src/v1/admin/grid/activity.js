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
        // Botó d'executar script
        const buttonScript = document.createElement("button");
        buttonScript.classList.add("btn", "btn-sm", "btn-dark");
        buttonScript.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-code" viewBox="0 0 16 16">
              <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5z"/>
              <path d="M8.646 6.646a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L10.293 9 8.646 7.354a.5.5 0 0 1 0-.708m-1.292 0a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0 0 .708l2 2a.5.5 0 0 0 .708-.708L5.707 9l1.647-1.646a.5.5 0 0 0 0-.708"/>
            </svg>`;
        buttonScript.onclick = () => {
            // TODO
        }
        itemButtons.appendChild(buttonScript);
        // Botó de congelar
        const buttonFreeze = document.createElement("button");
        buttonFreeze.classList.add("btn", "btn-sm", "btn-primary");
        buttonFreeze.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 16 16">
          <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5"/>
        </svg>`;
        buttonFreeze.onclick = () => {
            // TODO
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
            // TODO
        }
        itemButtons.appendChild(buttonOff);
        gridItemContentHeader.appendChild(itemButtons);
        gridItem.appendChild(gridItemContentHeader);

        const gridItemContentScreen = document.createElement("div");
        gridItemContentScreen.classList.add("grid-item-content-screen");
        const iframe = document.createElement("iframe");
        const alumneIP = alumnesMachines[alumne].ip;
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
