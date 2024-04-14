import {chromeTabsObjects} from "./activity.js";
import {creaAppMenuJSON, creaWebMenuJSON} from "./dialogs.js";
import {socket} from "./socket.js";

export function toogleSideBar(alumne, tipus = "web") {
    const historialSidebar = document.getElementById("historialSidebar");
    const historialSidebarClose = document.getElementById("historialSidebarClose");

    historialSidebarClose.onclick = () => {
        historialSidebar.style.setProperty('display', 'none', 'important');
        // Refresca els chrome tabs
        if (chromeTabsObjects[alumne])
            for (let b in chromeTabsObjects[alumne])
                chromeTabsObjects[alumne][b].layoutTabs();
    }

    const prevTipus = historialSidebar.getAttribute("data-historial");
    const prevAlumne = historialSidebar.getAttribute("data-alumne");

    historialSidebar.setAttribute("data-historial", tipus);
    historialSidebar.setAttribute("data-alumne", alumne);

    if (prevTipus !== tipus || prevAlumne !== alumne || historialSidebar.style.display.includes("none")) {

        initHistorialSidebar(alumne);
        // Reset tabs to  i ask for the new data
        const historialSidebarAllTab = document.getElementById("historialSidebar-allTab");
        historialSidebarAllTab.click();

        const historialSideBarTitle = document.getElementById("historialSidebarTitle");
        const historialSideBarContent = document.getElementById("historialSidebarContent");
        historialSideBarTitle.innerHTML = `Historial ${(tipus === "web" ? "web" : "d'Apps")} de l'alumne ${alumne}`;
        historialSideBarContent.innerHTML = "";
        historialSidebar.style.display = "";
    } else {
        historialSidebarClose.click();
    }
}

export function moveHistorialSidebarToSearch(query){
    const historialSidebarSearchTab = document.getElementById("historialSidebar-searchTab");
    const historialSidebarSearchInput = document.getElementById("historialSearchInput");
    historialSidebarSearchTab.click();
    historialSidebarSearchInput.value = query;
    historialSidebarSearchInput.onchange();
}

function resethiddenHistorialAuxInfo() {
    const hiddenAuxInfo = document.getElementById("hiddenHistorialAuxInfo");
    if(hiddenAuxInfo) {
        hiddenAuxInfo.setAttribute("data-historial-length", 0);
        hiddenAuxInfo.setAttribute("data-query", "");
        hiddenAuxInfo.setAttribute("data-prevday", undefined);
        hiddenAuxInfo.setAttribute("data-previd", undefined);
        hiddenAuxInfo.setAttribute("data-prevhost", undefined);
    }
}
export function initHistorialSidebar(alumne) {
    const historialSidebarAllTab = document.getElementById("historialSidebar-allTab");
    const historialSidebarStatsTab = document.getElementById("historialSidebar-statsTab");
    const historialSidebarSortedTab = document.getElementById("historialSidebar-sortedTab");
    const historialSidebarSearchTab = document.getElementById("historialSidebar-searchTab");
    const historialSidebarContent = document.getElementById("historialSidebarContent");
    const historialGraphSidebarContent = document.getElementById("historialGraphSidebarContent");
    const historialSortedSidebarContent = document.getElementById("historialSortedSidebarContent");
    const historialSidebarSearchContent = document.getElementById("historialSearchSidebarContent");
    const historialSearchResults = document.getElementById("historialSearchResults");
    const historialSearchInput = document.getElementById("historialSearchInput");

    historialSidebarAllTab.onclick = () => {
        resethiddenHistorialAuxInfo();

        historialSidebarContent.innerHTML = "Carregant...";
        historialSidebarAllTab.classList.add("active");
        historialSidebarStatsTab.classList.remove("active");
        historialSidebarSortedTab.classList.remove("active");
        historialSidebarSearchTab.classList.remove("active");

        historialGraphSidebarContent.classList.add("d-none");
        historialSidebarContent.classList.remove("d-none");
        historialSortedSidebarContent.classList.add("d-none");
        historialSidebarSearchContent.classList.add("d-none");

        socket.emit("getHistorialWeb", {alumne: alumne});
    }

    historialSidebarStatsTab.onclick = () => {
        historialGraphSidebarContent.innerHTML = "Carregant...";
        historialSidebarAllTab.classList.remove("active");
        historialSidebarStatsTab.classList.add("active");
        historialSidebarSortedTab.classList.remove("active");
        historialSidebarSearchTab.classList.remove("active");

        historialGraphSidebarContent.classList.remove("d-none");
        historialSidebarContent.classList.add("d-none");
        historialSortedSidebarContent.classList.add("d-none");
        historialSidebarSearchContent.classList.add("d-none");

        socket.emit("getEachBrowserLastUsage", {alumne: alumne, pastDays: 7});
    }

    historialSidebarSortedTab.onclick = () => {
        historialSortedSidebarContent.innerHTML = "Carregant...";
        historialSidebarAllTab.classList.remove("active");
        historialSidebarStatsTab.classList.remove("active");
        historialSidebarSortedTab.classList.add("active");
        historialSidebarSearchTab.classList.remove("active");

        historialGraphSidebarContent.classList.add("d-none");
        historialSidebarContent.classList.add("d-none");
        historialSortedSidebarContent.classList.remove("d-none");
        historialSidebarSearchContent.classList.add("d-none");

        socket.emit("getHistorialHostsSortedByUsage", {alumne: alumne});
    }

    historialSidebarSearchTab.onclick = () => {
        resethiddenHistorialAuxInfo();

        historialSearchResults.innerHTML = "";
        historialSidebarAllTab.classList.remove("active");
        historialSidebarStatsTab.classList.remove("active");
        historialSidebarSortedTab.classList.remove("active");
        historialSidebarSearchTab.classList.add("active");

        historialGraphSidebarContent.classList.add("d-none");
        historialSidebarContent.classList.add("d-none");
        historialSortedSidebarContent.classList.add("d-none");
        historialSidebarSearchContent.classList.remove("d-none");

        historialSearchInput.focus();
        historialSearchInput.value = "";
        historialSearchInput.onchange = () => {
            resethiddenHistorialAuxInfo();

            const search = historialSearchInput.value;
            if (search.length > 2) {
                historialSearchResults.innerHTML = "Carregant...";
                socket.emit("getSearchHistorialWeb", {alumne: alumne, search: search});
            }
        }

        //socket.emit("getHistorialWeb", {alumne: alumne});
    }
}

