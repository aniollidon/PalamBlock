const API_REGISTER = '/api/v1/alumne/auth';

// get manifest version
const manifestData = chrome.runtime.getManifest();
const version = manifestData.version;

chrome.storage.local.set({extVersion: version});

import io from 'https://cdn.jsdelivr.net/npm/socket.io-client@4.7.1/+esm';
import {customTabsInfo, customTabInfo, customShortInfo, closeTab, warnTab,
    forceLoginTab, blockTab} from './tabs.js';

class Conn {
    constructor(server){
        this.socket = io.connect(server, {
            transports: ["websocket"],
            path: '/ws-extention',
        }).on('connect_error', (error) => {
            console.error('Connection error:', error.message);
        });

        this.socket.on('connect', this._onConnect.bind(this));
        this.socket.on('connect_error', this._onError.bind(this));
        this.socket.on('do', this._onDo.bind(this));
    }

    _onConnect(){
        console.log('Connected to server');
        this._registerBrowser();
        this._sendCurrentBrowserState();
    }

    _onError(error){
        console.error('PalamBlock error:', error.message);
        return false;
    }

    _onDo(data) {
        if(data.action === "block"){
            blockTab(data.tabId);
        }
        else if(data.action === "warn"){
            warnTab(data.tabId);
        }
        else if(data.action === "close") {
            closeTab(data.tabId)
                .then((res) => {
                    console.log("Tab closed by palamBlock", data.tabId);
                })
                .catch((error) => {
                    console.error("Can't close tab " + data.tabId);
                    // Check if tab still existsS
                    chrome.tabs.get(parseInt(data.tabId), (tab) => {
                        if (tab) {
                            customTabInfo(tab).then((tab_info) => {
                                if (!tab_info) return;
                                tab_info.action = "update";
                                this.socket.emit('tabInfo', tab_info);
                            });
                        }
                    });
                });
        }
    }

    _registerBrowser() {
        customShortInfo().then((short_info) => {
            if (!short_info) return;
            this.socket.emit('registerBrowser', short_info);
        });
    }

    // Envia la informació dels tabs oberts al servidor
    _sendCurrentBrowserState() {
        chrome.tabs.query({}, async (tabs) => {
            customTabsInfo(tabs).then((res) => {
                const {tabsInfos,  activeTab, alumne, browser} = res;
                if (!alumne || !browser) return;

                this.socket.emit('browserInfo', {
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

    connected(){
        return this.socket.connected;
    }

    onRemoveTab(tabid, removed) {
        customShortInfo().then((short_info) => {
            if (!short_info) return;
            short_info.action = "close";
            short_info.tabId = tabid;
            short_info.windowId = removed.windowId;
            this.socket.emit('tabInfo', short_info);
        });
    }

    onActivateTab(activeInfo) {
        chrome.tabs.get(activeInfo.tabId, (tab) => {
            customTabInfo(tab).then((tab_info) => {
                if (!tab_info) return;
                tab_info.action = "active";
                this.socket.emit('tabInfo', tab_info);
            });
        });
    }

    onCompleteTab(tab) {
        customTabInfo(tab).then((tab_info) => {
            if (!tab_info) return;
            tab_info.action = "complete";
            this.socket.emit('tabInfo', tab_info);
        }).catch((error) => {
            // Si l'alumne no està registrat, s'obrirà la finestra de login
            if (error === "alumne") {
                forceLoginTab();
            }
        });
    }

    onIframeNav(tabId, frameId, iframeUrl) {
        chrome.tabs.get(tabId, (tab) => {
            if (chrome.runtime.lastError || !tab) return;
            customTabInfo(tab).then((tab_info) => {
                if (!tab_info) return;
                tab_info.action = "iframe";
                tab_info.iframeUrl = iframeUrl;
                tab_info.iframeHost = new URL(iframeUrl).host.replace("www.", "");
                tab_info.frameId = frameId;
                this.socket.emit('tabInfo', tab_info);
            }).catch((error) => {
                if (error === "alumne") forceLoginTab();
            });
        });
    }

    onUpdateTab(tab) {
        customTabInfo(tab).then(async (tab_info) => {
            if (!tab_info) return;
            tab_info.action = "update";

            if(tab_info.protocol === "secure:") {
                // Avast només es pot detectar en obrir una pestanya nova
                await chrome.storage.local.set({browser: "Avast"}); //TODO mirar (crec q no funciona)
                tab_info.browser = "Avast";
            }

            this.socket.emit('tabInfo', tab_info);
        }).catch((error) => {
            // Si l'alumne no està registrat, s'obrirà la finestra de login
            if (error === "alumne") {
                forceLoginTab();
            }
        });
    }
}

let conn = null;

// Si ja està registrat, es connecta al servidor
chrome.storage.local.get(['alumne', 'server'], (res)=> {
    if (res.alumne && res.alumne !== '') {
        if(!conn) conn = new Conn(res.server);
    }
});

// message from login.js
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.type === 'autentificacio') {
            const register_url = request.server + API_REGISTER;
            fetch(register_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    alumne: request.alumne,
                    clau: request.clau,
                    server: request.server
                })
            }).then((response) => {
                response.json().then((data) => {
                    if (response.status === 200) {
                        sendResponse({status: "OK"});
                        conn = new Conn(request.server);
                        conn._registerBrowser();
                        conn._sendCurrentBrowserState();
                    } else {
                        sendResponse({status: "FAILED"});
                    }
                });
            }).catch((error) => {
                //console.error(error);
                sendResponse({status: "FAILED"});
            });
        }
        else if (request.type === 'uninstall') {
            chrome.management.uninstallSelf();
        }
        else{
            console.error("Unknown request", request);
            sendResponse({status: "FAILED"});
        }
        return true;
    }
);

// On tab actions REMOVE
chrome.tabs.onRemoved.addListener(function (tabid, removed) {
    if(conn) conn.onRemoveTab(tabid, removed);
});

// On tab actions ACTIVATE
chrome.tabs.onActivated.addListener(function (activeInfo) {
    if(conn) conn.onActivateTab(activeInfo);
});

// On iframe navigation COMPLETE (sub-frames only)
chrome.webNavigation.onCompleted.addListener(function (details) {
    // frameId 0 = main frame, ignorem-lo perquè ja ho gestiona onUpdated
    if (details.frameId === 0) return;

    const url = details.url;
    // Ignorem URLs internes del navegador/extensió
    if (url.startsWith("chrome-extension://")) return;
    if (url.startsWith("about:")) return;
    if (url.startsWith("chrome://")) return;
    if (url.startsWith("edge://")) return;
    if (url.startsWith("brave://")) return;
    if (url.startsWith("avast://")) return;

    if (conn) conn.onIframeNav(details.tabId, details.frameId, url);
    console.log("Iframe navigation detected", {tabId: details.tabId, frameId: details.frameId, url: url});
});

// On tab actions UPDATE
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    // Si és una pàgina de l'extenció, no cal enviar la informació
    if(tab.url.startsWith("chrome-extension://")) return;
    if(tab.url.startsWith("edge://")) return;
    if(tab.url.startsWith("chrome://")) return;
    if(tab.url.startsWith("brave://")) return;
    if(tab.url.startsWith("avast://")) return;

    if (changeInfo.status === "complete") {
        if(conn) conn.onCompleteTab(tab);
        else forceLoginTab();
    }
    else if (changeInfo.title || changeInfo.favIconUrl) {
        if(conn) conn.onUpdateTab(tab);
        else forceLoginTab();
    }
});
