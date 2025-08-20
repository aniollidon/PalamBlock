import {getGrup, getAlumnes, getGrups} from "./browsers.js";
import {socket} from "./socket.js";
import {
    getIntervalHorari,
    safeURL,
    hhmmToMinutes,
    capitalizeFirstLetter,
    normaTempsActiva,
    minutstoDDHHMM, reconstrueixDuradaOpcio
} from "./utils.js";
import {moveHistorialSidebarToSearch} from "./sidebar.js";
import {commonPlaces, googleServices, teacherHorari} from "./common.js";

const hblockModalWeb = document.getElementById('bloquejaModalWeb')
const blockModalWeb = new bootstrap.Modal(hblockModalWeb)
const hnormesModal = document.getElementById('normesModal')
const normesModal = new bootstrap.Modal(hnormesModal)
const hllistaBlancaModal = document.getElementById('llistaBlancaModal')
const llistaBlancaModal = new bootstrap.Modal(hllistaBlancaModal)
const hDebugModal = document.getElementById('debugModal')
const debugModal = new bootstrap.Modal(hDebugModal)
let normesWebInfo = {}
let llistaBlancaEnUs = {}

export function obre_confirmacio(missatge, siCallback){
    if(!missatge){
        siCallback();
        return;
    }

    const confirmacio = document.getElementById("pbk_modal_confirmacio");
    const confirmacioModal = new bootstrap.Modal(confirmacio);
    const confirmacioMissatge = document.getElementById("pbk_modal_confirmacio_missatge");
    const confirmacioSi = document.getElementById("pbk_modal_confirmacio_dacord");
    confirmacioMissatge.innerHTML = missatge;
    confirmacioSi.onclick = ()=>{
        siCallback();
        confirmacioModal.hide();
    }
    confirmacioModal.show();
}

export function setnormesWebInfo(normesWebInfo_) {
    normesWebInfo = normesWebInfo_;
}

export function creaWebMenuJSON(alumne, browser, alreadyBlocked = false, searhOnHistorial = false) {
    // Opcions del menu contextual
    const obreUrl = (info) => {
        const url = info.webPage.protocol + "//" + info.webPage.host + info.webPage.pathname + info.webPage.search
        window.open(url, '_blank').focus();

    }
    const onBloqueja = (info) => {
        obreDialogBloquejaWeb(info.webPage, alumne, getGrup(alumne), "blocalumne");
    }

    const onBloquejaGrup = (info) => {
        obreDialogBloquejaWeb(info.webPage, alumne, getGrup(alumne), "blocgrup");
    }

    const mostrarBloquejos = (info) => {
        // TODO troba les normes que han causat el bloqueig i filtra-les
        bootbox.alert("Aquesta funcionalitat no està implementada encara.");
    }

    const onTanca = (info) => {
        socket.emit("closeTab", {
            alumne: alumne,
            browser: browser,
            tabId: info.tabId
        })
    }

    const searchOnHistorial = (info) => {
        moveHistorialSidebarToSearch("host:" + info.webPage.host);
    }

    let menu = [
        {text: "Obre aquí", do: obreUrl}
    ]

    if(browser){
        menu.push({
            text: "Tanca",
            do: onTanca
        })
    }

    if(!alreadyBlocked){
        menu.push({
            text: "Bloqueja alumne",
            do: onBloqueja
        });
        menu.push({
            text: "Bloqueja grup",
            do: onBloquejaGrup
        });
    }
    else
        menu.push({
            text: "Mostra bloquejos",
            do: mostrarBloquejos
        });

    if(searhOnHistorial){
        menu.push({
            text: "Cerca a l'historial",
            do: searchOnHistorial
        });
    }
    return menu;
}