export function drawHistorialWeb(alumne, historial, query) {

    const historialSidebar = document.getElementById("historialSidebar");
    const historialSideBarContent = query?
        document.getElementById("historialSearchResults"):
        document.getElementById("historialSidebarContent");

    let hiddenAuxInfo = document.getElementById("hiddenHistorialAuxInfo");

    if (!hiddenAuxInfo) {
        hiddenAuxInfo = document.createElement("div");
        hiddenAuxInfo.setAttribute("id", "hiddenHistorialAuxInfo");
        hiddenAuxInfo.setAttribute("style", "display: none;");
        historialSideBarContent.innerHTML = "";
        hiddenAuxInfo.setAttribute("data-historial-length", 0);
        hiddenAuxInfo.setAttribute("data-alumne", alumne);
        hiddenAuxInfo.setAttribute("data-query",  "");
        hiddenAuxInfo.setAttribute("data-prevday", undefined);
        hiddenAuxInfo.setAttribute("data-previd", undefined);
        hiddenAuxInfo.setAttribute("data-prevhost", undefined);
        historialSidebar.appendChild(hiddenAuxInfo);
    }

    if(query && hiddenAuxInfo.getAttribute("data-query") !== query){
        historialSideBarContent.innerHTML = "";
        if(historial.length === 0 && hiddenAuxInfo.getAttribute("data-historial-length") === "0"){
            historialSideBarContent.innerHTML = "No s'han trobat resultats";
            return;
        }
    }
    else if(!query && hiddenAuxInfo.getAttribute("data-query") !== ""){
        historialSideBarContent.innerHTML = "";
    }
    else if(hiddenAuxInfo.getAttribute("data-historial-length") === "0"){
        historialSideBarContent.innerHTML = ""; // Esborra per a començar net
    }

    let prevday = hiddenAuxInfo.getAttribute("data-prevday");
    let previd = hiddenAuxInfo.getAttribute("data-previd");
    let prevhost = hiddenAuxInfo.getAttribute("data-prevhost");
    const historialLength = parseInt(hiddenAuxInfo.getAttribute("data-historial-length")) + historial.length;

    for (const webPage of historial) {
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
        if(webPage.pbAction === "block")
            a.classList.add("text-danger");
        const tooltip = "Obert a " + webPage.browser + (webPage.incognito ? " en mode incognit" : "") +
            `\n${webPage.title}`+
            `\n${webPage.protocol}//${webPage.host}${webPage.pathname}${webPage.search}`;
        a.setAttribute("title", tooltip);

        const divHeader = document.createElement("div");
        divHeader.setAttribute("class", "d-flex w-100 align-items-center justify-content-between");

        const dTitile = document.createElement("strong");
        dTitile.setAttribute("class", "mb-1 nomesunalinia");
        const favicon = document.createElement("img");
        const noprotocols = ["chrome:", "edge:", "opera:", "brave:", "vivaldi:", "secure:", "about:"];
        const noicon = (webPage.protocol && noprotocols.indexOf(webPage.protocol) !== -1)
        favicon.src = webPage.favicon && !noicon ? webPage.favicon : "img/undefined_favicon.png";

        favicon.onload = () => {
            if (favicon.naturalWidth === 0) {
                favicon.src = "img/undefined_favicon.png";
            }
        }
        favicon.onerror = () => {
            favicon.src = "img/undefined_favicon.png";
            return true;
        }
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
                alumne: alumne,
                webPage: {
                    host: webPage.host,
                    pathname: webPage.pathname,
                    search: webPage.search,
                    title: webPage.title,
                    protocol: webPage.protocol,
                }
            }
            const opcionMenuContextual = creaWebMenuJSON(alumne, undefined, webPage.pbAction === "block");

            openMenu(ev, opcionMenuContextual, info);
        }
        a.appendChild(divHeader);
        a.appendChild(divContent);
        historialSideBarContent.appendChild(a);

        previd = webPage._id;
        prevhost = webPage.host;
    }

    if (historial.length !== 0) {
        // Mostra'n més
        const a = document.createElement("a");
        a.setAttribute("href", "#");
        a.setAttribute("class", "list-group-item list-group-item-action list-group-item-dark lh-tight");
        a.setAttribute("aria-current", "true");
        a.innerHTML = `<strong class="mb-1 nomesunalinia">Mostra'n més</strong>`;
        a.onclick = () => {
            if(query)
                socket.emit("getSearchHistorialWeb", {alumne: alumne, search: query, offset: historialLength});
            else
                socket.emit("getHistorialWeb", {alumne: alumne, offset: historialLength});
            a.remove();
        };

        historialSideBarContent.appendChild(a);
    }

    hiddenAuxInfo.setAttribute("data-historial-length", historialLength);
    hiddenAuxInfo.setAttribute("data-alumne", alumne);
    hiddenAuxInfo.setAttribute("data-query", query? query : "");
    hiddenAuxInfo.setAttribute("data-prevday", prevday);
    hiddenAuxInfo.setAttribute("data-prevhost", prevhost);
    hiddenAuxInfo.setAttribute("data-previd", previd);

    // Refresca els chrome tabs
    if (chromeTabsObjects[alumne])
        for (let b in chromeTabsObjects[alumne])
            chromeTabsObjects[alumne][b].layoutTabs();

}

