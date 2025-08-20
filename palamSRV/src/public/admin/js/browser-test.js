import {safeURL} from "./utils.js";

let idalumn = new URLSearchParams(window.location.search).get('alumn');
idalumn = idalumn ? idalumn : "prova";
document.getElementById(`alumne`).innerText = idalumn;

const search = document.getElementById(`search`);
const title = document.getElementById(`title`);
const check = document.getElementById(`check`);
const pbButton = document.getElementById(`pbButton`);
const pbUrl = document.getElementById(`pburl`);
const dotdotdot = document.getElementById(`dotdotdot`);
let specificTime = undefined;
let pbStatus = "search";
search.addEventListener(`focus`, () => search.select());
title.addEventListener(`focus`, () => title.select());

function onAction(data) {
    if (data.do === "block") {
        check.classList.add("action-blocked");
        check.classList.remove("action-allowed");
        check.classList.remove("action-unknown");
    } else if (data.do === "warn") {
        //TODO
    } else if (data.do === "allow") {
        check.classList.add("action-allowed");
        check.classList.remove("action-blocked");
        check.classList.remove("action-unknown");
    }
    else{
        check.classList.remove("action-allowed");
        check.classList.remove("action-blocked");
        check.classList.add("action-unknown");
    }
}
search.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        onAction({do: ""});
        const url = safeURL(search.value);
        pbUrl.innerText = search.value;
        fetch('/api/v1/validacio/tab', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                host: url.host,
                protocol: url.protocol,
                search: url.search,
                pathname: url.pathname,
                title: '',
                alumne: idalumn,
                browser: 'PalamBlock',
                tabId: '0',
                incognito: false,
                favicon: '',
                active: true,
                audible: false,
                silentQuery: true,
                timestampQuery: specificTime
            })
        }).then(response => response.json())
            .then(data => {
                onAction(data);
                console.log('Success:', data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }
});

title.addEventListener('keypress', (e) => {
    onAction({do: ""});
    if (e.key === 'Enter') {
        pbUrl.innerText = "La pàgina amb títol <<"  + title.value + ">>";
        fetch('/api/v1/validacio/tab', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                host: '',
                protocol: '',
                search: '',
                pathname: '',
                title: title.value,
                alumne: idalumn,
                browser: 'PalamBlock',
                tabId: '0',
                incognito: false,
                favicon: '',
                active: true,
                audible: false,
                silentQuery: true,
                timestampQuery: specificTime
            })
        }).then(response => response.json())
            .then(data => {
                onAction(data);
                console.log('Success:', data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }
});


pbButton.addEventListener('click', () => {
    pbStatus = pbStatus === "search" ? "title" : "search";
    pbUrl.innerText = "Aquesta pàgina";

    if (pbStatus === "search") {
        search.style.display = "";
        title.style.display = "none";
        search.focus();
        title.value = "Títol d'exemple";
    } else {
        search.style.display = "none";
        title.style.display = "";
        title.focus();
        search.value = "https://exemple.cat";
    }

    onAction({do: "allow"})
});

dotdotdot.addEventListener('click', () => {
    // Pregunta a quina hora i data volem debugar
    const defaultdate = new Date();
    const ans = prompt("Quina hora i data vols debugar? (dd/mm/yyyy hh:mm:ss)", defaultdate.toLocaleString());
    if(!ans) return;
    document.getElementById("info_datetime").innerText =  " el dia i hora: " + ans;

    //Nova data des del format dd/mm/yyyy hh:mm:ss
    const date = ans.split(" ")[0].split("/");
    const time = ans.split(" ")[1].split(":");
    //new Date(year, monthIndex, day, hours, minutes, seconds)

    specificTime = new Date(date[2], date[1]-1, date[0], time[0], time[1], time[2]);

    onAction({do: ""});
});