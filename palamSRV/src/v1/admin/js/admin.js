const authUser = localStorage.getItem("user");
const authToken = localStorage.getItem("authToken");

const socket = io(':4000', {
    query: {
        user: authUser,
        authToken: authToken
    }
});

const hblockModalWeb = document.getElementById('bloquejaModalWeb')
const blockModalWeb = new bootstrap.Modal(hblockModalWeb)
const hblockModalApps = document.getElementById('bloquejaModalApps')
const blockModalApps = new bootstrap.Modal(hblockModalApps)
const hnormesModal = document.getElementById('normesModal')
const normesModal = new bootstrap.Modal(hnormesModal)
let normesWebInfo = {}
let normesAppsInfo = {}
let grupAlumnesList = {}
let visibilityAlumnes = {}
let chromeTabsObjects = {}
const storedAlumneInfo = {}

function eliminarUpdateAt(obj) {
    if (obj && typeof obj === 'object') {
        for (const clave in obj) {
            if (clave === 'updatedAt') {
                delete obj[clave];
            } else {
                eliminarUpdateAt(obj[clave]);
            }
        }
    }
}

function compareNoUpdateAt(oobj1, oobj2) {
    //copia els objectes per no modificar els originals
    const obj1 = JSON.parse(JSON.stringify(oobj1));
    const obj2 = JSON.parse(JSON.stringify(oobj2));

    eliminarUpdateAt(obj1);
    eliminarUpdateAt(obj2);

    const strobj1 = JSON.stringify(obj1);
    const strobj2 = JSON.stringify(obj2);

    return strobj1 === strobj2;
}

function getGrup(alumneId) {
    for (let grup in grupAlumnesList) {
        if (alumneId in grupAlumnesList[grup].alumnes)
            return grup;
    }

    return undefined
}

function creaAppMenuJSON(alumne, app) {
    // Opcions del menu contextual

    const onBloqueja = (info) => {
        obreDialogBloquejaApps(info, alumne, "blocalumn");
    }
    const onTanca = (info) => {
        //console.log("onTanca app")
    }

    return [
        {text: "Tanca " + app, do: onTanca},
        {text: "Bloqueja " + app, do: onBloqueja}
    ]
}

function creaWebMenuJSON(alumne) {
    // Opcions del menu contextual
    const obreUrl = (info) => {
        const url = info.webPage.protocol + "//" + info.webPage.host + info.webPage.pathname + info.webPage.search
        window.open(url, '_blank').focus();

    }
    const onBloqueja = (info) => {
        obreDialogBloquejaWeb(info, alumne, "blocalumn");
    }

    const onBloquejaGrup = (info) => {
        obreDialogBloquejaWeb(info, alumne, "blocgrup");
    }

    const onAfegeixLlistaBlanca = (info) => {
        obreDialogBloquejaWeb(info, alumne, "llistablanca");
    }

    return [
        {text: "Obre aquí", do: obreUrl},
        {text: "Bloqueja", do: onBloqueja},
        {text: "Bloqueja al grup", do: onBloquejaGrup},
        {text: "Afegeix a llista blanca", do: onAfegeixLlistaBlanca},
    ]
}

function toogleHistorial(alumne, tipus = "web") {
    const historialSidebar = document.getElementById("historialSidebar");

    const prevTipus = historialSidebar.getAttribute("data-historial");
    const prevAlumne = historialSidebar.getAttribute("data-alumne");

    historialSidebar.setAttribute("data-historial", tipus);
    historialSidebar.setAttribute("data-alumne", alumne);

    if (prevTipus !== tipus || prevAlumne !== alumne || historialSidebar.style.display.includes("none")) {
        if (tipus === "web")
            socket.emit("getHistorialWeb", {alumne: alumne});
        else
            socket.emit("getHistorialApps", {alumne: alumne});

        const historialSideBarTitle = document.getElementById("historialSidebarTitle");
        const historialSideBarContent = document.getElementById("historialSidebarContent");
        historialSideBarTitle.innerHTML = `Historial ${(tipus === "web" ? "web" : "d'Apps")} de l'alumne ${alumne}`;
        historialSideBarContent.innerHTML = "";
        historialSidebar.style.display = "";
    } else {
        historialSidebar.style.setProperty('display', 'none', 'important');
        // Refresca els chrome tabs
        if (chromeTabsObjects[alumne])
            for (let b in chromeTabsObjects[alumne])
                chromeTabsObjects[alumne][b].layoutTabs();
    }


}

