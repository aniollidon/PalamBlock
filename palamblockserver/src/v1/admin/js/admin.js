const socket = io();
const hblockModal = document.getElementById('bloquejaModal')
const blockModal = new bootstrap.Modal(hblockModal)
const hnormesModal = document.getElementById('normesModal')
const normesModal = new bootstrap.Modal(hnormesModal)
let normesInfo = {}


function toogleHistorial(alumne){
    const historialSidebar = document.getElementById("historialSidebar");

    if (historialSidebar.style.display.includes("none"))
        historialSidebar.style.display = "";
    else
        historialSidebar.style.setProperty('display', 'none', 'important');


}
function obreDialogBloqueja(info, alumne, action, severity = "block") {
    const ugrup = "FPB1"; // TODO: agafar el grup de l'alumne
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

    hostSwitch.checked = true;
    pathnameSwitch.checked = true;
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
socket.on('browsingActivity', function (data) {
    let alumnesList = document.getElementById("alumnesList");
    alumnesList.innerHTML = "";
    //chromeTabs.removeAllTabs();

    for (const alumne in data) {
        if (Object.hasOwnProperty.call(data, alumne)) {
            const alumneInfo = data[alumne];
            let alumneDiv = document.createElement("div");
            alumneDiv.setAttribute("class", "alumne-browser-container");
            alumneDiv.setAttribute("id", alumne + "-browser-container");

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

                    // opcions del menu

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
                    const menu_options = {
                        "Obre aquí": obreUrl,
                        "Bloqueja": onBloqueja,
                        "Bloqueja al grup": onBloquejaGrup,
                        "Afegeix a llista blanca": onAfegeixLlistaBlanca,
                    }

                    // init chrome tabs
                    let chromeTabs = new ChromeTabs()
                    chromeTabs.init(browserDiv, menu_options)
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
                            chromeTabs.addTab({
                                title: tabInfo.webPage.title,
                                favicon: tabInfo.webPage.favicon,
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

socket.on('normesList', function (data) {
    normesInfo = data;
});
