import {socket} from "./socket.js";

let grupAlumnesList = {}
let alumnesMachines = {}

function compareMachines(m1, m2) {
    try{
        if(Object.keys(m1).toString() !== Object.keys(m2).toString()) return false;
        for (let key in m1) {
            if(m1[key].connected !== m2[key].connected) return false;
            if(m1[key].ip !== m2[key].ip) return false;
        }

        return true
    }
    catch (e) {
        return false;
    }
}

export function drawGridGrup_update(updatedData) {
    const grupSelector = document.getElementById("grupSelector");
    const grup = grupSelector.value;
    if(!grup) return;

    for (let alumne in updatedData) {
        if(!grupAlumnesList[grup] || !grupAlumnesList[grup].alumnes[alumne]) continue;
        if(Object.keys(updatedData[alumne]).length === 0) continue;
        if(compareMachines(alumnesMachines[alumne], updatedData[alumne])) continue;
        const oldGridItem = document.getElementById("grid-item-" + alumne);
        if(!oldGridItem) continue;
        const maquina = Object.values(updatedData[alumne])[0];
        if(!maquina) continue;
        const gridItem = drawGridItem(alumne, maquina);
        const grid = document.getElementById("grid-container");
        grid.replaceChild(gridItem, oldGridItem);
    }

    setAlumnesMachine(updatedData);
}

function drawGridItem(alumne, maquina) {
    const gridItem = document.createElement("div");
    gridItem.classList.add("grid-item");
    gridItem.setAttribute("id", "grid-item-" + alumne);

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

    // Botó visió incognit
    const buttonIncognito = document.createElement("button");
    buttonIncognito.classList.add("btn", "btn-sm", "btn-dark");
    buttonIncognito.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-incognito" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="m4.736 1.968-.892 3.269-.014.058C2.113 5.568 1 6.006 1 6.5 1 7.328 4.134 8 8 8s7-.672 7-1.5c0-.494-1.113-.932-2.83-1.205l-.014-.058-.892-3.27c-.146-.533-.698-.849-1.239-.734C9.411 1.363 8.62 1.5 8 1.5s-1.411-.136-2.025-.267c-.541-.115-1.093.2-1.239.735m.015 3.867a.25.25 0 0 1 .274-.224c.9.092 1.91.143 2.975.143a30 30 0 0 0 2.975-.143.25.25 0 0 1 .05.498c-.918.093-1.944.145-3.025.145s-2.107-.052-3.025-.145a.25.25 0 0 1-.224-.274M3.5 10h2a.5.5 0 0 1 .5.5v1a1.5 1.5 0 0 1-3 0v-1a.5.5 0 0 1 .5-.5m-1.5.5q.001-.264.085-.5H2a.5.5 0 0 1 0-1h3.5a1.5 1.5 0 0 1 1.488 1.312 3.5 3.5 0 0 1 2.024 0A1.5 1.5 0 0 1 10.5 9H14a.5.5 0 0 1 0 1h-.085q.084.236.085.5v1a2.5 2.5 0 0 1-5 0v-.14l-.21-.07a2.5 2.5 0 0 0-1.58 0l-.21.07v.14a2.5 2.5 0 0 1-5 0zm8.5-.5h2a.5.5 0 0 1 .5.5v1a1.5 1.5 0 0 1-3 0v-1a.5.5 0 0 1 .5-.5"/>
    </svg>`;
    buttonIncognito.onclick = () => {
        // Open link in new tab
        window.open(`http://${maquina.ip}:6080/vnc.html?reconnect&viewonly=true&name=${alumne}`, '_blank');
    }
    itemButtons.appendChild(buttonIncognito);
    
    
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
    buttonFreeze.style.display = "none"; // TODO: funcionalitat amagada

    function setButtonFreezeText(estat) {
        buttonFreeze.setAttribute("data-estat", estat);
        if (estat === "pausa") {
            buttonFreeze.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 16 16">
                  <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5"/>
                </svg>`;
        }
        else{
            buttonFreeze.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-play" viewBox="0 0 16 16">
              <path d="M10.804 8 5 4.633v6.734zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696z"/>
                </svg>`;
        }
    }
    setButtonFreezeText("pausa");

    buttonFreeze.onclick = () => {
        const estat = buttonFreeze.getAttribute("data-estat");
        if (estat === "pausa") {
            socket.emit('sendCommandToAlumne', {alumne: alumne, command: "pausa"});
            setButtonFreezeText("repren");

        } else{
            socket.emit('sendCommandToAlumne', {alumne: alumne, command: "repren"});
            setButtonFreezeText("pausa");


        }
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

    if(!maquina.connected) {
        iframe.src = "";
        gridItem.classList.add("offline");
        // Desactiva els botons
        buttonFull.disabled = true;
        buttonIncognito.disabled = true;
        buttonScript.disabled = true;
        buttonFreeze.disabled = true;
        buttonOff.disabled = true
    }
    else {
        iframe.setAttribute("src",
            `http://${maquina.ip}:6080/vnc_iframe.html?password=fpb123&reconnect&name=${alumne}`);
        gridItem.classList.add("online");
        // Reactiva els botons
        buttonFull.disabled = false;
        buttonIncognito.disabled = false;
        buttonScript.disabled = false;
        buttonFreeze.disabled = false;
        buttonOff.disabled = false;
    }

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

    return gridItem;
}

function drawGridGrup(grupName){

    // Botó de veure tots els navegadors
    const globalGroupBrowsersView = document.getElementById('globalGroupBrowsersView');
    globalGroupBrowsersView.addEventListener('click', () => {
        window.location.href = "../browsers?grup=" + grupName;
    });

    // Ja es poden activar els botons de grup
    document.getElementById('globalGroupPowerOffButton').disabled = false;

    // Fes el grid
    const grid = document.getElementById("grid-container");
    grid.innerHTML = "";
    const grup = grupAlumnesList[grupName];
    for (let alumne in grup.alumnes) {
        if(!alumnesMachines[alumne]) continue;
        if(Object.keys(alumnesMachines[alumne]).length === 0) continue;
        const maquina = Object.values(alumnesMachines[alumne])[0];
        const gridItem = drawGridItem(alumne, maquina);
        grid.appendChild(gridItem);
    }
}

export function preparaSelectorGrups() {
    // Llegeix el parametre grup de la query
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