function obreDialogBloquejaWeb(info, alumne, action, severity = "block") {
    const ugrup = getGrup(alumne);
    const ualumne = alumne.toUpperCase();
    const blocalumnLink = document.getElementById("pills-blocwebalumn-tab");
    const blocgrupLink = document.getElementById("pills-blocwebgrup-tab");
    const llistablancaLink = document.getElementById("pills-llistablancawebweb-tab");
    const severitySelect = document.getElementById("pbk_modalblockweb_severity");
    const hostInput = document.getElementById("pbk_modalblockweb_host");
    const pathnameInput = document.getElementById("pbk_modalblockweb_pathname");
    const searchInput = document.getElementById("pbk_modalblockweb_search");
    const titleInput = document.getElementById("pbk_modalblockweb_title");
    const hostSwitch = document.getElementById("pbk_modalblockweb_host_switch");
    const pathnameSwitch = document.getElementById("pbk_modalblockweb_pathname_switch");
    const searchSwitch = document.getElementById("pbk_modalblockweb_search_switch");
    const titleSwitch = document.getElementById("pbk_modalblockweb_title_switch");
    const normaButton = document.getElementById("pbk_modalblockweb_creanorma");
    let normaWhoSelection = "alumne";
    let normaWhoId = alumne;
    let normaMode = "blacklist";

    blocalumnLink.innerHTML = `Bloqueja ${ualumne}`;
    blocgrupLink.innerHTML = `Bloqueja ${ugrup}`;
    llistablancaLink.innerHTML = `Crea llista blanca ${ugrup}`;

    severitySelect.value = severity;
    hostInput.value = info.webPage.host;
    pathnameInput.value = info.webPage.pathname;
    searchInput.value = info.webPage.search;
    titleInput.value = info.webPage.title;


    if (info.webPage.pathname === "/" || info.webPage.pathname === "") {
        pathnameSwitch.checked = false;
        pathnameInput.setAttribute("disabled", "disabled");
    } else {
        pathnameSwitch.checked = true;
        pathnameInput.removeAttribute("disabled");
    }

    hostSwitch.checked = true;
    searchSwitch.checked = false;
    searchInput.setAttribute("disabled", "disabled");
    titleSwitch.checked = false;
    titleInput.setAttribute("disabled", "disabled");

    blocalumnLink.onclick = (event) => {
        normaWhoSelection = "alumne";
        normaWhoId = alumne;
        normaMode = "blacklist";
    };

    blocgrupLink.onclick = (event) => {
        normaWhoSelection = "grup";
        normaWhoId = ugrup;
        normaMode = "blacklist";
    };

    llistablancaLink.onclick = (event) => {
        normaWhoSelection = "grup";
        normaWhoId = ugrup;
        normaMode = "whitelist";
    };

    hostSwitch.onchange = (event) => {
        if (event.target.checked)
            hostInput.removeAttribute("disabled");
        else
            hostInput.setAttribute("disabled", "disabled");
    };

    pathnameSwitch.onchange = (event) => {
        if (event.target.checked)
            pathnameInput.removeAttribute("disabled");
        else
            pathnameInput.setAttribute("disabled", "disabled");
    };

    searchSwitch.onchange = (event) => {
        if (event.target.checked)
            searchInput.removeAttribute("disabled");
        else
            searchInput.setAttribute("disabled", "disabled");
    };

    titleSwitch.onchange = (event) => {
        if (event.target.checked)
            titleInput.removeAttribute("disabled");
        else
            titleInput.setAttribute("disabled", "disabled");
    };

    if (action === "blocalumn") {
        blocalumnLink.click();
    } else if (action === "blocgrup") {
        blocgrupLink.click();
    } else if (action === "llistablanca") {
        llistablancaLink.click();
    }

    normaButton.onclick = (event) => {
        socket.emit("addNormaWeb", {
            who: normaWhoSelection,
            whoid: normaWhoId,
            severity: severitySelect.value,
            mode: normaMode,
            hosts_list: hostSwitch.checked ? [hostInput.value] : undefined,
            //protocols_list: undefined,
            searches_list: searchSwitch.checked ? [searchInput.value] : undefined,
            pathnames_list: pathnameSwitch.checked ? [pathnameInput.value] : undefined,
            titles_list: titleSwitch.checked ? [titleInput.value] : undefined,
            //enabled_on: undefined
        })

        blockModalWeb.hide();
    };

    blockModalWeb.show();
}

function obreDialogBloquejaApps(info, alumne, action, severity = "block") {
    const ugrup = getGrup(alumne);
    const ualumne = alumne.toUpperCase();
    const blocalumnLink = document.getElementById("pills-blockappsalumn-tab");
    const blocgrupLink = document.getElementById("pills-blockappsgrup-tab");
    const severitySelect = document.getElementById("pbk_modalblockapps_severity");
    const processInput = document.getElementById("pbk_modalblockapp_process");
    const processSwitch = document.getElementById("pbk_modalblockapp_process_switch");
    const filepathInput = document.getElementById("pbk_modalblockapp_filepath");
    const filepathSwitch = document.getElementById("pbk_modalblockapp_filepath_switch");
    const filepathregexSwitch = document.getElementById("pbk_modalblockapp_filepathregex_switch");
    const normaButton = document.getElementById("pbk_modalblockapps_creanorma");
    let normaWhoSelection = "alumne";
    let normaWhoId = alumne;

    blocalumnLink.innerHTML = `Bloqueja ${ualumne}`;
    blocgrupLink.innerHTML = `Bloqueja ${ugrup}`;

    if (action === "blocalumn") {
        blocalumnLink.click();
    } else if (action === "blocgrup") {
        blocgrupLink.click();
    }

    severitySelect.value = severity;
    processInput.value = info.name;
    filepathInput.value = info.path;
    filepathInput.setAttribute("disabled", "disabled");
    filepathregexSwitch.checked = false;
    filepathregexSwitch.setAttribute("disabled", "disabled");

    processSwitch.onchange = (event) => {
        if (event.target.checked) {
            processInput.removeAttribute("disabled");
            filepathInput.setAttribute("disabled", "disabled");
            filepathregexSwitch.setAttribute("disabled", "disabled");

        } else {
            processInput.setAttribute("disabled", "disabled");
            filepathInput.removeAttribute("disabled");
            filepathregexSwitch.removeAttribute("disabled");
        }
        filepathSwitch.checked = !event.target.checked;
    }

    filepathSwitch.onchange = (event) => {
        if (event.target.checked) {
            processInput.setAttribute("disabled", "disabled");
            filepathInput.removeAttribute("disabled");
            filepathregexSwitch.removeAttribute("disabled");
        } else {
            processInput.removeAttribute("disabled");
            filepathInput.setAttribute("disabled", "disabled");
            filepathregexSwitch.setAttribute("disabled", "disabled");
        }
        processSwitch.checked = !event.target.checked;
    };

    blocalumnLink.onclick = (event) => {
        normaWhoSelection = "alumne";
        normaWhoId = alumne;
    };

    blocgrupLink.onclick = (event) => {
        normaWhoSelection = "grup";
        normaWhoId = ugrup;
    };


    normaButton.onclick = (event) => {
        socket.emit("addNormaApps", {
            who: normaWhoSelection,
            whoid: normaWhoId,
            severity: severitySelect.value,
            processName: (processSwitch.checked ? processInput.value : undefined),
            processPath: (filepathSwitch.checked ? filepathInput.value : undefined),
            processPathisRegex: (filepathSwitch.checked ? filepathregexSwitch.checked : undefined)
        })

        blockModalApps.hide();
    };

    blockModalApps.show();
}