export function drawHistorialHostsSortedByUsage(alumne, sortedHistorial, days) {
    const historialSortedSidebarContent = document.getElementById("historialSortedSidebarContent");
    historialSortedSidebarContent.innerHTML = "";

    const divHeader = document.createElement("div");
    divHeader.setAttribute("class", "d-flex w-100 align-items-center justify-content-between");
    const titleh7 = document.createElement("h7");
    titleh7.setAttribute("class", "bg-light border-top border-bottom date-historial-heading px-2");
    titleh7.innerHTML = `Hosts per ús durant els últims ${days} dies`;
    divHeader.appendChild(titleh7);
    const buttonchangeHistorialDays = document.createElement("button");
    buttonchangeHistorialDays.setAttribute("class", "border-0 button-calendar-days");
    buttonchangeHistorialDays.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calendar-week" viewBox="0 0 16 16">
      <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm-3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm-5 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z"/>
      <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
    </svg>`;
    buttonchangeHistorialDays.onclick = () =>  {
        const days = prompt("Introdueix el nombre de dies", "7");
        socket.emit("getHistorialHostsSortedByUsage", {alumne: alumne, pastDays: days});
        historialSortedSidebarContent.innerHTML = "Carregant...";
    };
    titleh7.appendChild(buttonchangeHistorialDays);

    historialSortedSidebarContent.appendChild(divHeader);

    for (const i in sortedHistorial) {
        const hostName = sortedHistorial[i].host;

        if(hostName === "") continue;

        const us = sortedHistorial[i].count;
        const a = document.createElement("a");
        a.setAttribute("href", "#");
        a.setAttribute("class", "list-group-item list-group-item-action lh-tight py-1");
        a.setAttribute("title", `Host: ${hostName} - Usos: ${us}`);

        const divHeader = document.createElement("div");
        divHeader.setAttribute("class", "d-flex w-100 align-items-center justify-content-between");

        const dTitile = document.createElement("strong");
        dTitile.setAttribute("class", "mb-1 nomesunalinia");
        const favicon = document.createElement("img");
        //get favicon url from google
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostName}`;
        favicon.setAttribute("src", faviconUrl);
        favicon.setAttribute("class", "historial-favicon");
        dTitile.appendChild(favicon);

        const text = document.createTextNode(hostName);
        dTitile.appendChild(text);
        divHeader.appendChild(dTitile);

        const dHora = document.createElement("small");
        dHora.innerHTML = `Usos: ${us}`;
        divHeader.appendChild(dHora);

        a.appendChild(divHeader);
        historialSortedSidebarContent.appendChild(a);

        a.onclick = (ev) => {
            const info = {
                alumne: alumne,
                webPage: {
                    host: hostName,
                    pathname: "",
                    search: "",
                    title: "",
                    protocol: "",
                }
            }
            const opcionMenuContextual = creaWebMenuJSON(alumne, undefined, false, true);

            openMenu(ev, opcionMenuContextual, info);
        }
    }
}