function construeixEnabledOn(opcioSeleccionada, nowHM){
    let enabled_on = undefined;
    const dataActual = new Date();
    dataActual.setHours(parseInt(nowHM.split(":")[0]));
    dataActual.setMinutes(parseInt(nowHM.split(":")[1]));

    if(opcioSeleccionada && opcioSeleccionada !== "always") {
        if(opcioSeleccionada === "today") {
            dataActual.setHours(0,0,0,0);
            enabled_on = [{
                datetimes: [dataActual],
                duration: 1440
            }];
        }
        else if(opcioSeleccionada === "nopati") {
            enabled_on =[{
                    days: ["dilluns", "dimarts", "dimecres", "dijous", "divendres"],
                    startHours: ["08:00"],
                    duration: 180
                },
                {
                    days: ["dilluns", "dimarts", "dimecres", "dijous", "divendres"],
                    startHours: ["11:40"],
                    duration: 200
                }];
        }
        else if (opcioSeleccionada.startsWith("*")) {
            const nom = opcioSeleccionada.substring(1);
            if (teacherHorari[nom]) {
                enabled_on = teacherHorari[nom];
            }
        }
        else {
            enabled_on = [{
                datetimes: [dataActual],
                duration:  hhmmToMinutes(opcioSeleccionada) - hhmmToMinutes(nowHM)
            }];
        }
    }

    return enabled_on;
}