function obreDialogNormesWeb(whoid, who = "alumne") {
    const modalTitle = document.getElementById("pbk_modal_normes_title");
    const container = document.getElementById("pbk_modal_normes");
    const list = document.createElement("div");
    const whos = (who === "alumne" ? "alumnes" : "grups");
    container.innerHTML = "";
    modalTitle.innerHTML = `Normes web per ${whoid}`;

    list.setAttribute("class", "list-group");
    container.appendChild(list);

    for (const norma in normesWebInfo[whos][whoid]) {
        if (normesWebInfo[whos][whoid][norma].removed === true) continue;

        const listItem = document.createElement("div");
        listItem.setAttribute("class", "list-group-item list-group-item-action flex-column align-items-start");
        const itemHeading = document.createElement("div");
        itemHeading.setAttribute("class", "d-flex w-100 justify-content-between");
        const itemTitle = document.createElement("h5");
        itemTitle.setAttribute("class", "mb-1");
        const severity = normesWebInfo[whos][whoid][norma].severity;
        itemTitle.innerHTML = (severity === "block" ? "Bloqueja" : "Avisa");

        if (normesWebInfo[whos][whoid][norma].mode !== "blacklist")
            itemTitle.innerHTML += " si no coincideix";

        const itemSubtitle = document.createElement("small");
        itemSubtitle.innerHTML = normesWebInfo[whos][whoid][norma].enabled_on;
        const trash = document.createElement("button");
        trash.setAttribute("type", "button");
        trash.setAttribute("class", "btn btn-outline-secondary btn-sm");
        trash.innerHTML =
            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"></path>
                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"></path>
            </svg>`

        const pencil = document.createElement("button");
        pencil.setAttribute("type", "button");
        pencil.setAttribute("class", "btn btn-outline-secondary btn-sm mx-1");
        pencil.innerHTML =
            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
            </svg>`
        trash.onclick = (event) => {
            socket.emit("removeNormaWeb", {normaId: norma, who: who, whoid: whoid});
            normesWebInfo[whos][whoid][norma].removed = true;
            obreDialogNormesWeb(whoid, who);
        };
        pencil.onclick = (event) => {
            //TODO edit norma
            alert("Aquesta funció encara no està implementada")
        };
        itemSubtitle.appendChild(trash);
        itemSubtitle.appendChild(pencil);
        itemHeading.appendChild(itemTitle);
        itemHeading.appendChild(itemSubtitle);
        listItem.appendChild(itemHeading);
        const itemText = document.createElement("p");
        itemText.setAttribute("class", "mb-1");
        if (normesWebInfo[whos][whoid][norma].hosts_list.length > 0)
            itemText.innerHTML = "<b>Hosts:</b> " + normesWebInfo[whos][whoid][norma].hosts_list + "<br>";
        if (normesWebInfo[whos][whoid][norma].protocols_list.length > 0)
            itemText.innerHTML += "<b>Protocols:</b> " + normesWebInfo[whos][whoid][norma].protocols_list + "<br>";
        if (normesWebInfo[whos][whoid][norma].searches_list.length > 0)
            itemText.innerHTML += "<b>Searches:</b> " + normesWebInfo[whos][whoid][norma].searches_list + "<br>";
        if (normesWebInfo[whos][whoid][norma].pathnames_list.length > 0)
            itemText.innerHTML += "<b>Pathnames:</b> " + normesWebInfo[whos][whoid][norma].pathnames_list + "<br>";
        if (normesWebInfo[whos][whoid][norma].titles_list.length > 0)
            itemText.innerHTML += "<b>Titles:</b> " + normesWebInfo[whos][whoid][norma].titles_list + "<br>";
        listItem.appendChild(itemText);
        list.appendChild(listItem);
    }
    normesModal.show();
}

function obreDialogNormesApps(whoid, who = "alumne") {
    const modalTitle = document.getElementById("pbk_modal_normes_title");
    const container = document.getElementById("pbk_modal_normes");
    const list = document.createElement("div");
    const whos = (who === "alumne" ? "alumnes" : "grups");

    container.innerHTML = "";
    modalTitle.innerHTML = `Normes d'Apps per ${whoid}`;

    list.setAttribute("class", "list-group");
    container.appendChild(list);

    for (const norma in normesAppsInfo[whos][whoid]) {
        if (normesAppsInfo[whos][whoid][norma].removed === true) continue;

        const listItem = document.createElement("div");
        listItem.setAttribute("class", "list-group-item list-group-item-action flex-column align-items-start");
        const itemHeading = document.createElement("div");
        itemHeading.setAttribute("class", "d-flex w-100 justify-content-between");
        const itemTitle = document.createElement("h5");
        itemTitle.setAttribute("class", "mb-1");
        const severity = normesAppsInfo[whos][whoid][norma].severity;

        switch (severity) {
            case "block":
                itemTitle.innerHTML = "Bloqueja";
                break;
            case "uninstall":
                itemTitle.innerHTML = "Desinstal·la";
                break;
            case "force_uninstall":
                itemTitle.innerHTML = "Desinstal·la bruscament";
                break;
            default:
                itemTitle.innerHTML = "Error";
                break;
        }

        const itemSubtitle = document.createElement("small");
        const trash = document.createElement("button");
        trash.setAttribute("type", "button");
        trash.setAttribute("class", "btn btn-outline-secondary btn-sm");
        trash.innerHTML =
            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"></path>
                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"></path>
            </svg>`

        const pencil = document.createElement("button");
        pencil.setAttribute("type", "button");
        pencil.setAttribute("class", "btn btn-outline-secondary btn-sm mx-1");
        pencil.innerHTML =
            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
            </svg>`
        trash.onclick = (event) => {
            socket.emit("removeNormaApps", {normaId: norma, who: who, whoid: whoid});
            normesAppsInfo[whos][whoid][norma].removed = true;
            obreDialogNormesApps(whoid, who);
        };
        pencil.onclick = (event) => {
            //TODO edit norma
            alert("Aquesta funció encara no està implementada")
        };
        itemSubtitle.appendChild(trash);
        itemSubtitle.appendChild(pencil);
        itemHeading.appendChild(itemTitle);
        itemHeading.appendChild(itemSubtitle);
        listItem.appendChild(itemHeading);
        const itemText = document.createElement("p");
        itemText.setAttribute("class", "mb-1");
        itemText.innerHTML = "";

        if (normesAppsInfo[whos][whoid][norma].processName)
            itemText.innerHTML += "<b>ProcessName:</b> " + normesAppsInfo[whos][whoid][norma].processName + "<br>";
        if (normesAppsInfo[whos][whoid][norma].processPath)
            itemText.innerHTML += "<b>processPath:</b> " + normesAppsInfo[whos][whoid][norma].processPath + "<br>";
        if (normesAppsInfo[whos][whoid][norma].processPathisRegex)
            itemText.innerHTML += "<b>processPath amb regex:</b>actiu<br>";

        listItem.appendChild(itemText);
        list.appendChild(listItem);
    }
    normesModal.show();
}

