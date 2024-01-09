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
        historialSidebarClose.click();
    }


}

export function drawHistorialWeb(alumne, historial) {
    const historialSideBarContent = document.getElementById("historialSidebarContent");
    const opcionMenuContextual = creaWebMenuJSON(alumne);

    let hiddenAuxInfo = document.getElementById("hiddenHistorialAuxInfo");

    if (!hiddenAuxInfo) {
        hiddenAuxInfo = document.createElement("div");
        hiddenAuxInfo.setAttribute("id", "hiddenHistorialAuxInfo");
        hiddenAuxInfo.setAttribute("style", "display: none;");
        historialSideBarContent.innerHTML = "";
        hiddenAuxInfo.setAttribute("data-historial-length", 0);
        hiddenAuxInfo.setAttribute("data-alumne", alumne);
        hiddenAuxInfo.setAttribute("data-prevday", undefined);
        hiddenAuxInfo.setAttribute("data-previd", undefined);
        hiddenAuxInfo.setAttribute("data-prevhost", undefined);
        historialSideBarContent.appendChild(hiddenAuxInfo);
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
        const tooltip = "Obert a " + webPage.browser + (webPage.incognito ? " en mode incognit" : "") + `\n${webPage.protocol}//${webPage.host}${webPage.pathname}${webPage.search}`;
        a.setAttribute("title", tooltip);

        const divHeader = document.createElement("div");
        divHeader.setAttribute("class", "d-flex w-100 align-items-center justify-content-between");


        const dTitile = document.createElement("strong");
        dTitile.setAttribute("class", "mb-1 nomesunalinia");
        const favicon = document.createElement("img");
        const noprotocols = ["chrome:", "edge:", "opera:", "brave:", "vivaldi:", "secure:"];
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
            socket.emit("getHistorialWeb", {alumne: alumne, offset: historialLength});
            a.remove();
        };

        historialSideBarContent.appendChild(a);
    }

    hiddenAuxInfo.setAttribute("data-historial-length", historialLength);
    hiddenAuxInfo.setAttribute("data-alumne", alumne);
    hiddenAuxInfo.setAttribute("data-prevday", prevday);
    hiddenAuxInfo.setAttribute("data-prevhost", prevhost);
    hiddenAuxInfo.setAttribute("data-previd", previd);

    // Refresca els chrome tabs
    if (chromeTabsObjects[alumne])
        for (let b in chromeTabsObjects[alumne])
            chromeTabsObjects[alumne][b].layoutTabs();

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
