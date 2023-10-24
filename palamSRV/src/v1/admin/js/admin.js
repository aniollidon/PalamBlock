const socket = io();
const hblockModal = document.getElementById('bloquejaModal')
const blockModal = new bootstrap.Modal(hblockModal)
const hnormesModal = document.getElementById('normesModal')
const normesModal = new bootstrap.Modal(hnormesModal)
let normesInfo = {}
let grupAlumnesList = {}
let visibilityAlumnes = {}
let chromeTabsObjects = {}
function getGrup(alumneId){
    for(let grup in grupAlumnesList){
        if(alumneId in grupAlumnesList[grup])
            return grup;
    }

    return undefined
}
function creaOpcionMenuContextual(alumne) {
    // Opcions del menu contextual
    const obreUrl = (info) => {
        const url = info.webPage.protocol + "//" + info.webPage.host + info.webPage.pathname + info.webPage.search
        window.open(url, '_blank').focus();

    }
    const onBloqueja = (info) => {
        obreDialogBloqueja(info, alumne, "blocalumn");
    }

    const onBloquejaGrup = (info) => {
        obreDialogBloqueja(info, alumne, "blocgrup");
    }

    const onAfegeixLlistaBlanca = (info) => {
        obreDialogBloqueja(info, alumne, "llistablanca");
    }
    return  {
        "Obre aquí": obreUrl,
        "Bloqueja": onBloqueja,
        "Bloqueja al grup": onBloquejaGrup,
        "Afegeix a llista blanca": onAfegeixLlistaBlanca,
    }
}
function toogleHistorial(alumne){
    const historialSidebar = document.getElementById("historialSidebar");

    if (historialSidebar.style.display.includes("none")) {
        socket.emit("getHistorial", { alumne: alumne });
        const historialSideBarTitle = document.getElementById("historialSidebarTitle");
        const historialSideBarContent = document.getElementById("historialSidebarContent");
        historialSideBarTitle.innerHTML = `Historial de l'alumne ${alumne}`;
        historialSideBarContent.innerHTML = "";
        historialSidebar.style.display = "";
    }
    else {
        historialSidebar.style.setProperty('display', 'none', 'important');
        // Refresca els chrome tabs
        if(chromeTabsObjects[alumne])
            for(let b in chromeTabsObjects[alumne])
                chromeTabsObjects[alumne][b].layoutTabs();
    }


}
function obreDialogBloqueja(info, alumne, action, severity = "block") {
    const ugrup = getGrup(alumne);
    const ualumne = alumne.toUpperCase();
    const blocalumnLink = document.getElementById("pills-blocalumn-tab");
    const blocgrupLink = document.getElementById("pills-blocgrup-tab");
    const llistablancaLink = document.getElementById("pills-llistablanca-tab");
    const severitySelect = document.getElementById("pbk_modal_severity");
    const hostInput = document.getElementById("pbk_modal_host");
    const pathnameInput = document.getElementById("pbk_modal_pathname");
    const searchInput = document.getElementById("pbk_modal_search");
    const titleInput = document.getElementById("pbk_modal_title");
    const hostSwitch = document.getElementById("pbk_modal_host_switch");
    const pathnameSwitch = document.getElementById("pbk_modal_pathname_switch");
    const searchSwitch = document.getElementById("pbk_modal_search_switch");
    const titleSwitch = document.getElementById("pbk_modal_title_switch");
    const normaButton = document.getElementById("pbk_modal_creanorma");
    let normaWhoSelection = "alumne";
    let normaWhoId = alumne;
    let normaMode = "blacklist";

    blocalumnLink.innerHTML = `Bloqueja ${ualumne}`;
    blocgrupLink.innerHTML = `Bloqueja ${ugrup}`;
    llistablancaLink.innerHTML = `Crea llista blanca ${ugrup}`;

    if(action === "blocalumn") {
        blocalumnLink.click();
    }
    else if(action === "blocgrup") {
        blocgrupLink.click();
    }
    else if(action === "llistablanca") {
        llistablancaLink.click();
    }

    severitySelect.value = severity;
    hostInput.value = info.webPage.host;
    pathnameInput.value = info.webPage.pathname;
    searchInput.value = info.webPage.search;
    titleInput.value = info.webPage.title;


    if(info.webPage.pathname === "/" || info.webPage.pathname === ""){
        pathnameSwitch.checked = false;
        pathnameInput.setAttribute("disabled", "disabled");
    }
    else {
        pathnameSwitch.checked = true;
        pathnameInput.removeAttribute("disabled");
    }

    hostSwitch.checked = true;
    searchSwitch.checked = false;
    searchInput.setAttribute("disabled", "disabled");
    titleSwitch.checked = false;
    titleInput.setAttribute("disabled", "disabled");

    blocalumnLink.onclick =  (event) => {
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

    normaButton.onclick= (event) => {
        socket.emit("addNorma", {
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

        blockModal.hide();
    };

    blockModal.show();
}
function obreDialogNormes(alumne){
    const modalTitle = document.getElementById("pbk_modal_normes_title");
    const container =  document.getElementById("pbk_modal_normes");
    const list = document.createElement("div");

    container.innerHTML = "";
    modalTitle.innerHTML = "Normes per " + alumne;

    list.setAttribute("class", "list-group");
    container.appendChild(list);

    for (const norma in normesInfo["alumnes"][alumne]) {
        if(normesInfo["alumnes"][alumne][norma].removed === true) continue;

        const listItem = document.createElement("div");
        listItem.setAttribute("class", "list-group-item list-group-item-action flex-column align-items-start");
        const itemHeading = document.createElement("div");
        itemHeading.setAttribute("class", "d-flex w-100 justify-content-between");
        const itemTitle = document.createElement("h5");
        itemTitle.setAttribute("class", "mb-1");
        const severity = normesInfo["alumnes"][alumne][norma].severity;
        itemTitle.innerHTML = (severity === "block"? "Bloqueja" : "Avisa" );

        if(normesInfo["alumnes"][alumne][norma].mode !== "blacklist")
            itemTitle.innerHTML += " si no coincideix";

        const itemSubtitle = document.createElement("small");
        itemSubtitle.innerHTML = normesInfo["alumnes"][alumne][norma].enabled_on;
        const trash  = document.createElement("button");
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
            socket.emit("removeNorma", { normaId: norma, who: "alumne", whoid: alumne });
            normesInfo["alumnes"][alumne][norma].removed = true;
            obreDialogNormes(alumne);
        };
        pencil.onclick =(event) => {
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
        if(normesInfo["alumnes"][alumne][norma].hosts_list.length > 0)
            itemText.innerHTML = "<b>Hosts:</b> " + normesInfo["alumnes"][alumne][norma].hosts_list + "<br>";
        if(normesInfo["alumnes"][alumne][norma].protocols_list.length > 0)
            itemText.innerHTML += "<b>Protocols:</b> " + normesInfo["alumnes"][alumne][norma].protocols_list + "<br>";
        if(normesInfo["alumnes"][alumne][norma].searches_list.length > 0)
            itemText.innerHTML += "<b>Searches:</b> " + normesInfo["alumnes"][alumne][norma].searches_list + "<br>";
        if(normesInfo["alumnes"][alumne][norma].pathnames_list.length > 0)
            itemText.innerHTML += "<b>Pathnames:</b> " + normesInfo["alumnes"][alumne][norma].pathnames_list + "<br>";
        if(normesInfo["alumnes"][alumne][norma].titles_list.length > 0)
            itemText.innerHTML += "<b>Titles:</b> " + normesInfo["alumnes"][alumne][norma].titles_list + "<br>";
        listItem.appendChild(itemText);
        list.appendChild(listItem);
    }
    normesModal.show();
}
socket.on('alumnesActivity', function (data) {
    let alumnesList = document.getElementById("alumnesList");
    alumnesList.innerHTML = "";
    //chromeTabs.removeAllTabs();

    for (const alumne in data) {
        if (Object.hasOwnProperty.call(data, alumne)) {
            const alumneInfo = data[alumne];
            let alumneDiv = document.createElement("div");
            alumneDiv.setAttribute("class", "alumne-browser-container");
            alumneDiv.setAttribute("id", alumne + "-browser-container");
            alumneDiv.style.display = visibilityAlumnes[alumne] ? "" : "none";

            let alumneDivHeader = document.createElement("div");
            alumneDivHeader.setAttribute("class", "alumne-browser-header");
            alumneDivHeader.setAttribute("id", alumne + "-browser-header");
            alumneDiv.appendChild(alumneDivHeader);
            alumneDivHeader.innerHTML = ` <h3>Alumne: ${alumne}</h3>`;
            alumnesList.appendChild(alumneDiv);

            // Normes button
            let normesButton = document.createElement("button");
            normesButton.setAttribute("class", "btn btn-dark");
            normesButton.setAttribute("type", "button");
            const NormesInner = document.createElement("div");
            NormesInner.innerHTML =
                `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-database" viewBox="0 0 16 16">
                  <path d="M4.318 2.687C5.234 2.271 6.536 2 8 2s2.766.27 3.682.687C12.644 3.125 13 3.627 13 4c0 .374-.356.875-1.318 1.313C10.766 5.729 9.464 6 8 6s-2.766-.27-3.682-.687C3.356 4.875 3 4.373 3 4c0-.374.356-.875 1.318-1.313ZM13 5.698V7c0 .374-.356.875-1.318 1.313C10.766 8.729 9.464 9 8 9s-2.766-.27-3.682-.687C3.356 7.875 3 7.373 3 7V5.698c.271.202.58.378.904.525C4.978 6.711 6.427 7 8 7s3.022-.289 4.096-.777A4.92 4.92 0 0 0 13 5.698ZM14 4c0-1.007-.875-1.755-1.904-2.223C11.022 1.289 9.573 1 8 1s-3.022.289-4.096.777C2.875 2.245 2 2.993 2 4v9c0 1.007.875 1.755 1.904 2.223C4.978 15.71 6.427 16 8 16s3.022-.289 4.096-.777C13.125 14.755 14 14.007 14 13V4Zm-1 4.698V10c0 .374-.356.875-1.318 1.313C10.766 11.729 9.464 12 8 12s-2.766-.27-3.682-.687C3.356 10.875 3 10.373 3 10V8.698c.271.202.58.378.904.525C4.978 9.71 6.427 10 8 10s3.022-.289 4.096-.777A4.92 4.92 0 0 0 13 8.698Zm0 3V13c0 .374-.356.875-1.318 1.313C10.766 14.729 9.464 15 8 15s-2.766-.27-3.682-.687C3.356 13.875 3 13.373 3 13v-1.302c.271.202.58.378.904.525C4.978 12.71 6.427 13 8 13s3.022-.289 4.096-.777c.324-.147.633-.323.904-.525Z"/>
                </svg> Normes`
            normesButton.appendChild(NormesInner);

            normesButton.onclick = () =>obreDialogNormes(alumne)
            alumneDiv.appendChild(normesButton);
            alumneDiv.appendChild(document.createTextNode(' '));

            // Historial button
            let historialButton = document.createElement("button");
            historialButton.setAttribute("class", "btn btn-dark");
            historialButton.setAttribute("type", "button");
            const historialInner = document.createElement("div");
            historialInner.innerHTML =
                `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
                  <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022l-.074.997zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.126.342l-.36.933zm1.37.71a7.01 7.01 0 0 0-.439-.27l.493-.87a8.025 8.025 0 0 1 .979.654l-.615.789a6.996 6.996 0 0 0-.418-.302zm1.834 1.79a6.99 6.99 0 0 0-.653-.796l.724-.69c.27.285.52.59.747.91l-.818.576zm.744 1.352a7.08 7.08 0 0 0-.214-.468l.893-.45a7.976 7.976 0 0 1 .45 1.088l-.95.313a7.023 7.023 0 0 0-.179-.483zm.53 2.507a6.991 6.991 0 0 0-.1-1.025l.985-.17c.067.386.106.778.116 1.17l-1 .025zm-.131 1.538c.033-.17.06-.339.081-.51l.993.123a7.957 7.957 0 0 1-.23 1.155l-.964-.267c.046-.165.086-.332.12-.501zm-.952 2.379c.184-.29.346-.594.486-.908l.914.405c-.16.36-.345.706-.555 1.038l-.845-.535zm-.964 1.205c.122-.122.239-.248.35-.378l.758.653a8.073 8.073 0 0 1-.401.432l-.707-.707z"/>
                  <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0v1z"/>
                  <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5z"/>
                </svg> Historial`
            historialButton.appendChild(historialInner);

            historialButton.onclick = () =>toogleHistorial(alumne)
            alumneDiv.appendChild(historialButton);

            // Apps List
            let alumneAppsDiv = document.createElement("div");

            // todo convert to javascript
            alumneAppsDiv.innerHTML = `
            <div class="w11 w11-nav-container">
                <div class="w11 w11-first-container">
                    <!-- windows 11 logo -->
                    <div title="start" class="w11 windows-div">
                        <svg class="w11 windows-logo" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" width="58" height="58" version="1.1" viewBox="0 0 48.745 48.747"><g fill="#0078d4"><rect x="2.2848e-15" y="-.00011033" width="23.105" height="23.105"></rect><rect x="25.64" y="-.00011033" width="23.105" height="23.105"></rect><rect x="2.2848e-15" y="25.642" width="23.105" height="23.105"></rect><rect x="25.64" y="25.642" width="23.105" height="23.105"></rect></g></svg>
                    </div>
                    <!-- search icon -->
                    <div class="w11 search-div" title="cerca"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="magnifying-glass" class="svg-inline--fa fa-magnifying-glass" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M500.3 443.7l-119.7-119.7c27.22-40.41 40.65-90.9 33.46-144.7C401.8 87.79 326.8 13.32 235.2 1.723C99.01-15.51-15.51 99.01 1.724 235.2c11.6 91.64 86.08 166.7 177.6 178.9c53.8 7.189 104.3-6.236 144.7-33.46l119.7 119.7c15.62 15.62 40.95 15.62 56.57 0C515.9 484.7 515.9 459.3 500.3 443.7zM79.1 208c0-70.58 57.42-128 128-128s128 57.42 128 128c0 70.58-57.42 128-128 128S79.1 278.6 79.1 208z"></path></svg></div>
                    <!-- windows 11 widget -->
                    <div class="w11 widget-div" title="widget"><img src="./images/w11-widget-icon.png" alt=""></div>
                </div>
                <div class="w11 w11-second-container">
                    <div class="w11 w11-sistema-info">
                        <!-- wifi -->
                        <div title="Local-WiFi" class="w11"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="wifi" class="svg-inline--fa fa-wifi" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="currentColor" d="M319.1 351.1c-35.35 0-64 28.66-64 64.01s28.66 64.01 64 64.01c35.34 0 64-28.66 64-64.01S355.3 351.1 319.1 351.1zM320 191.1c-70.25 0-137.9 25.6-190.5 72.03C116.3 275.7 115 295.9 126.7 309.2C138.5 322.4 158.7 323.7 171.9 312C212.8 275.9 265.4 256 320 256s107.3 19.88 148.1 56C474.2 317.4 481.8 320 489.3 320c8.844 0 17.66-3.656 24-10.81C525 295.9 523.8 275.7 510.5 264C457.9 217.6 390.3 191.1 320 191.1zM630.2 156.7C546.3 76.28 436.2 32 320 32S93.69 76.28 9.844 156.7c-12.75 12.25-13.16 32.5-.9375 45.25c12.22 12.78 32.47 13.12 45.25 .9375C125.1 133.1 220.4 96 320 96s193.1 37.97 265.8 106.9C592.1 208.8 600 211.8 608 211.8c8.406 0 16.81-3.281 23.09-9.844C643.3 189.2 642.9 168.1 630.2 156.7z"></path></svg></div>
                        <!-- vulume -->
                        <div title="Audio Disattivato" class="w11"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="volume-xmark" class="svg-inline--fa fa-volume-xmark" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M301.2 34.85c-11.5-5.188-25.02-3.122-34.44 5.253L131.8 160H48c-26.51 0-48 21.49-48 47.1v95.1c0 26.51 21.49 47.1 48 47.1h83.84l134.9 119.9c5.984 5.312 13.58 8.094 21.26 8.094c4.438 0 8.972-.9375 13.17-2.844c11.5-5.156 18.82-16.56 18.82-29.16V64C319.1 51.41 312.7 40 301.2 34.85zM513.9 255.1l47.03-47.03c9.375-9.375 9.375-24.56 0-33.94s-24.56-9.375-33.94 0L480 222.1L432.1 175c-9.375-9.375-24.56-9.375-33.94 0s-9.375 24.56 0 33.94l47.03 47.03l-47.03 47.03c-9.375 9.375-9.375 24.56 0 33.94c9.373 9.373 24.56 9.381 33.94 0L480 289.9l47.03 47.03c9.373 9.373 24.56 9.381 33.94 0c9.375-9.375 9.375-24.56 0-33.94L513.9 255.1z"></path></svg></div>
                        <!-- battery -->
                        <div title="Batteria Scarica" class="w11"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="battery-quarter" class="svg-inline--fa fa-battery-quarter" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M192 192H96v128h96V192zM544 192V160c0-35.35-28.65-64-64-64H64C28.65 96 0 124.7 0 160v192c0 35.35 28.65 64 64 64h416c35.35 0 64-28.65 64-64v-32c17.67 0 32-14.33 32-32V224C576 206.3 561.7 192 544 192zM480 352H64V160h416V352z"></path></svg></div>
                    </div>
                    <div title="23:36  23/10/2023" class="w11 w11-sistema-data">
                        <div class="w11 w11-orario-data">23:36 </div>
                        <div  title="dataCalendario" class="w11 calendario-data">23/10/2023 </div>
                    </div>
                </div>
            </div>`
            alumneAppsDiv.setAttribute("class", "apps");
            alumneDiv.appendChild(alumneAppsDiv);

            for (const app in alumneInfo.apps) {
                if (Object.hasOwnProperty.call(alumneInfo.apps, app)) {
                    const appInfo = alumneInfo.apps[app];
                    if(!appInfo.opened) continue;
                    let tappDiv = document.createElement("div");
                    tappDiv.setAttribute("class", "app");
                    tappDiv.setAttribute("id", app);
                    if(appInfo.iconSVG) {
                        const icon = document.createElement("div");
                        icon.innerHTML = appInfo.iconSVG;
                        // modify the svg to fit the container
                        icon.firstChild.setAttribute("width", "100%");
                        icon.firstChild.setAttribute("height", "100%");
                        icon.setAttribute("class", "app-icon");
                        tappDiv.appendChild(icon);
                    }
                    else{
                        const defaultIcon = document.createElement("img");
                        defaultIcon.setAttribute("src", "img/defaultapp.png");
                        defaultIcon.setAttribute("class", "app-icon");
                        tappDiv.appendChild(defaultIcon);
                    }

                    tappDiv.innerHTML += appInfo.app;
                    alumneAppsDiv.appendChild(tappDiv);
                }
            }

            // Browsers List
            let alumneBrowsersDiv = document.createElement("div");
            alumneBrowsersDiv.setAttribute("class", "browsers");
            alumneDiv.appendChild(alumneBrowsersDiv);

            for (const browser in alumneInfo.browsers) {
                if (Object.hasOwnProperty.call(alumneInfo.browsers, browser)) {
                    const browserInfo = alumneInfo.browsers[browser];
                    if(!browserInfo.opened) continue;
                    /*let tbrowserDiv = document.createElement("div");
                    tbrowserDiv.setAttribute("class", "browser");
                    tbrowserDiv.setAttribute("id", browser);
                    tbrowserDiv.innerHTML = browserInfo.browser + " " + browserInfo.browserId;
                    alumneBrowsersDiv.appendChild(tbrowserDiv);
                    let tbrowserTabsDiv = document.createElement("div");
                    tbrowserTabsDiv.setAttribute("class", "tabs");
                    tbrowserDiv.appendChild(tbrowserTabsDiv);*/

                    // Create a browser
                    let browserDiv = document.createElement("div");
                    browserDiv.setAttribute("class", "chrome-tabs");
                    browserDiv.setAttribute("id", browser+ "-browser");
                    browserDiv.style = "--tab-content-margin: 9px;";
                    browserDiv.setAttribute("data-chrome-tabs-instance-id", browser);
                    alumneBrowsersDiv.appendChild(browserDiv);


                    let browserInfoDiv = document.createElement("div");
                    browserInfoDiv.setAttribute("class", "browser-info");
                    let browserIcon = document.createElement("img");
                    browserIcon.setAttribute("src", "img/" +browserInfo.browser + ".png");
                    browserIcon.setAttribute("class", "browser-icon");
                    browserInfoDiv.appendChild(browserIcon);
                    browserDiv.appendChild(browserInfoDiv);

                    let browserContent = document.createElement("div");
                    browserContent.setAttribute("class", "chrome-tabs-content");
                    browserDiv.appendChild(browserContent);

                    let browserTabsBottomBar = document.createElement("div");
                    browserTabsBottomBar.setAttribute("class", "chrome-tabs-bottom-bar");
                    browserDiv.appendChild(browserTabsBottomBar);

                    const menu_options = creaOpcionMenuContextual(alumne);

                    // init chrome tabs
                    if(!chromeTabsObjects[alumne])
                        chromeTabsObjects[alumne] = {};
                    chromeTabsObjects[alumne][browser] = new ChromeTabs()
                    chromeTabsObjects[alumne][browser].init(browserDiv, menu_options)

                    //browserDiv.addEventListener('activeTabChange', ({ detail }) => console.log('Active tab changed', detail.tabEl))
                    //browserDiv.addEventListener('tabAdd', ({ detail }) => console.log('Tab added', detail.tabEl))
                    browserDiv.addEventListener('tabRemove', ({ detail }) => {
                        console.log('Tab removed', detail.tabEl)
                        socket.emit("closeTab", { alumne: alumne, browser: browserInfo.browser, browserId: browserInfo.browserId, tabId: detail.tabEl.info.tabId })
                    });

                    for (const tab in browserInfo.tabs) {
                        if (Object.hasOwnProperty.call(browserInfo.tabs, tab)) {
                            const tabInfo = browserInfo.tabs[tab];
                            if(!tabInfo.opened) continue;
                            /*let ttabDiv = document.createElement("div");
                            ttabDiv.setAttribute("class", "tab");
                            ttabDiv.setAttribute("id", tab);
                            const url = tabInfo.webPage.protocol + "//" + tabInfo.webPage.host + tabInfo.webPage.pathname + tabInfo.webPage.search
                            ttabDiv.innerHTML = `${tabInfo.tabId}  <a href="${url}"> ${tabInfo.webPage.title} </a> ${tabInfo.incognito ? "[INCOGNITO]" : ""} ${tabInfo.active ? "ACTIVE" : "INACTIVE"} favicon: ${tabInfo.webPage.favicon}`
                            tbrowserTabsDiv.appendChild(ttabDiv);*/
                            chromeTabsObjects[alumne][browser].addTab({
                                title: tabInfo.webPage.title,
                                favicon: tabInfo.webPage.favicon ?  tabInfo.webPage.favicon :
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
    }
});

socket.on('grupAlumnesList', function (data) {
    grupAlumnesList = data;

    // Prepara visibilitat
    for(let grup in grupAlumnesList){
        for(let alumne in grupAlumnesList[grup]){
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

    for(let grup in grupAlumnesList){
        const option = document.createElement("option");
        option.setAttribute("value", grup);
        option.innerHTML = grup;
        grupSelector.onchange = (ev) =>{
            for(let g in grupAlumnesList){
                for(let a in grupAlumnesList[g]){
                    visibilityAlumnes[a] = (g===grupSelector.value);
                    const browserContainer = document.getElementById(a + "-browser-container")
                    if(browserContainer)
                        browserContainer.style.display = visibilityAlumnes[a] ? "" : "none";

                    // Refresca els chrome tabs
                    if(chromeTabsObjects[a])
                        for(let b in chromeTabsObjects[a])
                            chromeTabsObjects[a][b].layoutTabs();
                }
            }
        }
        grupSelector.appendChild(option);
    }
});
socket.on('normesList', function (data) {
    normesInfo = data;
});

socket.on('historialAlumne', function (data) {
    const historialSidebar = document.getElementById("historialSidebar");
    const historialSideBarTitle = document.getElementById("historialSidebarTitle");
    const historialSideBarContent = document.getElementById("historialSidebarContent");
    const opcionMenuContextual = creaOpcionMenuContextual(data.alumne);

    let hiddenAuxInfo = document.getElementById("hiddenHistorialAuxInfo");

    if(!hiddenAuxInfo)
    {
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
        const dia = data.toLocaleDateString('ca-ES', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        const hora = data.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
        const newDay = prevday !== dia;

        if (newDay) {
            const divHeader = document.createElement("div");
            divHeader.setAttribute("class", "d-flex w-100 align-items-center justify-content-between");
            divHeader.innerHTML = `<h7 class="bg-light border-top border-bottom date-historial-heading">${dia}</h7>`;
            historialSideBarContent.appendChild(divHeader);
            prevday = dia;
        }

        if(prevhost && previd && prevhost === webPage.host && !newDay) {
            const dHora = document.getElementById(`historial_hora_${previd}`);
            const dHoraEnd = dHora.getAttribute("data-hora-end");
            if(dHoraEnd !== hora)
                dHora.innerHTML = `${hora} - ${dHoraEnd}` ;
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

    if(data.historial.length !== 0) {
        // Mostra'n més
        const a = document.createElement("a");
        a.setAttribute("href", "#");
        a.setAttribute("class", "list-group-item list-group-item-action list-group-item-dark lh-tight");
        a.setAttribute("aria-current", "true");
        a.innerHTML = `<strong class="mb-1 nomesunalinia">Mostra'n més</strong>`;
        a.onclick = () => {
            socket.emit("getHistorial", {alumne: data.alumne, offset: historialLength});
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
    if(chromeTabsObjects[data.alumne])
        for(let b in chromeTabsObjects[data.alumne])
            chromeTabsObjects[data.alumne][b].layoutTabs();

});