socket.on('alumnesActivity', function (data) {
    let alumnesList = document.getElementById("alumnesList");
    //alumnesList.innerHTML = "";
    //chromeTabs.removeAllTabs();

    for (const alumne in data) {
        if (Object.hasOwnProperty.call(data, alumne)) {
            const alumneInfo = data[alumne];
            let alumneDiv = undefined;

            // Draw alumne container
            if (!document.getElementById(alumne + "-container")) {
                alumneDiv = document.createElement("div");
                alumneDiv.setAttribute("class", "alumne-container");
                alumneDiv.setAttribute("id", alumne + "-container");
                alumneDiv.style.display = visibilityAlumnes[alumne] ? "" : "none";
            } else {
                alumneDiv = document.getElementById(alumne + "-container");
                alumneDiv.style.display = visibilityAlumnes[alumne] ? "" : "none";
            }

            // Draw alumne header
            if (!document.getElementById(alumne + "-header")) {
                const alumneDivHeader = document.createElement("div");
                alumneDivHeader.setAttribute("class", "alumne-header");
                alumneDivHeader.setAttribute("id", alumne + "-header");
                alumneDiv.appendChild(alumneDivHeader);
                alumneDivHeader.innerHTML = ` <h3>Alumne: ${alumne}</h3>`;
                alumnesList.appendChild(alumneDiv);

                const alumneDivButtons = document.createElement("div");
                alumneDivButtons.setAttribute("class", "alumne-buttons");
                alumneDivHeader.appendChild(alumneDivButtons);

                // Status button
                const alumneStatusButton = document.createElement("div");
                alumneStatusButton.setAttribute("class", "btn-group");
                alumneStatusButton.setAttribute("id", alumne + "-status-button");
                const alumneStatusButtonMain = document.createElement("button");
                alumneStatusButtonMain.setAttribute("type", "button");
                alumneStatusButtonMain.setAttribute("class", "btn dropdown-toggle");
                alumneStatusButtonMain.setAttribute("data-bs-toggle", "dropdown");
                alumneStatusButtonMain.setAttribute("aria-expanded", "false");
                alumneStatusButton.appendChild(alumneStatusButtonMain);
                const alumneStatusButtonDropdown = document.createElement("ul");
                alumneStatusButtonDropdown.setAttribute("class", "dropdown-menu");
                alumneStatusButton.appendChild(alumneStatusButtonDropdown);

                function setAlumneStatus(status) {
                    alumneStatusButtonMain.classList.remove("btn-success");
                    alumneStatusButtonMain.classList.remove("btn-danger");
                    alumneStatusButtonMain.classList.remove("btn-warning");

                    switch (status) {
                        case "RuleOn":
                            alumneStatusButtonMain.classList.add("btn-success");
                            alumneStatusButtonMain.innerHTML = "Filtre actiu";
                            break;
                        case "RuleFree":
                            alumneStatusButtonMain.classList.add("btn-warning");
                            alumneStatusButtonMain.innerHTML = "Desactivat";
                            break;
                        case "Blocked":
                            alumneStatusButtonMain.classList.add("btn-danger");
                            alumneStatusButtonMain.innerHTML = "Bloquejat";
                            break;
                    }
                }

                for (const s of [
                    {id: "RuleOn", text: "Filtre actiu"},
                    {id: "RuleFree", text: "Filtre desactivat"},
                    {id: "Blocked", text: "Tot bloquejat"}
                ]) {
                    const li = document.createElement("li");
                    const a = document.createElement("a");
                    a.setAttribute("class", "dropdown-item");
                    a.setAttribute("id", alumne + "-status-" + s.id);
                    a.innerHTML = s.text;
                    a.onclick = () => {
                        socket.emit("setAlumneStatus", {alumne: alumne, status: s.id});
                        setAlumneStatus(s.id);
                    }
                    li.appendChild(a);
                    alumneStatusButtonDropdown.appendChild(li);
                }

                setAlumneStatus(alumneInfo.status);
                alumneDivButtons.appendChild(alumneStatusButton);
                alumneDivButtons.appendChild(document.createTextNode(' '))


                // Normes web button
                const normesWebButton = document.createElement("button");
                normesWebButton.setAttribute("class", "btn btn-dark");
                normesWebButton.setAttribute("type", "button");
                const NormesWebInner = document.createElement("div");
                NormesWebInner.innerHTML =
                    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-globe-americas" viewBox="0 0 16 16">
                  <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0ZM2.04 4.326c.325 1.329 2.532 2.54 3.717 3.19.48.263.793.434.743.484-.08.08-.162.158-.242.234-.416.396-.787.749-.758 1.266.035.634.618.824 1.214 1.017.577.188 1.168.38 1.286.983.082.417-.075.988-.22 1.52-.215.782-.406 1.48.22 1.48 1.5-.5 3.798-3.186 4-5 .138-1.243-2-2-3.5-2.5-.478-.16-.755.081-.99.284-.172.15-.322.279-.51.216-.445-.148-2.5-2-1.5-2.5.78-.39.952-.171 1.227.182.078.099.163.208.273.318.609.304.662-.132.723-.633.039-.322.081-.671.277-.867.434-.434 1.265-.791 2.028-1.12.712-.306 1.365-.587 1.579-.88A7 7 0 1 1 2.04 4.327Z"/>
                </svg> Normes Web`
                normesWebButton.appendChild(NormesWebInner);

                normesWebButton.onclick = () => obreDialogNormesWeb(alumne, "alumne")
                alumneDivButtons.appendChild(normesWebButton);
                alumneDivButtons.appendChild(document.createTextNode(' '));

                // Historial Web button
                const historialWebButton = document.createElement("button");
                historialWebButton.setAttribute("class", "btn btn-dark");
                historialWebButton.setAttribute("type", "button");
                const historialWebInner = document.createElement("div");
                historialWebInner.innerHTML =
                    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
                  <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022l-.074.997zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.126.342l-.36.933zm1.37.71a7.01 7.01 0 0 0-.439-.27l.493-.87a8.025 8.025 0 0 1 .979.654l-.615.789a6.996 6.996 0 0 0-.418-.302zm1.834 1.79a6.99 6.99 0 0 0-.653-.796l.724-.69c.27.285.52.59.747.91l-.818.576zm.744 1.352a7.08 7.08 0 0 0-.214-.468l.893-.45a7.976 7.976 0 0 1 .45 1.088l-.95.313a7.023 7.023 0 0 0-.179-.483zm.53 2.507a6.991 6.991 0 0 0-.1-1.025l.985-.17c.067.386.106.778.116 1.17l-1 .025zm-.131 1.538c.033-.17.06-.339.081-.51l.993.123a7.957 7.957 0 0 1-.23 1.155l-.964-.267c.046-.165.086-.332.12-.501zm-.952 2.379c.184-.29.346-.594.486-.908l.914.405c-.16.36-.345.706-.555 1.038l-.845-.535zm-.964 1.205c.122-.122.239-.248.35-.378l.758.653a8.073 8.073 0 0 1-.401.432l-.707-.707z"/>
                  <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0v1z"/>
                  <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5z"/>
                </svg> Historial Web`
                historialWebButton.appendChild(historialWebInner);

                historialWebButton.onclick = () => toogleHistorial(alumne, "web")
                alumneDivButtons.appendChild(historialWebButton);
                alumneDivButtons.appendChild(document.createTextNode(' '))

                // Normes App button
                const normesAppButton = document.createElement("button");
                normesAppButton.setAttribute("class", "btn btn-dark");
                normesAppButton.setAttribute("type", "button");
                const NormesAppInner = document.createElement("div");
                NormesAppInner.innerHTML =
                    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-window-stack" viewBox="0 0 16 16">
                  <path d="M4.5 6a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1ZM6 6a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Zm2-.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z"/>
                  <path d="M12 1a2 2 0 0 1 2 2 2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2 2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h10ZM2 12V5a2 2 0 0 1 2-2h9a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1Zm1-4v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8H3Zm12-1V5a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v2h12Z"/>
                </svg> Normes Apps`
                normesAppButton.appendChild(NormesAppInner);

                normesAppButton.onclick = () => obreDialogNormesApps(alumne);
                alumneDivButtons.appendChild(normesAppButton);
                alumneDivButtons.appendChild(document.createTextNode(' '));

                // Historial App button
                const historialAppButton = document.createElement("button");
                historialAppButton.setAttribute("class", "btn btn-dark");
                historialAppButton.setAttribute("type", "button");
                const historialAppInner = document.createElement("div");
                historialAppInner.innerHTML =
                    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
                  <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022l-.074.997zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.126.342l-.36.933zm1.37.71a7.01 7.01 0 0 0-.439-.27l.493-.87a8.025 8.025 0 0 1 .979.654l-.615.789a6.996 6.996 0 0 0-.418-.302zm1.834 1.79a6.99 6.99 0 0 0-.653-.796l.724-.69c.27.285.52.59.747.91l-.818.576zm.744 1.352a7.08 7.08 0 0 0-.214-.468l.893-.45a7.976 7.976 0 0 1 .45 1.088l-.95.313a7.023 7.023 0 0 0-.179-.483zm.53 2.507a6.991 6.991 0 0 0-.1-1.025l.985-.17c.067.386.106.778.116 1.17l-1 .025zm-.131 1.538c.033-.17.06-.339.081-.51l.993.123a7.957 7.957 0 0 1-.23 1.155l-.964-.267c.046-.165.086-.332.12-.501zm-.952 2.379c.184-.29.346-.594.486-.908l.914.405c-.16.36-.345.706-.555 1.038l-.845-.535zm-.964 1.205c.122-.122.239-.248.35-.378l.758.653a8.073 8.073 0 0 1-.401.432l-.707-.707z"/>
                  <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0v1z"/>
                  <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5z"/>
                </svg> Historial Apps`
                historialAppButton.appendChild(historialAppInner);

                historialAppButton.onclick = () => toogleHistorial(alumne, "apps")
                alumneDivButtons.appendChild(historialAppButton);
            }

            // Apps List
            if (!storedAlumneInfo[alumne] || !storedAlumneInfo[alumne].apps || storedAlumneInfo[alumne].apps !== alumneInfo.apps) {
                let alumneAppsDiv = undefined;

                if (!document.getElementById(alumne + "-apps")) {
                    alumneAppsDiv = document.createElement("div");
                    alumneAppsDiv.setAttribute("class", "apps");
                    alumneAppsDiv.setAttribute("id", alumne + "-apps");
                    alumneDiv.appendChild(alumneAppsDiv);
                } else {
                    alumneAppsDiv = document.getElementById(alumne + "-apps");
                    alumneAppsDiv.innerHTML = "";
                }

                const w11_nav_container = document.createElement("div");
                w11_nav_container.setAttribute("class", "w11 w11-nav-container");
                const w11_first_container = document.createElement("div");
                w11_first_container.setAttribute("class", "w11 w11-first-container");

                for (const app in alumneInfo.apps) {
                    if (Object.hasOwnProperty.call(alumneInfo.apps, app)) {
                        const appInfo = alumneInfo.apps[app];
                        if (!appInfo.opened) continue;
                        const w11_app = document.createElement("div");
                        w11_app.setAttribute("class", "w11 app-div");
                        w11_app.setAttribute("title", appInfo.name + ": " + appInfo.title);
                        if (appInfo.iconB64) {
                            const icon = document.createElement("img");
                            icon.setAttribute("src", "data:image/png;base64," + appInfo.iconB64);
                            icon.setAttribute("class", "app-icon");
                            icon.setAttribute("style", "width: 90%; height: 90%;");
                            w11_app.appendChild(icon);
                        } else if (appInfo.iconSVG) {
                            const icon = document.createElement("span");
                            icon.setAttribute("class", "app-icon");
                            icon.setAttribute("style", "width: 90%; height: 90%;");
                            icon.innerHTML = appInfo.iconSVG;
                            w11_app.appendChild(icon);
                        } else {
                            const defaultIcon = document.createElement("img");
                            defaultIcon.setAttribute("src", "img/undefined_app.png");
                            defaultIcon.setAttribute("class", "app-icon");
                            defaultIcon.setAttribute("style", "width: 90%; height: 90%;");
                            w11_app.appendChild(defaultIcon);
                        }

                        w11_app.onclick = (event) => {
                            const menu_options = creaAppMenuJSON(alumne, appInfo.name);
                            openMenu(event, menu_options, appInfo);
                        }
                        w11_first_container.appendChild(w11_app);
                    }
                }

                w11_nav_container.appendChild(w11_first_container);
                alumneAppsDiv.appendChild(w11_nav_container);

            }

            // Browsers List
            let alumneBrowsersDiv = undefined;

            if (!document.getElementById(alumne + "-browsers")) {
                alumneBrowsersDiv = document.createElement("div");
                alumneBrowsersDiv.setAttribute("class", "browsers");
                alumneBrowsersDiv.setAttribute("id", alumne + "-browsers");
                alumneDiv.appendChild(alumneBrowsersDiv);
            } else {
                alumneBrowsersDiv = document.getElementById(alumne + "-browsers");
            }

            for (const browser in alumneInfo.browsers) {
                if (Object.hasOwnProperty.call(alumneInfo.browsers, browser)) {
                    const browserInfo = alumneInfo.browsers[browser];

                    if (!storedAlumneInfo[alumne]
                        || !storedAlumneInfo[alumne].browsers
                        || !storedAlumneInfo[alumne].browsers[browser]
                        || !compareNoUpdateAt(storedAlumneInfo[alumne].browsers[browser], browserInfo)) {

                        // Create a browser
                        let browserDiv = undefined;

                        if (!document.getElementById(browser + "-browser")) {
                            browserDiv = document.createElement("div");
                            browserDiv.setAttribute("class", "chrome-tabs");
                            browserDiv.setAttribute("id", browser + "-browser");
                            browserDiv.style = "--tab-content-margin: 9px;";
                            browserDiv.setAttribute("data-chrome-tabs-instance-id", browser);
                            alumneBrowsersDiv.appendChild(browserDiv);
                        } else {
                            browserDiv = document.getElementById(browser + "-browser");
                            browserDiv.innerHTML = "";
                        }

                        // Check if browser is opened
                        if (!browserInfo.opened) {
                            // delete browser
                            browserDiv.remove();
                            continue;
                        }

                        const browserInfoDiv = document.createElement("div");
                        browserInfoDiv.setAttribute("class", "browser-info");
                        const browserIcon = document.createElement("img");
                        browserIcon.setAttribute("src", "img/" + browserInfo.browser.toLowerCase() + ".png");
                        browserIcon.setAttribute("class", "browser-icon");
                        browserInfoDiv.appendChild(browserIcon);
                        browserDiv.appendChild(browserInfoDiv);

                        const browserContent = document.createElement("div");
                        browserContent.setAttribute("class", "chrome-tabs-content");
                        browserDiv.appendChild(browserContent);

                        const browserTabsBottomBar = document.createElement("div");
                        browserTabsBottomBar.setAttribute("class", "chrome-tabs-bottom-bar");
                        browserDiv.appendChild(browserTabsBottomBar);

                        const menu_options = creaWebMenuJSON(alumne);

                        // init chrome tabs
                        if (!chromeTabsObjects[alumne])
                            chromeTabsObjects[alumne] = {};
                        chromeTabsObjects[alumne][browser] = new ChromeTabs()
                        chromeTabsObjects[alumne][browser].init(browserDiv, menu_options)

                        //browserDiv.addEventListener('activeTabChange', ({ detail }) => console.log('Active tab changed', detail.tabEl))
                        //browserDiv.addEventListener('tabAdd', ({ detail }) => console.log('Tab added', detail.tabEl))
                        browserDiv.addEventListener('tabRemove', ({detail}) => {
                            //console.log('Tab removed', detail.tabEl)
                            socket.emit("closeTab", {
                                alumne: alumne,
                                browser: browserInfo.browser,
                                tabId: detail.tabEl.info.tabId
                            })
                        });

                        for (const tab in browserInfo.tabs) {
                            if (Object.hasOwnProperty.call(browserInfo.tabs, tab)) {
                                const tabInfo = browserInfo.tabs[tab];
                                if (!tabInfo.opened) continue;
                                /*let ttabDiv = document.createElement("div");
                                ttabDiv.setAttribute("class", "tab");
                                ttabDiv.setAttribute("id", tab);
                                const url = tabInfo.webPage.protocol + "//" + tabInfo.webPage.host + tabInfo.webPage.pathname + tabInfo.webPage.search
                                ttabDiv.innerHTML = `${tabInfo.tabId}  <a href="${url}"> ${tabInfo.webPage.title} </a> ${tabInfo.incognito ? "[INCOGNITO]" : ""} ${tabInfo.active ? "ACTIVE" : "INACTIVE"} favicon: ${tabInfo.webPage.favicon}`
                                tbrowserTabsDiv.appendChild(ttabDiv);*/
                                chromeTabsObjects[alumne][browser].addTab({
                                    title: tabInfo.webPage.title,
                                    favicon: tabInfo.webPage.favicon ? tabInfo.webPage.favicon :
                                        (tabInfo.webPage.protocol === "chrome:" ? undefined : "img/undefined_favicon.png"),
                                    info: tabInfo
                                }, {
                                    background: !tabInfo.active
                                })
                            }
                        }
                    }
                }
            }
            // Store new alumne info
            storedAlumneInfo[alumne] = alumneInfo;
        }
    }
});

