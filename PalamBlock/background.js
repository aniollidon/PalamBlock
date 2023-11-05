const API_URL = 'http://185.61.126.170:4000/api/v1/';
const API_TAB_INFO = API_URL + 'info/tab';
const API_TAB_VALIDACIO = API_URL + 'validacio/tab';
const API_BROWSER_INFO = API_URL + 'info/browser';
const API_REGISTER = API_URL + 'alumne/auth';

importScripts('ua-parser.min.js')

async function getInstanceID() {
    try {
        return await chrome.instanceID.getID()
    } catch (e) {
        //console.log("Error getting instanceID: " + e)
        return "unknown"
    }
}

function getBrowser() {
    try {
        if (navigator.brave.isBrave())
            return "Brave"
    } catch (e) {
    }
    const uap = new UAParser();
    return uap.getBrowser().name;
}

async function customTabInfo(chromeTab) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['alumne'], async (result) => {
            getInstanceID().then((instanceID) => {
                const url = chromeTab.url ? new URL(chromeTab.url) : undefined;
                const basetab_info = {
                    host: url ? url.host: "",
                    protocol: url ? url.protocol: "",
                    search: url ? url.search: "",
                    pathname: url ? url.pathname: "",
                    title: chromeTab.title,
                    favicon: chromeTab.favIconUrl,
                    alumne: result.alumne,
                    browser: getBrowser(),
                    browserId: instanceID,
                    tabId: chromeTab.id,
                    incognito: chromeTab.incognito,
                    active: chromeTab.active,
                    audible: chromeTab.audible,
                }
                resolve(basetab_info);
            });
        });
    });
}

async function customShortInfo() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['alumne'], async (result) => {
            getInstanceID().then((instanceID) => {
                resolve({
                    alumne: result.alumne,
                    browser: getBrowser(),
                    browserId: instanceID
                });
            });
        });
    });
}

async function customTabsInfo(chromeTabs) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['alumne'], async (result) => {
            getInstanceID().then(async (instanceID) => {
                const browser = getBrowser();
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
                        host: url ? url.host: "",
                        protocol: url ? url.protocol: "",
                        search: url ? url.search: "",
                        pathname: url ? url.pathname: "",
                        title: chromeTab.title,
                        favicon: chromeTab.favIconUrl,
                        alumne: alumne,
                        browser: browser,
                        browserId: instanceID,
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
                    browser: browser,
                    browserId: instanceID
                });
            });
        });
    });
}

function handleMessage(request, sender, sendResponse) {
    if (request.type === 'validacio') {
        customTabInfo(sender.tab).then((tab_info) => {
            tab_info.action = "validacio";
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
            });
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
    //console.log("tab closed" + tabid)
    customShortInfo().then((short_info) => {
        short_info.action = "close";
        short_info.tabId = tabid;
        fetch(API_TAB_INFO, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(short_info),
        }).then((response) => {
            // do nothing
        }).catch((error) => {
            //console.error(error);
        });
    });
});


chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.get(activeInfo.tabId, async function (tab) {
        customTabInfo(tab).then((tab_info) => {
            tab_info.action = "active";
            fetch(API_TAB_INFO, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tab_info),
            }).then((response) => {
                // do nothing
            }).catch((error) => {
                //console.error(error);
            });
        });
    });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if(changeInfo.title || changeInfo.favIconUrl) {
        customTabInfo(tab).then((tab_info) => {
            tab_info.action = "update";
            fetch(API_TAB_INFO, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tab_info),
            }).then((response) => {
                // do nothing
            }).catch((error) => {
                //console.error(error);
            });
        });
    }
});

chrome.runtime.onMessage.addListener(handleMessage);

// Send ping to server every minute
function pingMessage() {
    chrome.tabs.query({}, async function (tabs) {
        const {tabsInfos, activeTab, alumne, browser, browserId} = await customTabsInfo(tabs);
        fetch(API_BROWSER_INFO, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                browser: browser,
                browserId: browserId,
                alumne: alumne,
                tabsInfos: tabsInfos,
                activeTab: activeTab
            }),
        }).then((response) => {
            response.json().then((data) => {
                if(data.actions && data.actions.length > 0)
                    data.actions.forEach((action) => {
                        if (action.action === "close") {
                            chrome.tabs.remove(parseInt(action.tabId));
                        }
                        else if (action.action === "refresh") {
                            chrome.tabs.reload(parseInt(action.tabId));
                        }
                    });
            });
        }).catch((error) => {
            //console.error(error);
        });
    });
}

setInterval(pingMessage, 10000); // 10 s
