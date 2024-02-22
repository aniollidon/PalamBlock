const SERVER = 'http://185.61.126.170:4000';
//const SERVER = 'http://localhost:4000';
const API_URL = SERVER + '/api/v1/';
const API_REGISTER = API_URL + 'alumne/auth';

// get manifest version
const manifestData = chrome.runtime.getManifest();
const version = manifestData.version;

import io from 'https://cdn.jsdelivr.net/npm/socket.io-client@4.7.1/+esm';
import {customTabsInfo, customTabInfo, customShortInfo, closeTab, warnTab, forceLoginTab, blockTab, printMesasgeToTab} from './tabs.js';

var socket = io.connect(SERVER, {
    transports: ["websocket"],
    path: '/ws-extention',
});

socket.on('connect', function () {
    console.log('Connected to server');
    registerBrowser();
    sendCurrentBrowserState();
});

socket.on('connect_error', (error) => {
    console.log('Error', error.message);
    return false;
});


socket.on('do', function (data) {
    console.log('do', data);
    if(data.action === "block"){
        blockTab(data.tabId);
    }
    else if(data.action === "warn"){
        warnTab(data.tabId);
    }
    else if(data.action === "close") {
        closeTab(data.tabId)
            .then((res) => {
                console.log("Tab closed", data.tabId);
            })
            .catch((error) => {
            console.error("Can't close tab " + data.tabId);
            // Check if tab still existsS
            chrome.tabs.get(parseInt(data.tabId), (tab) => {
                if (tab) {
                    customTabInfo(tab).then((tab_info) => {
                        if (!tab_info) return;
                        tab_info.action = "update";
                        socket.emit('tabInfo', tab_info);
                    }).catch((error) => {
                    });
                }
            });
        });
    }
    else if (data.action === "message") {
        printMesasgeToTab(data.tabId, data.message);
    }
});


chrome.tabs.onRemoved.addListener(function (tabid, removed) {
    customShortInfo().then((short_info) => {
        if (!short_info) return;
        short_info.action = "close";
        short_info.tabId = tabid;
        short_info.windowId = removed.windowId;
        socket.emit('tabInfo', short_info);
    }).catch((error) => {});

    console.log("Tab removed", tabid);
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.get(activeInfo.tabId, async function (tab) {
        customTabInfo(tab).then((tab_info) => {
            if (!tab_info) return;
            tab_info.action = "active";
            socket.emit('tabInfo', tab_info);
        }).catch((error) => {});
    });
    console.log("Tab activated", activeInfo);
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    //Si és una pàgina de l'extenció, no cal enviar la informació
    console.log(tab.url, tab.url.startsWith("chrome-extension://"));
    if(tab.url.startsWith("chrome-extension://")) return;

    if (changeInfo.status === "complete") {
        customTabInfo(tab).then((tab_info) => {
            if (!tab_info) return;
            tab_info.action = "complete";
            socket.emit('tabInfo', tab_info);
        }).catch((error) => {
            // Si l'alumne no està registrat, s'obrirà la finestra de login
            if (error === "alumne") {
                forceLoginTab();
            }
        });
    }
    else if (changeInfo.title || changeInfo.favIconUrl) {
        customTabInfo(tab).then(async (tab_info) => {
            if (!tab_info) return;
            tab_info.action = "update";

            if(tab_info.protocol === "secure:") {
                // Avast només es pot detectar en obrir una pestanya nova
                await chrome.storage.sync.set({browser: "Avast"}); //TODO mirar
                tab_info.browser = "Avast";
            }

            socket.emit('tabInfo', tab_info);
        }).catch((error) => {
            // Si l'alumne no està registrat, s'obrirà la finestra de login
            if (error === "alumne") {
                forceLoginTab();
            }
        });
    }
    console.log("Tab updated", tabId, changeInfo, tab);
});


// Envia la informació dels tabs oberts al servidor
function sendCurrentBrowserState() {
    chrome.tabs.query({}, async function (tabs) {
        customTabsInfo(tabs).then((res) => {
            const {tabsInfos,  activeTab, alumne, browser} = res;
            if (!alumne || !browser) return;

            socket.emit('browserInfo', {
                alumne: alumne,
                browser: browser,
                tabsInfos: tabsInfos,
                activeTab: activeTab,
                extVersion: version,
            });
        }).catch((error) => {
            // Si l'alumne no està registrat, s'obrirà la finestra de login
            if (error === "alumne") {
                forceLoginTab();
            }
        });
    });
}

// message from login.js
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.type === 'autentificacio') {
            fetch(API_REGISTER, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    alumne: request.alumne,
                    clau: request.clau
                })
            }).then((response) => {
                response.json().then((data) => {
                    if (response.status === 200) {
                        sendResponse({status: "OK"});
                        registerBrowser();
                        sendCurrentBrowserState();
                    } else {
                        sendResponse({status: "FAILED"});
                    }
                });
            }).catch((error) => {
                //console.error(error);
                sendResponse({status: "FAILED"});
            });
        }
        else{
            console.error("Unknown request", request);
            sendResponse({status: "FAILED"});
        }
        return true;
    }
);

function registerBrowser() {
    customShortInfo().then((short_info) => {
        if (!short_info) return;
        socket.emit('registerBrowser', short_info);
    }).catch((error) => {});
}