socket.on('grupAlumnesList', function (data) {
    grupAlumnesList = data;

    // Prepara visibilitat
    for (let grup in grupAlumnesList) {
        for (let alumne in grupAlumnesList[grup].alumnes) {
            visibilityAlumnes[alumne] = false;
        }
    }

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
        grupSelector.onchange = (ev) => {
            for (let g in grupAlumnesList) {
                for (let a in grupAlumnesList[g].alumnes) {
                    visibilityAlumnes[a] = (g === grupSelector.value);
                    const browserContainer = document.getElementById(a + "-container")
                    if (browserContainer)
                        browserContainer.style.display = visibilityAlumnes[a] ? "" : "none";

                    // Refresca els chrome tabs
                    if (chromeTabsObjects[a])
                        for (let b in chromeTabsObjects[a])
                            chromeTabsObjects[a][b].layoutTabs();
                }
            }

            // Prepara el botó d'estat global
            const grupStatus = document.getElementById("globalGroupGtatus");
            const grupStatusRuleOn = document.getElementById("globalGroupStatusRuleOn");
            const grupStatusRuleFree = document.getElementById("globalGroupStatusRuleFree");
            const grupStatusBlockAll = document.getElementById("globalGroupStatusBlockAll");

            function setGrupStatus(status, send = false) {
                grupStatus.classList.remove("btn-warning");
                grupStatus.classList.remove("btn-success");
                grupStatus.classList.remove("btn-danger");

                if (status === "RuleOn")
                    grupStatus.classList.add("btn-success");
                else if (status === "RuleFree")
                    grupStatus.classList.add("btn-warning");
                else if (status === "Blocked")
                    grupStatus.classList.add("btn-danger");

                if (status === "RuleOn")
                    grupStatus.innerHTML = "Filtre actiu";
                else if (status === "RuleFree")
                    grupStatus.innerHTML = "Desactivat";
                else if (status === "Blocked")
                    grupStatus.innerHTML = "Tot bloquejat";

                if (send) socket.emit("setGrupStatus", {grup: grupSelector.value, status: status});
            }

            grupStatus.classList.remove("btn-dark");
            grupStatus.removeAttribute("disabled");
            setGrupStatus(data[grupSelector.value].status);

            grupStatusRuleOn.onclick = (ev) => {
                setGrupStatus("RuleOn", true);
            }

            grupStatusRuleFree.onclick = (ev) => {
                setGrupStatus("RuleFree", true);
            }

            grupStatusBlockAll.onclick = (ev) => {
                setGrupStatus("Blocked", true);
            }

            // Prepara el botó de Normes Web de grup
            const grupNormesWebButton = document.getElementById("globalGroupNormesWebButton");
            grupNormesWebButton.removeAttribute("disabled");
            grupNormesWebButton.onclick = (ev) => obreDialogNormesWeb(grupSelector.value, "grup");

            // Prepara el botó de Normes Apps de grup
            const grupNormesAppsButton = document.getElementById("globalGroupNormesAppsButton");
            grupNormesAppsButton.removeAttribute("disabled");
            grupNormesAppsButton.onclick = (ev) => obreDialogNormesApps(grupSelector.value, "grup");
        }
        grupSelector.appendChild(option);
    }
});
socket.on('normesWeb', function (data) {
    normesWebInfo = data;
});

