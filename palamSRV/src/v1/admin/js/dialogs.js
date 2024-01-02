import {getGrup} from "./activity.js";
import {socket} from "./socket.js";
import {safeURL} from "./utils.js";
import {commonPlaces, googleServices} from "./common-places.js";

const hblockModalWeb = document.getElementById('bloquejaModalWeb')
const blockModalWeb = new bootstrap.Modal(hblockModalWeb)
const hblockModalApps = document.getElementById('bloquejaModalApps')
const blockModalApps = new bootstrap.Modal(hblockModalApps)
const hnormesModal = document.getElementById('normesModal')
const normesModal = new bootstrap.Modal(hnormesModal)
const hllistaBlancaModal = document.getElementById('llistaBlancaModal')
const llistaBlancaModal = new bootstrap.Modal(hllistaBlancaModal)
let normesWebInfo = {}
let normesAppsInfo = {}
let llistaBlancaEnUs = {}

export function setnormesWebInfo(normesWebInfo_) {
    normesWebInfo = normesWebInfo_;
}

export function setnormesAppsInfo(normesAppsInfo_) {
    normesAppsInfo = normesAppsInfo_;
}

export function creaAppMenuJSON(alumne, app) {
    // Opcions del menu contextual
    const onBloqueja = (info) => {
        obreDialogBloquejaApps(info, alumne, "blocalumn");
    }
    const onTanca = (info) => {
        alert("No implementat")
        //console.log("onTanca app")
    }

    return [
        {text: "Tanca " + app, do: onTanca},
        {text: "Bloqueja " + app, do: onBloqueja}
    ]
}

export function creaWebMenuJSON(alumne) {
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

export function obreDialogBloquejaWeb(info, alumne, action, severity = "block") {
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

export function obreDialogBloquejaApps(info, alumne, action, severity = "block") {
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
    processInput.value = info.name? info.name : info.processName;
    filepathInput.value = info.path ? info.path : info.processPath;
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

export function obreDialogNormesWeb(whoid, who = "alumne") {
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

export function obreDialogNormesApps(whoid, who = "alumne") {
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

export function obreDialogAfegeixLlistaBlanca(grup){

    document.getElementById("llb-nomgrup").innerHTML = grup;

    const weblistcontainer = document.getElementById("llb-weblist-container");
    const weblist = document.getElementById("llb-weblist");
    const confirma = document.getElementById("llb-confirma");

    const webpageInput = document.getElementById("llb-webpage-input");
    const bAddWebpage = document.getElementById("llb-webpage-input-button");
    const webtitleInput = document.getElementById("llb-webtitle-input");
    const bAddWebTitle = document.getElementById("llb-webtitle-input-button");
    const hcommonPlaces = document.getElementById("llb-common");

    hcommonPlaces.innerHTML = "";

    function addWebToLlistaBlanca(web){
        if(!llistaBlancaEnUs[grup])
            llistaBlancaEnUs[grup] = [];

        llistaBlancaEnUs[grup].push(web);

        weblistcontainer.classList.remove("d-none");

        const item = document.createElement("div");
        item.classList.add("weblist-item-container");
        const row = document.createElement("div");
        row.classList.add("row-input");
        const input = document.createElement("input");
        input.setAttribute("id", "llb-weblist-input-" + web);
        input.setAttribute("type", "text");
        input.setAttribute("class", "form-control nobottom weblist-item");
        input.setAttribute("value", web);
        input.setAttribute("disabled", "disabled");
        const small = document.createElement("small");
        const button = document.createElement("button");
        button.setAttribute("type", "button");
        button.setAttribute("class", "btn btn-outline-secondary btn-sm");
        button.innerHTML= `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"></path>
                                        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"></path>
                           </svg>`;


        small.appendChild(button);
        row.appendChild(input);
        row.appendChild(small);
        item.appendChild(row);
        if(web === "google.com"){
            item.classList.add("google");
            const hservices = document.createElement("div");
            hservices.classList.add("google-services");
            for (const service of googleServices) {
                const hservice = document.createElement("div");
                hservice.innerHTML = `<div class="llb-child-google-service">
                            <input type="checkbox" checked id="llb-weblist-input-${service.title}">
                            <label for="llb-weblist-input-${service.title}">
                                ${service.title}
                                </label>
                            </div>`;
                hservices.appendChild(hservice);
            }
            item.appendChild(hservices);
        }
        weblist.appendChild(item);

        button.onclick = (event) => {
            // visual remove
            item.remove();

            // reset button
            for (const commonPlace of commonPlaces) {
                if(commonPlace.url === web)
                    document.getElementById("llb-add-" + commonPlace.title).removeAttribute("disabled");
            }

            // remove web
            const index = llistaBlancaEnUs[grup].indexOf(web);
            if (index > -1) {
                llistaBlancaEnUs[grup].splice(index, 1);
            }

            if(llistaBlancaEnUs[grup].length === 0)
                weblistcontainer.classList.add("d-none");
        }
    }

    for (const commonPlace of commonPlaces) {
        const div = document.createElement("div");
        div.setAttribute("class", "col");
        const button = document.createElement("button");
        button.setAttribute("class", "btn btn-outline-secondary w-100 btn-sm");
        button.setAttribute("data-url", commonPlace.url);
        button.setAttribute("id", "llb-add-" + commonPlace.title);
        button.innerHTML = commonPlace.svg + commonPlace.title;
        div.appendChild(button);
        hcommonPlaces.appendChild(div);

        button.onclick = (event) => {
            addWebToLlistaBlanca(commonPlace.url);
            button.setAttribute("disabled", "disabled");
        };
    }

    bAddWebpage.onclick = (event) => {
        if(webpageInput.value === "") return;
        addWebToLlistaBlanca(webpageInput.value);
        webpageInput.value = "";
    };

    bAddWebTitle.onclick = (event) => {
        if(webtitleInput.value === "") return;
        addWebToLlistaBlanca("[title] " + webtitleInput.value);
        webtitleInput.value = "";
    }

    confirma.onclick = (event) => {
        console.log(llistaBlancaEnUs[grup])
        const titles = [];
        const hosts = [];
        const pathnames = [];
        const searches = [];


        for (const web of llistaBlancaEnUs[grup]) {
            if(web.startsWith("[title]") )
                titles.push(web.substring(8));
            else {
                const url = safeURL(web)
                const host = url.host;
                const pathname = url.pathname;
                const search = url.search;

                if(host !== "")
                    hosts.push(host);
                if(pathname !== "" && pathname !== "/")
                    pathnames.push(pathname);
                if(search !== "")
                    searches.push(search);
            }
        }

        socket.emit("addNormaWeb", {
            who: "grup",
            whoid: grup,
            severity: "block",
            mode: "whitelist",
            hosts_list: hosts,
            //protocols_list: undefined,
            searches_list: searches,
            pathnames_list: pathnames,
            titles_list: titles,
            //enabled_on: undefined
        })

    }

    llistaBlancaModal.show();
}
