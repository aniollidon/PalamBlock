const API_URL = 'http://localhost:4000/api/v1/';
const API_VALIDACIO = API_URL + 'validacio';
const API_INFO = API_URL + 'info';
const API_REGISTER = API_URL + 'alumne';

importScripts('ua-parser.min.js')

async function getInstanceID() {
    try{
        return await chrome.instanceID.getID()
    }
    catch (e) {
        console.log("Error getting instanceID: " + e)
        return "unknown"
    }
}
function getBrowser() {
    try{
        if (navigator.brave.isBrave())
            return "Brave"
    }
    catch (e) {}
    const uap = new UAParser();
    return uap.getBrowser().name;
}
async function handleMessage(request, sender, sendResponse) {
    if(request.type === 'validacio') {

        const url = new URL(sender.url)

        fetch(API_VALIDACIO, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                host: url.host,
                protocol: url.protocol,
                search: url.search,
                pathname: url.pathname,
                title: sender.tab.title,
                favicon: sender.tab.favIconUrl,
                alumne: request.alumne,
                browser: getBrowser(),
                browserId: await getInstanceID(),
                tabId: sender.tab.id,
                incognito: sender.tab.incognito
            })
        }).then((response) => {
            response.json().then((data) => {
                if (response.status === 200) {
                    sendResponse({do: data.do});
                } else {
                    sendResponse({do: "allow"});
                }
            });
        }).catch((error) => {
            console.error(error);
            sendResponse({do: "allow", aim: "error"});
        });
    }
    else if(request.type === 'register') {
        fetch(API_REGISTER, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                alumne: request.alumne,
                grup: request.grup,
                clau: request.clau,
                nom: "",
                cognoms: ""
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
                console.error(error);
                sendResponse({status: "FAILED"});
            });
        }

    return true;
}
chrome.tabs.onRemoved.addListener(function(tabid, removed) {

    console.log("tab closed" + tabid)

    chrome.storage.sync.get(['alumne'], async function(result) {
        if(!result.alumne){
            return
        }

        fetch(API_INFO, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: "close",
                tabId: tabid,
                browser: getBrowser(),
                browserId: await getInstanceID(),
                alumne: result.alumne
            }),
        }).then((response) => {
            // do nothing
        }).catch((error) => {
            console.error(error);
        });
});
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, async function(tab) {
        chrome.storage.sync.get(['alumne'], async function(result) {
            if(!result.alumne){
                return
            }
            fetch(API_INFO, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: "active",
                    tabId: tab.id,
                    browser: getBrowser(),
                    browserId: await getInstanceID(),
                    alumne: result.alumne
                }),
            }).then((response) => {
                // do nothing
            }).catch((error) => {
                console.error(error);
            });
        });
    });
});
chrome.runtime.onMessage.addListener(handleMessage);

// Send ping to server every minute
function pingMessage() {
    chrome.storage.sync.get(['alumne'], async function(result) {
        if(!result.alumne){
            return
        }

        // Get tabs ids
        chrome.tabs.query({}, async function(tabs) {
            let tabsIds = [];
            let tabActive = null;
            for (let i = 0; i < tabs.length; i++) {
                tabsIds.push(tabs[i].id);
                if (tabs[i].active) {
                    tabActive = tabs[i];
                }
            }
            fetch(API_INFO, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: "ping",
                    browser: getBrowser(),
                    browserId: await getInstanceID(),
                    alumne: result.alumne,
                    tabsIds: tabsIds,
                    tabId: tabActive
                }),
            }).then((response) => {
                // do nothing
            }).catch((error) => {
                console.error(error);
            });
        });
    });
}
setInterval(pingMessage, 60000); // 1 minute