socket.on('normesApps', function (data) {
    normesAppsInfo = data;
});

socket.on('historialWebAlumne', function (data) {
    const historialSidebar = document.getElementById("historialSidebar");
    const historialSideBarTitle = document.getElementById("historialSidebarTitle");
    const historialSideBarContent = document.getElementById("historialSidebarContent");
    const opcionMenuContextual = creaWebMenuJSON(data.alumne);

    let hiddenAuxInfo = document.getElementById("hiddenHistorialAuxInfo");

    if (!hiddenAuxInfo) {
        hiddenAuxInfo = document.createElement("div");
        hiddenAuxInfo.setAttribute("id", "hiddenHistorialAuxInfo");
        hiddenAuxInfo.setAttribute("style", "display: none;");
        historialSideBarContent.innerHTML = "";
        hiddenAuxInfo.setAttribute("data-historial-length", 0);
        hiddenAuxInfo.setAttribute("data-alumne", data.alumne);
        hiddenAuxInfo.setAttribute("data-prevday", undefined);
        hiddenAuxInfo.setAttribute("data-previd", undefined);
        hiddenAuxInfo.setAttribute("data-prevhost", undefined);
        historialSideBarContent.appendChild(hiddenAuxInfo);
    }

    let prevday = hiddenAuxInfo.getAttribute("data-prevday");
    let previd = hiddenAuxInfo.getAttribute("data-previd");
    let prevhost = hiddenAuxInfo.getAttribute("data-prevhost");
    const historialLength = parseInt(hiddenAuxInfo.getAttribute("data-historial-length")) + data.historial.length;

    for (const webPage of data.historial) {
        const data = new Date(webPage.timestamp);
        const dia = data.toLocaleDateString('ca-ES', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const hora = data.toLocaleTimeString('ca-ES', {hour: '2-digit', minute: '2-digit'});
        const newDay = prevday !== dia;

        if (newDay) {
            const divHeader = document.createElement("div");
            divHeader.setAttribute("class", "d-flex w-100 align-items-center justify-content-between");
            divHeader.innerHTML = `<h7 class="bg-light border-top border-bottom date-historial-heading">${dia}</h7>`;
            historialSideBarContent.appendChild(divHeader);
            prevday = dia;
        }

        if (prevhost && previd && prevhost === webPage.host && !newDay) {
            const dHora = document.getElementById(`historial_hora_${previd}`);
            const dHoraEnd = dHora.getAttribute("data-hora-end");
            if (dHoraEnd !== hora)
                dHora.innerHTML = `${hora} - ${dHoraEnd}`;
            else
                dHora.innerHTML = hora;
            continue;
        }
        const a = document.createElement("a");
        a.setAttribute("href", "#");
        a.setAttribute("class", "list-group-item list-group-item-action lh-tight py-1"); //active
        const tooltip = "Obert a " + webPage.browser + (webPage.incognito ? " en mode incognit" : "") + `\n${webPage.protocol}//${webPage.host}${webPage.pathname}${webPage.search}`;
        a.setAttribute("title", tooltip);

        const divHeader = document.createElement("div");
        divHeader.setAttribute("class", "d-flex w-100 align-items-center justify-content-between");


        const dTitile = document.createElement("strong");
        dTitile.setAttribute("class", "mb-1 nomesunalinia");
        const favicon = document.createElement("img");
        favicon.setAttribute("src", webPage.favicon ? webPage.favicon : "img/undefined_favicon.png");
        favicon.setAttribute("class", "historial-favicon");
        dTitile.appendChild(favicon);

        const text = document.createTextNode(webPage.title);
        dTitile.appendChild(text);
        divHeader.appendChild(dTitile);


        const dHora = document.createElement("small");
        dHora.id = `historial_hora_${webPage._id}`;
        dHora.setAttribute("data-hora-end", hora);
        dHora.innerHTML = hora;
        divHeader.appendChild(dHora);

        const divContent = document.createElement("div");
        divContent.setAttribute("class", "col-10 mb-1 small");
        divContent.innerHTML = `${webPage.host}`;

        a.onclick = (ev) => {
            const info = {
                alumne: data.alumne,
                webPage: {
                    host: webPage.host,
                    pathname: webPage.pathname,
                    search: webPage.search,
                    title: webPage.title,
                    protocol: webPage.protocol,
                }
            }
            openMenu(ev, opcionMenuContextual, info);
        }
        a.appendChild(divHeader);
        a.appendChild(divContent);
        historialSideBarContent.appendChild(a);

        previd = webPage._id;
        prevhost = webPage.host;
    }

    if (data.historial.length !== 0) {
        // Mostra'n més
        const a = document.createElement("a");
        a.setAttribute("href", "#");
        a.setAttribute("class", "list-group-item list-group-item-action list-group-item-dark lh-tight");
        a.setAttribute("aria-current", "true");
        a.innerHTML = `<strong class="mb-1 nomesunalinia">Mostra'n més</strong>`;
        a.onclick = () => {
            socket.emit("getHistorialWeb", {alumne: data.alumne, offset: historialLength});
            a.remove();
        };

        historialSideBarContent.appendChild(a);
    }

    hiddenAuxInfo.setAttribute("data-historial-length", historialLength);
    hiddenAuxInfo.setAttribute("data-alumne", data.alumne);
    hiddenAuxInfo.setAttribute("data-prevday", prevday);
    hiddenAuxInfo.setAttribute("data-prevhost", prevhost);
    hiddenAuxInfo.setAttribute("data-previd", previd);

    // Refresca els chrome tabs
    if (chromeTabsObjects[data.alumne])
        for (let b in chromeTabsObjects[data.alumne])
            chromeTabsObjects[data.alumne][b].layoutTabs();

});

socket.on('historialAppsAlumne', function (data) {
    const historialSidebar = document.getElementById("historialSidebar");
    const historialSideBarTitle = document.getElementById("historialSidebarTitle");
    const historialSideBarContent = document.getElementById("historialSidebarContent");

    let hiddenAuxInfo = document.getElementById("hiddenHistorialAuxInfo");

    if (!hiddenAuxInfo) {
        hiddenAuxInfo = document.createElement("div");
        hiddenAuxInfo.setAttribute("id", "hiddenHistorialAuxInfo");
        hiddenAuxInfo.setAttribute("style", "display: none;");
        historialSideBarContent.innerHTML = "";
        hiddenAuxInfo.setAttribute("data-historial-length", 0);
        hiddenAuxInfo.setAttribute("data-alumne", data.alumne);
        hiddenAuxInfo.setAttribute("data-prevday", undefined);
        historialSideBarContent.appendChild(hiddenAuxInfo);
    }

    let prevday = hiddenAuxInfo.getAttribute("data-prevday");
    const historialLength = parseInt(hiddenAuxInfo.getAttribute("data-historial-length")) + data.historial.length;

    for (const process of data.historial) {
        const started = new Date(process.startedTimestamp);
        const updated = new Date(process.updatedTimestamp);
        const dia = started.toLocaleDateString('ca-ES', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const horaStart = started.toLocaleTimeString('ca-ES', {hour: '2-digit', minute: '2-digit'});
        const horaUpdated = updated.toLocaleTimeString('ca-ES', {hour: '2-digit', minute: '2-digit'});
        const newDay = prevday !== dia;

        if (newDay) {
            const divHeader = document.createElement("div");
            divHeader.setAttribute("class", "d-flex w-100 align-items-center justify-content-between");
            divHeader.innerHTML = `<h7 class="bg-light border-top border-bottom date-historial-heading">${dia}</h7>`;
            historialSideBarContent.appendChild(divHeader);
            prevday = dia;
        }

        const a = document.createElement("a");
        a.setAttribute("href", "#");
        a.setAttribute("class", "list-group-item list-group-item-action lh-tight py-1"); //active
        const tooltip = process.processPath;
        a.setAttribute("title", tooltip);

        const divHeader = document.createElement("div");
        divHeader.setAttribute("class", "d-flex w-100 align-items-center justify-content-between");

        const dTitile = document.createElement("strong");
        dTitile.setAttribute("class", "mb-1 nomesunalinia");
        const favicon = document.createElement("img");
        favicon.setAttribute("src", process.iconB64 ? "data:image/png;base64," + process.iconB64 : "img/undefined_app.png");
        favicon.setAttribute("class", "historial-favicon");
        dTitile.appendChild(favicon);

        const text = document.createTextNode(process.caption);
        dTitile.appendChild(text);
        divHeader.appendChild(dTitile);

        const dHora = document.createElement("small");
        dHora.id = `historial_hora_${process._id}`;
        dHora.innerHTML = horaStart === horaUpdated ? horaStart : `${horaStart} - ${horaUpdated}`
        divHeader.appendChild(dHora);

        const divContent = document.createElement("div");
        divContent.setAttribute("class", "col-10 mb-1 small");
        divContent.innerHTML = `${process.processName}`;
        const opcionMenuContextual = creaAppMenuJSON(data.alumne, process.processName);

        a.onclick = (ev) => {
            const info = {
                alumne: data.alumne,
                processName: process.processName,
                processPath: process.processPath,
                caption: process.caption,
                iconB64: process.iconB64,
                iconSVG: process.iconSVG,
            }
            openMenu(ev, opcionMenuContextual, info);
        }
        a.appendChild(divHeader);
        a.appendChild(divContent);
        historialSideBarContent.appendChild(a);
    }

    if (data.historial.length !== 0) {
        // Mostra'n més
        const a = document.createElement("a");
        a.setAttribute("href", "#");
        a.setAttribute("class", "list-group-item list-group-item-action list-group-item-dark lh-tight");
        a.setAttribute("aria-current", "true");
        a.innerHTML = `<strong class="mb-1 nomesunalinia">Mostra'n més</strong>`;
        a.onclick = () => {
            socket.emit("getHistorialApps", {alumne: data.alumne, offset: historialLength});
            a.remove();
        };

        historialSideBarContent.appendChild(a);
    }

    hiddenAuxInfo.setAttribute("data-historial-length", historialLength);
    hiddenAuxInfo.setAttribute("data-alumne", data.alumne);
    hiddenAuxInfo.setAttribute("data-prevday", prevday);

    // Refresca els chrome tabs
    if (chromeTabsObjects[data.alumne])
        for (let b in chromeTabsObjects[data.alumne])
            chromeTabsObjects[data.alumne][b].layoutTabs();

});

socket.on('connect', function () {
    console.log('Connected to server');
});

// Gestiona errors d'autenticació
socket.on('connect_error', (error) => {
    console.log('Error d\'autenticació:', error.message);
    window.location.href = "login.html";
});
