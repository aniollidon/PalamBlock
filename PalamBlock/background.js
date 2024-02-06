//const API_URL = 'http://185.61.126.170:4000/api/v1/';
const API_URL = 'http://localhost:4000/api/v1/';
const API_TAB_INFO = API_URL + 'info/tab';
const API_TAB_VALIDACIO = API_URL + 'validacio/tab';
const API_BROWSER_INFO = API_URL + 'info/browser';
const API_REGISTER = API_URL + 'alumne/auth';

importScripts('ua-parser.min.js')
importScripts('socket.io.msgpack.min.js')

const socket = io('http://localhost:4000');

socket.on('connect', function () {
    console.log('Connected to server');
});

// Gestiona errors d'autenticació
socket.on('connect_error', (error) => {
    console.log('Error', error.message);
});

async function getBrowser() {
    const stored = await chrome.storage.sync.get(['browser']);
    if(!stored || !stored.browser || stored.browser === "unknown") {
        try {
            if (navigator.brave.isBrave())
                chrome.storage.sync.set({browser: "Brave"});
                return "Brave"
        } catch (e) {
        }

        const uap = new UAParser();
        chrome.storage.sync.set({browser: uap.getBrowser().name});
        return uap.getBrowser().name;
    }
    else {
        return stored.browser;
    }
}

async function customTabInfo(chromeTab) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['alumne'], async (result) => {

            if (!result.alumne) {
                resolve(null);
                return;
            }
            const url = chromeTab.url ? new URL(chromeTab.url) : undefined;
            const basetab_info = {
                host: url ? url.host : "",
                protocol: url ? url.protocol : "",
                search: url ? url.search : "",
                pathname: url ? url.pathname : "",
                title: chromeTab.title,
                favicon: chromeTab.favIconUrl,
                alumne: result.alumne,
                browser: await getBrowser(),
                windowId: chromeTab.windowId,
                tabId: chromeTab.id,
                incognito: chromeTab.incognito,
                active: chromeTab.active,
                audible: chromeTab.audible,
            }
            resolve(basetab_info);
        });
    });
}

async function customShortInfo() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['alumne'], async (result) => {
            if (!result.alumne) {
                resolve(null);
                return;
            }
            resolve({
                alumne: result.alumne,
                browser: await getBrowser(),
            });
        });
    });
}

async function customTabsInfo(chromeTabs) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['alumne'], async (result) => {
            if (!result.alumne) {
                resolve(null);
                return;
            }
            const browser = await getBrowser();
            const alumne = result.alumne;
            let tabsInfos = {};
            let activeTab = null;
            for (let i = 0; i < chromeTabs.length; i++) {
                if (chromeTabs[i].active) {
                    activeTab = chromeTabs[i].id;
                }

                const chromeTab = chromeTabs[i];
                const url = chromeTab.url ? new URL(chromeTab.url) : undefined;
                tabsInfos[chromeTab.id] = {
                    host: url ? url.host : "",
                    protocol: url ? url.protocol : "",
                    search: url ? url.search : "",
                    pathname: url ? url.pathname : "",
                    title: chromeTab.title,
                    favicon: chromeTab.favIconUrl,
                    alumne: alumne,
                    browser: browser,
                    windowId: chromeTab.windowId,
                    tabId: chromeTab.id,
                    incognito: chromeTab.incognito,
                    active: chromeTab.active,
                    audible: chromeTab.audible,
                };
            }
            resolve({
                tabsInfos: tabsInfos,
                activeTab: activeTab,
                alumne: alumne,
                browser: browser
            });
        });
    });
}

function handleMessage(request, sender, sendResponse) {
    if (request.type === 'validacio') {
        customTabInfo(sender.tab).then((tab_info) => {
            if (!tab_info) return;

            tab_info.action = "validacio";
            socket.emit('tabInfo', tab_info);
            sendResponse({do: "allow"});

            /*
            fetch(API_TAB_VALIDACIO, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tab_info)
            }).then((response) => {
                response.json().then((data) => {
                    if (response.status === 200) {
                        sendResponse({do: data.do});
                    } else {
                        sendResponse({do: "allow"}); // TODO: potser canviar-ho per block
                    }
                });
            }).catch((error) => {
                //console.error(error);
                sendResponse({do: "allow", aim: "error"});
            });*/
        });
    } else if (request.type === 'autentificacio') {
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
                } else {
                    sendResponse({status: "FAILED"});
                }
            });
        }).catch((error) => {
            //console.error(error);
            sendResponse({status: "FAILED"});
        });
    }
    return true;
}

chrome.tabs.onRemoved.addListener(function (tabid, removed) {
    customShortInfo().then((short_info) => {
        if (!short_info) return;
        short_info.action = "close";
        short_info.tabId = tabid;
        short_info.windowId = removed.windowId;
        socket.emit('tabInfo', short_info);
    });
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.get(activeInfo.tabId, async function (tab) {
        customTabInfo(tab).then((tab_info) => {
            if (!tab_info) return;
            tab_info.action = "active";
            socket.emit('tabInfo', tab_info);
        });
    });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.title || changeInfo.favIconUrl) {
        customTabInfo(tab).then(async (tab_info) => {
            if (!tab_info) return;
            tab_info.action = "update";

            if(tab_info.protocol === "secure:") {
                // Avast només es pot detectar en obrir una pestanya nova
                await chrome.storage.sync.set({browser: "Avast"});
                tab_info.browser = "Avast";
            }

            socket.emit('tabInfo', tab_info);
        });
    }
});

chrome.runtime.onMessage.addListener(handleMessage);

// Send ping to server every minute
function pingMessage() {
    chrome.tabs.query({}, async function (tabs) {
        const {tabsInfos, activeTab, alumne, browser} = await customTabsInfo(tabs);
        if (!alumne || !browser) return;

        socket.emit('browserInfo', {
            alumne: alumne,
            browser: browser,
            tabsInfos: tabsInfos,
            activeTab: activeTab
        });
    });
}

setInterval(pingMessage, 10000); // 10 s