export function drawHistorialApps(alumne, historial) {
    const historialSideBarContent = document.getElementById("historialSidebarContent");

    let hiddenAuxInfo = document.getElementById("hiddenHistorialAuxInfo");

    if (!hiddenAuxInfo) {
        hiddenAuxInfo = document.createElement("div");
        hiddenAuxInfo.setAttribute("id", "hiddenHistorialAuxInfo");
        hiddenAuxInfo.setAttribute("style", "display: none;");
        historialSideBarContent.innerHTML = "";
        hiddenAuxInfo.setAttribute("data-historial-length", 0);
        hiddenAuxInfo.setAttribute("data-alumne", alumne);
        hiddenAuxInfo.setAttribute("data-prevday", undefined);
        historialSideBarContent.appendChild(hiddenAuxInfo);
    }

    let prevday = hiddenAuxInfo.getAttribute("data-prevday");
    const historialLength = parseInt(hiddenAuxInfo.getAttribute("data-historial-length")) + historial.length;

    for (const process of historial) {
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
        if(!process.onTaskBar)
            a.classList.add("hidden-app");
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
        const opcionMenuContextual = creaAppMenuJSON(alumne, process.processName);

        a.onclick = (ev) => {
            const info = {
                alumne: alumne,
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

    if (historial.length !== 0) {
        // Mostra'n més
        const a = document.createElement("a");
        a.setAttribute("href", "#");
        a.setAttribute("class", "list-group-item list-group-item-action list-group-item-dark lh-tight");
        a.setAttribute("aria-current", "true");
        a.innerHTML = `<strong class="mb-1 nomesunalinia">Mostra'n més</strong>`;
        a.onclick = () => {
            socket.emit("getHistorialApps", {alumne: alumne, offset: historialLength});
            a.remove();
        };

        historialSideBarContent.appendChild(a);
    }

    hiddenAuxInfo.setAttribute("data-historial-length", historialLength);
    hiddenAuxInfo.setAttribute("data-alumne", alumne);
    hiddenAuxInfo.setAttribute("data-prevday", prevday);

    // Refresca els chrome tabs
    if (chromeTabsObjects[alumne])
        for (let b in chromeTabsObjects[alumne])
            chromeTabsObjects[alumne][b].layoutTabs();

}

export function drawHistorialStats(alumne, lastUsage) {
    const historialSideBarContent = document.getElementById("historialGraphSidebarContent");
    historialSideBarContent.innerHTML = "";

    const divHeader = document.createElement("div");
    divHeader.setAttribute("class", "d-flex w-100 align-items-center justify-content-between");
    divHeader.innerHTML = `<h7 class="bg-light border-top border-bottom date-historial-heading px-2">Última vegada que s'ha utilitzat </h7>`;
    historialSideBarContent.appendChild(divHeader);

    for (const browser in lastUsage) {
        const lastUsageDate = (new Date(lastUsage[browser])).toLocaleDateString('ca-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
        const a = document.createElement("a");
        a.setAttribute("href", "#");
        a.setAttribute("class", "list-group-item list-group-item-action lh-tight py-1");
        a.setAttribute("title", `Últim ús de ${browser}: ${lastUsageDate}`);

        const divHeader = document.createElement("div");
        divHeader.setAttribute("class", "d-flex w-100 align-items-center justify-content-between");

        const dTitile = document.createElement("strong");
        dTitile.setAttribute("class", "mb-1 nomesunalinia");
        const favicon = document.createElement("img");
        favicon.setAttribute("src", `img/${browser.toLowerCase()}.png`);
        favicon.setAttribute("class", "historial-favicon");
        dTitile.appendChild(favicon);

        const text = document.createTextNode(browser);
        dTitile.appendChild(text);
        divHeader.appendChild(dTitile);

        const dHora = document.createElement("small");
        dHora.innerHTML = lastUsageDate;
        divHeader.appendChild(dHora);

        a.appendChild(divHeader);
        historialSideBarContent.appendChild(a);
    }
}