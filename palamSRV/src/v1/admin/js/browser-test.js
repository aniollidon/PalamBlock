import {safeURL} from "./utils.js";

let idalumn = new URLSearchParams(window.location.search).get('alumn');
idalumn = idalumn ? idalumn : "prova";
document.getElementById(`alumne`).innerText = idalumn;

const search = document.getElementById(`search`);
const title = document.getElementById(`title`);
const blockedSign = document.getElementById(`blocked-sign`);
//const warned = document.getElementById(`warned`);
//const closed = document.getElementById(`closed`);
const allowedSign = document.getElementById(`allowed-sign`);
const pbButton = document.getElementById(`pbButton`);
let pbStatus = "search";
search.addEventListener(`focus`, () => search.select());
title.addEventListener(`focus`, () => title.select());

function onAction(data) {
    if (data.do === "block") {
        allowedSign.style.display = "none";
        blockedSign.style.display = "";
    } else if (data.do === "warn") {
        //TODO
    } else {
        allowedSign.style.display = "";
        blockedSign.style.display = "none";
    }
}
search.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const url = safeURL(search.value);
        document.getElementById('pburl').innerText = search.value;
        document.getElementById('pburl2').innerText = search.value;
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
                silentQuery: true
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
    if (e.key === 'Enter') {
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
                silentQuery: true
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

    if (pbStatus === "search") {
        search.style.display = "";
        title.style.display = "none";
    } else {
        search.style.display = "none";
        title.style.display = "";
    }
});
