import {creaAppMenuJSON, creaWebMenuJSON, obreDialogNormesApps, obreDialogNormesWeb} from "./dialogs.js";
import {toogleSideBar} from "./sidebar.js";
import {compareEqualTabs} from "./utils.js";
import {socket} from "./socket.js";

const storedAlumneInfo = {}
let grupAlumnesList = {}
let visibilityAlumnes = {}
let chromeTabsObjects = {}

export function drawAlumnesActivity(data) {
    let alumnesList = document.getElementById("alumnesList");

    for (let grup in grupAlumnesList) {
        for (let alumne in grupAlumnesList[grup].alumnes) {
            const alumneInfo = Object.hasOwnProperty.call(data, alumne) ? data[alumne] : undefined;
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
            let alumneStatusButtonMain = undefined

            function setAlumneStatus(status) {
                alumneStatusButtonMain.classList.remove("btn-success");
                alumneStatusButtonMain.classList.remove("btn-danger");
                alumneStatusButtonMain.classList.remove("btn-warning");
                alumneStatusButtonMain.classList.remove("btn-secondary");
                alumneStatusButtonMain.removeAttribute("disabled");

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
                    default:
                        alumneStatusButtonMain.classList.add("btn-secondary");
                        alumneStatusButtonMain.innerHTML = "Inactiu";
                        //disable
                        alumneStatusButtonMain.setAttribute("disabled", "disabled");
                        break;
                }
            }

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
                alumneStatusButtonMain = document.createElement("button");
                alumneStatusButtonMain.setAttribute("id", alumne + "-status-button-main")
                alumneStatusButtonMain.setAttribute("type", "button");
                alumneStatusButtonMain.setAttribute("class", "btn dropdown-toggle");
                alumneStatusButtonMain.setAttribute("data-bs-toggle", "dropdown");
                alumneStatusButtonMain.setAttribute("aria-expanded", "false");
                alumneStatusButton.appendChild(alumneStatusButtonMain);
                const alumneStatusButtonDropdown = document.createElement("ul");
                alumneStatusButtonDropdown.setAttribute("class", "dropdown-menu");
                alumneStatusButton.appendChild(alumneStatusButtonDropdown);

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

                setAlumneStatus(grupAlumnesList[grup].alumnes[alumne].status);
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

                historialWebButton.onclick = () => toogleSideBar(alumne, "web")
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

                historialAppButton.onclick = () => toogleSideBar(alumne, "apps")
                alumneDivButtons.appendChild(historialAppButton);

                // Delete button
                if(alumne === "prova" || window.location.search.includes("super")){
                    const deleteButton = document.createElement("button");
                    deleteButton.setAttribute("class", "btn btn-danger");
                    deleteButton.setAttribute("type", "button");
                    deleteButton.innerHTML = "Esborra historial";
                    deleteButton.onclick = () => {
                        socket.emit("deleteHistorialFromAlumne", {alumne: alumne});
                    }
                    alumneDivButtons.appendChild(document.createTextNode(' '))
                    alumneDivButtons.appendChild(deleteButton);
                }
            }

            if (!alumneStatusButtonMain) {
                alumneStatusButtonMain = document.getElementById(alumne + "-status-button-main");
                setAlumneStatus(alumneInfo ? alumneInfo.status : "Inactiu");
            }

            if (alumneInfo) {
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

                    // create display hidden apps button
                    /*const w11_hidden_apps_button = document.createElement("div");
                    w11_hidden_apps_button.setAttribute("class", "w11 app-div w11-hidden-apps-button");
                    w11_hidden_apps_button.setAttribute("id", alumne + "-hidden-apps-button");
                    w11_hidden_apps_button.innerHTML = `<svg fill="#ffffff" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M499 270q57 0 104.5 28t75.5 76 28 104q0 39-15 76l122 122q97-81 142-198-36-91-104-162T694 206q-93-40-195-40-86 0-166 29l90 90q38-15 76-15zM83 157l95 94 19 20q-52 40-91.5 93T42 478q36 91 104.5 162T304 750q93 40 195 40 95 0 183-35l139 139 53-53-738-737zm230 230l65 64q-4 15-4 27 0 34 17 62.5t45.5 45.5 62.5 17q14 0 27-3l65 64q-45 22-92 22-56 0-104-28t-76-76-28-104q0-47 22-91zm180-33l131 131v-6q0-34-16.5-63t-45-45.5T500 354h-7z"></path></g></svg>`
                    w11_hidden_apps_button.setAttribute("title", "Mostra les apps ocultes");
                    w11_hidden_apps_button.onclick = () => {

                        const hidden_apps = document.getElementsByClassName("hidden-app");
                        for (const app of hidden_apps) {
                            app.classList.toggle("hidden-app");
                        }
                    }
                    w11_first_container.appendChild(w11_hidden_apps_button);*/

                    for (const app in alumneInfo.apps) {
                        if (Object.hasOwnProperty.call(alumneInfo.apps, app)) {
                            const appInfo = alumneInfo.apps[app];
                            if (!appInfo.opened) continue;
                            const w11_app = document.createElement("div");
                            w11_app.setAttribute("class", "w11 app-div");
                            if(!appInfo.onTaskBar) w11_app.classList.add("hidden-app");
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
                    const browserInfo = alumneInfo.browsers[browser];

                    let browserDiv = document.getElementById(alumne + "-" + browser + "-browser");
                    if(!browserDiv){
                        browserDiv = document.createElement("div");
                        browserDiv.setAttribute("class", "browser");
                        browserDiv.setAttribute("id", alumne + "-" + browser + "-browser");
                        alumneBrowsersDiv.appendChild(browserDiv);
                    }

                    // Si el browser ja no és obert
                    if (!browserInfo.opened) {
                        browserDiv.remove();
                        continue;
                    }

                    // Prepara i separa per finestres
                    const windowInfo = {}
                    for (const tab in browserInfo.tabs) {
                        if (!browserInfo.tabs[tab].opened) continue;
                        if (!windowInfo[browserInfo.tabs[tab].windowId])
                            windowInfo[browserInfo.tabs[tab].windowId] = {};

                        windowInfo[browserInfo.tabs[tab].windowId][tab] = browserInfo.tabs[tab];
                    }

                    for (const windowId in windowInfo) {

                        if (storedAlumneInfo[alumne]
                            && storedAlumneInfo[alumne]
                            && storedAlumneInfo[alumne][browser]
                            && storedAlumneInfo[alumne][browser][windowId]
                            && compareEqualTabs(storedAlumneInfo[alumne][browser][windowId], windowInfo[windowId])) {
                            continue;
                        }

                        let browserWin = undefined;
                        const bw_id = alumne + "-" + browser + "-" + windowId;
                        if (!document.getElementById(bw_id + "-browser-win")) {
                            browserWin = document.createElement("div");
                            browserWin.setAttribute("class", "chrome-tabs");
                            browserWin.setAttribute("id", bw_id + "-browser-win");
                            browserWin.style = "--tab-content-margin: 9px;";
                            browserWin.setAttribute("data-chrome-tabs-instance-id", bw_id);
                            browserDiv.appendChild(browserWin);
                        } else {
                            browserWin = document.getElementById(bw_id + "-browser-win");
                            browserWin.innerHTML = "";
                        }

                        const browserWinInfoDiv = document.createElement("div");
                        browserWinInfoDiv.setAttribute("class", "browser-info");
                        const browserIcon = document.createElement("img");
                        browserIcon.setAttribute("src", "img/" + browserInfo.browser.toLowerCase() + ".png");
                        browserIcon.setAttribute("class", "browser-icon");
                        browserWinInfoDiv.appendChild(browserIcon);
                        browserWin.appendChild(browserWinInfoDiv);

                        const browserContent = document.createElement("div");
                        browserContent.setAttribute("class", "chrome-tabs-content");
                        browserWin.appendChild(browserContent);

                        const browserTabsBottomBar = document.createElement("div");
                        browserTabsBottomBar.setAttribute("class", "chrome-tabs-bottom-bar");
                        browserWin.appendChild(browserTabsBottomBar);

                        const menu_options = creaWebMenuJSON(alumne);

                        // init chrome tabs
                        if (!chromeTabsObjects[alumne])
                            chromeTabsObjects[alumne] = {};
                        chromeTabsObjects[alumne][browser] = new ChromeTabs()
                        chromeTabsObjects[alumne][browser].init(browserWin, menu_options)

                        //browserDiv.addEventListener('activeTabChange', ({ detail }) => console.log('Active tab changed', detail.tabEl))
                        //browserDiv.addEventListener('tabAdd', ({ detail }) => console.log('Tab added', detail.tabEl))
                        browserWin.addEventListener('tabRemove', ({detail}) => {
                            //logger.info('Tab removed', detail.tabEl)
                            socket.emit("closeTab", {
                                alumne: alumne,
                                browser: browserInfo.browser,
                                tabId: detail.tabEl.info.tabId
                            })
                        });

                        for (const tab in windowInfo[windowId]) {
                            const tabInfo = windowInfo[windowId][tab];
                            if (!tabInfo.opened) continue;
                            const noprotocols = ["chrome:", "edge:", "opera:", "brave:", "vivaldi:", "secure:"];
                            const noicon = (tabInfo.webPage.protocol && noprotocols.indexOf(tabInfo.webPage.protocol) !== -1)
                            chromeTabsObjects[alumne][browser].addTab({
                                title: tabInfo.webPage.title,
                                favicon: tabInfo.webPage.favicon ? tabInfo.webPage.favicon :
                                    (noicon ? undefined : "img/undefined_favicon.png"),
                                info: tabInfo
                            }, {
                                background: !tabInfo.active
                            })
                        }

                        // Store windows structure
                        if(!storedAlumneInfo[alumne])
                            storedAlumneInfo[alumne] = {};
                        if(!storedAlumneInfo[alumne][browser])
                            storedAlumneInfo[alumne][browser] = {};
                        storedAlumneInfo[alumne][browser][windowId] = windowInfo[windowId];
                    }

                    // Cerca si hi ha alguna finestra tancada
                    for (const windowId in storedAlumneInfo[alumne][browser]) {
                        if (!windowInfo[windowId]) {
                            delete storedAlumneInfo[alumne][browser][windowId];
                            const browserWin = document.getElementById(alumne + "-" + browser + "-" + windowId + "-browser-win");
                            if (browserWin)
                                browserWin.remove();
                        }
                    }
                }
            }
        }
    }
}


export function preparaAlumnesGrups(data) {
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
            setGrupStatus(grupAlumnesList[grupSelector.value].status);

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
}

export function getGrup(alumneId) {
    for (let grup in grupAlumnesList) {
        if (alumneId in grupAlumnesList[grup].alumnes)
            return grup;
    }

    return undefined
}


export {chromeTabsObjects};