function preparaSelectDurada(hSelectDurada, nowHM, opcioSeleccionada = "primera"){
    hSelectDurada.innerHTML = "";
    const nextHora =  getIntervalHorari(nowHM, 1);
    const next2Hora =  getIntervalHorari(nowHM, 2);
    if(nextHora)
        hSelectDurada.appendChild(new Option(
        "Aquesta sessió (fins les " + nextHora + ")",
        nextHora,
        false,
        opcioSeleccionada === nextHora));

    if(next2Hora)
        hSelectDurada.appendChild(
            new Option(
                "Dues sessions (fins les " + next2Hora + ")",
                next2Hora,
                false,
                opcioSeleccionada === next2Hora));

    hSelectDurada.appendChild(new Option("Avui", "today", false, opcioSeleccionada === "today"));
    hSelectDurada.appendChild(new Option("Sempre", "always", false, opcioSeleccionada === "always"));
    hSelectDurada.appendChild(new Option("Excepte al pati", "nopati", false, opcioSeleccionada === "nopati"));
    for (const nom in teacherHorari) {
        hSelectDurada.appendChild(new Option(">carrega horari " + nom, "*"+nom));
    }
}
export function obreDialogBloquejaWeb(webPage, alumne, grup, tab, menustate= undefined) {
    grup = grup ||  "";
    alumne = alumne || "";
    const blocalumnLink = document.getElementById("pills-blocwebalumn-tab");
    const blocgrupLink = document.getElementById("pills-blocwebgrup-tab");
    const severitySelect = document.getElementById("pbk_modalblockweb_severity");
    const hostInput = document.getElementById("pbk_modalblockweb_host");
    const pathnameInput = document.getElementById("pbk_modalblockweb_pathname");
    const searchInput = document.getElementById("pbk_modalblockweb_search");
    const titleInput = document.getElementById("pbk_modalblockweb_title");
    const hostSwitch = document.getElementById("pbk_modalblockweb_host_switch");
    const pathnameSwitch = document.getElementById("pbk_modalblockweb_pathname_switch");
    const searchSwitch = document.getElementById("pbk_modalblockweb_search_switch");
    const titleSwitch = document.getElementById("pbk_modalblockweb_title_switch");
    const titleOptionW = document.getElementById("pbk_modalblockweb_title_optionW");
    const normaButton = document.getElementById("pbk_modalblockweb_creanorma");
    const hSelectDurada = document.getElementById("pbk_modalblockweb-durada");
    const nowHM = new Date().toLocaleTimeString('ca-ES', {hour: '2-digit', minute:'2-digit'});

    let normaWhoSelection = "alumne";
    let normaWhoId = alumne;
    let normaMode = "blacklist";

    blocalumnLink.innerHTML = `Bloqueja alumne ${alumne.toUpperCase()}`;
    blocgrupLink.innerHTML = `Bloqueja grup ${grup.toUpperCase()}`;

    if(!menustate) { // Default menu state
        menustate = {};
        menustate.severity = "block";
        menustate.host = true;
        menustate.pathname = (webPage.pathname !== "/" && webPage.pathname !== "");
        menustate.search = false;
        menustate.title = false;
        menustate.durada = "always";
        menustate.lasttab = undefined;
        menustate.editPrevious = undefined;
    }
    else {
        if(!menustate.durada){
            bootbox.alert({
                message: "Es modificarà la durada de la norma per defecte a <strong>sempre</strong> ja que no es " +
                    "pot recuperar la durada de la norma. Revisa el camp.",
                size: 'small',
                centerVertical: true,
            })
            menustate.durada = "always";
        }
    }

    preparaSelectDurada(hSelectDurada, nowHM, menustate.durada);

    severitySelect.value = menustate.severity;
    hostInput.value = webPage.host;
    pathnameInput.value = webPage.pathname;
    searchInput.value = webPage.search;
    titleInput.value = webPage.title;

    if(menustate.host) {
        hostSwitch.checked = true;
        hostInput.removeAttribute("disabled");
    }else {
        hostSwitch.checked = false;
        hostInput.setAttribute("disabled", "disabled");
    }

    if (menustate.pathname) {
        pathnameSwitch.checked = true;
        pathnameInput.removeAttribute("disabled");
    } else {
        pathnameSwitch.checked = false;
        pathnameInput.setAttribute("disabled", "disabled");
    }

    if(menustate.search) {
        searchSwitch.checked = true;
        searchInput.removeAttribute("disabled");
    } else {
        searchSwitch.checked = false;
        searchInput.setAttribute("disabled", "disabled");
    }

    if(menustate.title) {
        titleSwitch.checked = true;
        titleInput.removeAttribute("disabled");
        titleOptionW.style.display = "";
    } else {
        titleSwitch.checked = false;
        titleInput.setAttribute("disabled", "disabled");
        titleOptionW.style.display = "none";
    }


    blocalumnLink.onclick = (event) => {
        normaWhoSelection = "alumne";
        normaWhoId = alumne;
        normaMode = "blacklist";
        const prevtab = menustate.lasttab;
        menustate.lasttab = "blocalumne";

        if(prevtab === "blocalumne" || !alumne){ // Segon click o l'alumne no està escollit
            blockModalWeb.hide();
            const selectOptions = [];
            for (const a in getAlumnes(grup)) {
                selectOptions.push({text: a, value: a});
            }
            bootbox.prompt({
                title: 'Escull alumne del grup ' + grup + ':',
                inputType: 'select',
                value: alumne? alumne: selectOptions[0].value,
                inputOptions: selectOptions,
                callback: function (result) {
                    if(result){
                        alumne = result;
                        blocalumnLink.innerHTML = `Bloqueja alumne ${alumne.toUpperCase()}`;
                        normaWhoId = alumne;
                    }

                    blockModalWeb.show();
                }
            });
        }
    };

    blocgrupLink.onclick = (event) => {
        normaWhoSelection = "grup";
        normaWhoId = grup;
        normaMode = "blacklist";
        const prevtab = menustate.lasttab;
        menustate.lasttab = "blocgrup";

        if(prevtab === "blocgrup" || ! grup){ // Segon click o el grup no està escollit
            blockModalWeb.hide();
            const selectOptions = [];
            for (const g of getGrups()) {
                selectOptions.push({text: g, value: g});
            }
            bootbox.prompt({
                title: 'Escull grup:',
                inputType: 'select',
                value: grup,
                inputOptions: selectOptions,
                callback: function (result) {
                    if(result){
                        grup = result;
                        blocgrupLink.innerHTML = `Bloqueja grup ${grup.toUpperCase()}`;
                        normaWhoId = grup;

                        alumne = undefined;
                        blocalumnLink.innerHTML = `Bloqueja un alumne`;
                        normaWhoId = alumne;
                    }
                    blockModalWeb.show();
                }
            });
        }
    };

    if (tab === "blocalumne") {
        blocalumnLink.click();
        normaWhoSelection = "alumne";
        normaWhoId = alumne;
    } else if (tab === "blocgrup") {
        blocgrupLink.click();
        normaWhoSelection = "grup";
        normaWhoId = grup;
    }

    hostSwitch.onchange = (event) => {
        if (event.target.checked)
            hostInput.removeAttribute("disabled");
        else
            hostInput.setAttribute("disabled", "disabled");

        menustate.host = event.target.checked;
    };

    pathnameSwitch.onchange = (event) => {
        if (event.target.checked)
            pathnameInput.removeAttribute("disabled");
        else
            pathnameInput.setAttribute("disabled", "disabled");

        menustate.pathname = event.target.checked;
    };

    searchSwitch.onchange = (event) => {
        if (event.target.checked)
            searchInput.removeAttribute("disabled");
        else
            searchInput.setAttribute("disabled", "disabled");

        menustate.search = event.target.checked;
    };

    titleSwitch.onchange = (event) => {
        if (event.target.checked){
            titleInput.removeAttribute("disabled");
            titleOptionW.style.display = "";
        } else {
            titleInput.setAttribute("disabled", "disabled");
            titleOptionW.style.display = "none";
        }

        menustate.title = event.target.checked;
    }

    titleOptionW.onclick = (event) => {
        const title = titleInput.value;

        if(title === "") {
            bootbox.alert({
                message: "El títol ha de contenir almenys una paraula per a la cerca de paraules senceres.",
                size: 'small',
                centerVertical: true,
            })
            return;
        }
        else if (title.startsWith("\\b(") && title.endsWith(")\\b")) {
            titleInput.value = title.substring(3, title.length - 3);
            titleOptionW.classList.remove("word-filtering");
            return;
        }
        else if (title.includes(" ")) {
            bootbox.alert({
                message: "El títol no pot contenir espais en blanc per a la cerca de paraules senceres",
                size: 'small',
                centerVertical: true
            });
            return;
        }

        titleInput.value = "\\b(" + title + ")\\b";
        titleOptionW.classList.add("word-filtering");
    }

    severitySelect.onchange = (event) => {
        menustate.severity = event.target.value;
    }

    normaButton.onclick = (event) => {
        if(!normaWhoId){
            bootbox.alert({
                message:"Error falta seleccionar l'alumne o el grup",
                size: 'small',
                centerVertical: true,
            })
            return;
        }

        let enabled_on = construeixEnabledOn(hSelectDurada.value, nowHM);

        const list = [{
            host: hostSwitch.checked ? hostInput.value : undefined,
            protocol: undefined,
            search: undefined,
            pathname: pathnameSwitch.checked ? pathnameInput.value : undefined,
            title: titleSwitch.checked ? "*" + titleInput.value + "*" : undefined,
            browser: undefined,
            incognito: undefined,
            audible: undefined
        }]

        if(!list[0].host && !list[0].pathname && !list[0].title){
            bootbox.alert({
                message:"Els camps estan buits",
                size: 'small',
                centerVertical: true,
            });
            return;
        }

        let text_confirmacio = undefined;

        if(hSelectDurada.value === "always" || hSelectDurada.value === "today" || hSelectDurada.value === "nopati") {
            text_confirmacio = "Segur que vols afegir una nova norma per " +  (hSelectDurada.value === "today" ?
                    "tot avui" : "sempre") + " a <i>" + normaWhoId + "</i>? Tingues en compte que això pot afectar a " +
                    "altres professors o assignatures" + (hSelectDurada.value === "always" || hSelectDurada.value === "nopati" ? " ja que la norma que has " +
                    "definit està <strong>sempre activa</strong>." : ".")+ " És recomenable definir una durada més " +
                    "concreta. Si saps el que fas, endavant!";
        }

        if(hostInput.value.includes("google") && hostSwitch.checked && !titleSwitch.checked){
            text_confirmacio = "Estàs segur que vols bloquejar un servei de Google a <i>" + normaWhoId + "</i>? " +
                "Això pot afectar a <strong>altres serveis</strong> de Google que es fan servir a l'escola. " +
                "És recomenable definir un filtre per títol en aquest cas. Si saps el que fas, endavant!";
        }

        if(!hostSwitch.checked && (titleSwitch.checked || pathnameSwitch.checked || searchSwitch.checked)){
            text_confirmacio = "Estàs segur que vols bloquejar una pàgina a <i>" + normaWhoId + "</i> sense especificar-ne l'adreça amfitrió? " +
                "Això pot comprometre <strong>altres pàgines</strong> que es fan servir a l'escola. " +
                "És recomenable definir també un filtre per host en aquest cas. Si saps el que fas, endavant!";
        }

        if(hostInput.value === "newtab" && hostSwitch.checked){
            text_confirmacio = "Estàs segur que vols bloquejar la pàgina de nova pestanya a <i>" + normaWhoId + "</i>? " +
                "Aquesta acció és <b> MOLT DESACONSELLABLE</b>, ja que és una funció bàsica del navegador. Si realment " +
                "saps el que fas, endavant!, en tinc els meus dubtes...";
        }

        obre_confirmacio(text_confirmacio, ()=>{
            if(menustate.editPrevious){
                socket.emit("removeNormaWeb", {
                    who: menustate.editPrevious.who,
                    whoid: menustate.editPrevious.whoid,
                    normaId: menustate.editPrevious.normaid
                });
            }

            socket.emit("addNormaWeb", {
                who: normaWhoSelection,
                whoid: normaWhoId,
                severity: severitySelect.value,
                mode: normaMode,
                list: list,
                enabled_on: enabled_on
            })
        })

        blockModalWeb.hide();
    };

    blockModalWeb.show();
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
        let titol = ""
        if (normesWebInfo[whos][whoid][norma].mode !== "blacklist")
            titol += "quan no, ";
        titol += (severity === "block" ? "bloqueja" : "avisa");
        itemTitle.innerHTML = capitalizeFirstLetter(titol);

        const itemSubtitle = document.createElement("small");
        const trash = document.createElement("button");
        trash.setAttribute("type", "button");
        trash.setAttribute("class", "btn btn-outline-secondary btn-sm mx-1");
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
        const eye = document.createElement("span");
        const eyeclose = document.createElement("button");
        eyeclose.setAttribute("type", "button");
        eyeclose.setAttribute("class", "btn btn-outline-secondary btn-sm mx-1");
        eyeclose.innerHTML =
            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash-fill" viewBox="0 0 16 16">
              <path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7 7 0 0 0 2.79-.588M5.21 3.088A7 7 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474z"/>
              <path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12z"/>
            </svg>`;
        const eyeopen = document.createElement("button");
        eyeopen.setAttribute("type", "button");
        eyeopen.setAttribute("class", "btn btn-outline-secondary btn-sm mx-1");
        eyeopen.innerHTML =
            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">
          <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
          <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
        </svg>`;
        trash.onclick = (event) => {
            socket.emit("removeNormaWeb", {normaId: norma, who: who, whoid: whoid});
            normesWebInfo[whos][whoid][norma].removed = true;
            obreDialogNormesWeb(whoid, who);
        };
        pencil.onclick = (event) => {

            if(normesWebInfo[whos][whoid][norma].mode !== "blacklist"){
                bootbox.alert({
                    message:`Aquesta norma no es pot editar (encara) perquè és una llista blanca`,
                    size: 'small',
                    centerVertical: true,
                });
                return;
            }
            normesModal.hide();

            const webpage = {host: normesWebInfo[whos][whoid][norma].lines[0].host || "",
                pathname: normesWebInfo[whos][whoid][norma].lines[0].pathname || "",
                search: normesWebInfo[whos][whoid][norma].lines[0].search || "",
                title: normesWebInfo[whos][whoid][norma].lines[0].title || "",
            }

            // Elimina * que rodejen el títol
            webpage.title = webpage.title.replace(/^\*+/, '').replace(/\*+$/, '');

            obreDialogBloquejaWeb(
                webpage,
                who === "alumne"? whoid: undefined,
                who === "alumne"? getGrup(whoid): whoid,
                "bloc" + who,
                {
                    host: Boolean(webpage.host),
                    pathname: Boolean(webpage.pathname),
                    search: Boolean(webpage.search),
                    title: Boolean(webpage.title),
                    severity: normesWebInfo[whos][whoid][norma].severity,
                    durada: reconstrueixDuradaOpcio(normesWebInfo[whos][whoid][norma].enabled_on),
                    editPrevious: {
                        who: who,
                        whoid: whoid,
                        normaid: norma
                    },
                })
        };


        if(normesWebInfo[whos][whoid][norma].alive && !normaTempsActiva(normesWebInfo[whos][whoid][norma].enabled_on)){
            eye.appendChild(eyeclose);
            itemTitle.innerHTML += " (inactiva)";
        }
        else if(normesWebInfo[whos][whoid][norma].alive) {
            eye.appendChild(eyeclose);
        }
        else {
            eye.appendChild(eyeopen);
            itemTitle.innerHTML += " (desactivada)";
        }

        eyeopen.onclick = (event) => {
            normesWebInfo[whos][whoid][norma].alive = true;
            socket.emit("updateNormaWeb", {normaId: norma, who: who, whoid: whoid, alive: true});
            obreDialogNormesWeb(whoid, who);
        }
        eyeclose.onclick = (event) => {
            normesWebInfo[whos][whoid][norma].alive = false;
            socket.emit("updateNormaWeb", {normaId: norma, who: who, whoid: whoid, alive: false});
            obreDialogNormesWeb(whoid, who);
        }

        itemSubtitle.appendChild(pencil);
        itemSubtitle.appendChild(eye);
        itemSubtitle.appendChild(trash);
        itemHeading.appendChild(itemTitle);
        itemHeading.appendChild(itemSubtitle);
        listItem.appendChild(itemHeading);
        const itemText = document.createElement("p");
        itemText.setAttribute("class", "mb-1");
        itemText.innerHTML = "";

        if(window.location.search.includes("super")){
            const div = document.createElement("div");
            div.setAttribute("class", "norma-line");
            div.innerHTML += "<b>Id:</b> " + norma + " ";
            itemText.appendChild(div);
        }

        if (normesWebInfo[whos][whoid][norma].lines.length > 0){
            for (const line of normesWebInfo[whos][whoid][norma].lines){
                const div = document.createElement("div");
                div.setAttribute("class", "norma-line");
                if(line.host)
                    div.innerHTML += "<b>Host:</b> " + line.host + " ";
                if(line.protocol)
                    div.innerHTML += "<b>Protocol:</b> " + line.protocol + " ";
                if(line.search)
                    div.innerHTML += "<b>Search:</b> " + line.search + " ";
                if(line.pathname)
                    div.innerHTML += "<b>Pathname:</b> " + line.pathname + " ";
                if(line.title)
                    div.innerHTML += "<b>Title:</b> " + line.title + " ";
                if(line.browser)
                    div.innerHTML += "<b>Browser:</b> " + line.browser + " ";
                if(line.incognito)
                    div.innerHTML += "<b>Incognito:</b> " + line.incognito + " ";
                if(line.audible)
                    div.innerHTML += "<b>Audible:</b> " + line.audible + " ";
                itemText.appendChild(div);
            }
        }
        const divTime = document.createElement("div");
        const enabledTime = normesWebInfo[whos][whoid][norma].enabled_on;
        if(enabledTime && enabledTime.length > 0) {
            divTime.innerHTML = "<b>Activat:</b> ";
            for (const time of enabledTime) {
                if (time.days && time.days.length > 0)
                    divTime.innerHTML += "Els " + time.days.join(", ") + " ";
                if (time.startHours && time.startHours.length > 0)
                    divTime.innerHTML += "des de les " + time.startHours.join(", ") + " ";

                if (time.datetimes && time.datetimes.length > 0)
                    divTime.innerHTML += time.datetimes.map((datetime) => {
                        const date = new Date(datetime);
                        const today = new Date();
                        if (date.getDate() === today.getDate() &&
                            date.getMonth() === today.getMonth() &&
                            date.getFullYear() === today.getFullYear())
                            return "Avui des de les " + date.toLocaleTimeString('ca-ES', {hour: '2-digit', minute: '2-digit'});
                        else
                            return "El " + date.toLocaleDateString('ca-ES', {day: '2-digit', month: '2-digit', year: 'numeric'}) + " a partir de les " + date.toLocaleTimeString('ca-ES', {hour: '2-digit', minute: '2-digit'});
                    }).join(", ") + " ";
                if (time.duration)
                    divTime.innerHTML += "durant " + minutstoDDHHMM(time.duration) + ". ";
            }
            itemText.appendChild(divTime);
        }
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
    const hSelectDurada = document.getElementById("llb-durada");
    const nowHM = new Date().toLocaleTimeString('ca-ES', {hour: '2-digit', minute:'2-digit'});

    preparaSelectDurada(hSelectDurada, nowHM);

    hcommonPlaces.innerHTML = "";
    llistaBlancaEnUs[grup] = [];
    webpageInput.value = "";
    webtitleInput.value = "";
    weblist.innerHTML = "";
    weblistcontainer.classList.add("d-none");


    function addWebToLlistaBlanca(web){
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
                            <input type="checkbox" id="llb-weblist-input-${service.title}" data-url="${service.url}" ${service.default? "checked": ""}>
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
        const list = [];

        for (const web of llistaBlancaEnUs[grup]) {
            if(web.startsWith("[title]") )
                list.push({
                    host: undefined,
                    protocol: undefined,
                    search: undefined,
                    pathname: undefined,
                    title: web.substring(8),
                    browser: undefined,
                    incognito: undefined,
                    audible: undefined
                });
            else {
                const url = safeURL(web)
                const host = url.host;
                const pathname = url.pathname;
                const search = url.search;

                if(web === "google.com") {
                    const googleServices = document.getElementsByClassName("llb-child-google-service");
                    for (const service of googleServices) {
                        const input = service.getElementsByTagName("input")[0];
                        if(input.checked){
                            const gurl = input.getAttribute("data-url");
                            gurl.split(',').forEach((url) => {
                                const gsurl = safeURL(url);
                                list.push({
                                    host: gsurl.host === "" ? undefined : gsurl.host,
                                    protocol: gsurl.protocol === "" ? undefined : gsurl.protocol,
                                    search: gsurl.search === "" ? undefined : gsurl.search,
                                    pathname: gsurl.pathname === ""  || gsurl.pathname === "/" ? undefined : gsurl.pathname,
                                    title: undefined,
                                    browser: undefined,
                                    incognito: undefined,
                                    audible: undefined
                                })});
                        }
                    }
                    continue;
                }

                list.push({
                    host: host === "" ? undefined : host,
                    protocol: undefined,
                    search: search === "" ? undefined : search,
                    pathname: pathname === ""  || pathname === "/" ? undefined : pathname,
                    title: undefined,
                    browser: undefined,
                    incognito: undefined,
                    audible: undefined
                })
            }
        }

        const enabled_on = construeixEnabledOn(hSelectDurada.value, nowHM);
        if(list.length === 0) {
            bootbox.alert({
                message:"No hi ha cap web a la llista blanca",
                size: 'small',
                centerVertical: true,
            });
            return;
        }
        obre_confirmacio("Segur que vols crear una llista blanca? La llista blanca bloqueja tot el tràfic que " +
            "no coincideix amb la norma. Si la durada no és la correcta pot interferir amb altres professors i assignatures. ",
            () => {
            socket.emit("addNormaWeb", {  //TODO
                who: "grup",
                whoid: grup,
                severity: "block",
                mode: "whitelist",
                list: list,
                enabled_on: enabled_on
            })
        })

        llistaBlancaModal.hide();
    }

    llistaBlancaModal.show();
}

export function obreDialogDebug(alumne){
    document.getElementById("debugIframe").src = "browser-test.html?alumn=" + alumne;
    debugModal.show();
}
