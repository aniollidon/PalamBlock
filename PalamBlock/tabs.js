import uaParserJs from 'https://cdn.jsdelivr.net/npm/ua-parser-js@1.0.37/+esm'

const manifestData = chrome.runtime.getManifest();
const version = manifestData.version;

function urlToHost(url) {
    let s =  new URL(url).host;
    return s.replace("www.", "");
}

async function getBrowser() {
    const stored = await chrome.storage.local.get(['browser']);
    if(!stored || !stored.browser || stored.browser === "unknown") {
        try {
            if (navigator.brave.isBrave())
                chrome.storage.local.set({browser: "Brave"});
            return "Brave"
        } catch (e) {
        }

        const uap = new uaParserJs();
        chrome.storage.local.set({browser: uap.getBrowser().name});
        return uap.getBrowser().name;
    }
    else {
        return stored.browser;
    }
}

export async function customTabsInfo(chromeTabs) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['alumne'], async (result) => {
            if (!result.alumne) {
                reject("alumne");
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
                    extVersion: version
                };
            }
            resolve({
                tabsInfos: tabsInfos,
                activeTab: activeTab,
                alumne: alumne,
                browser: browser
            });
        });

        return true;
    });
}

export async function customTabInfo(chromeTab) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['alumne'], async (result) => {

            if (!result.alumne) {
                reject("alumne");
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
                extVersion: version
            }
            resolve(basetab_info);
        });
        return true;
    });
}

export async function customShortInfo() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['alumne'], async (result) => {
            if (!result.alumne) {
                reject("alumne");
                return;
            }
            resolve({
                alumne: result.alumne,
                browser: await getBrowser(),
                extVersion: version
            });
        });

        return true;
    });
}

export async function forceLoginTab() {
    // is login tab already open?
    const opened = await new Promise((resolve, reject) => {
        chrome.tabs.query({}, (tabs) => {
            for (let i = 0; i < tabs.length; i++) {
                if (tabs[i].url === chrome.runtime.getURL("login.html")) {
                    resolve(true);
                    return;
                }
            }
            resolve(false);
        });
    });

    if (opened) {
        // leave the tab open and close others
        chrome.tabs.query({}, (tabs) => {
            for (let i = 0; i < tabs.length; i++) {
                if (tabs[i].url !== chrome.runtime.getURL("login.html")) {
                    chrome.tabs.remove(tabs[i].id).catch((error) => {});
                }
            }
        });
    }
    else {
        // Create login tab and close others
        chrome.tabs.create({url: chrome.runtime.getURL("login.html")}, (tab) => {
            // Close all other tabs
            const tabId = tab.id;
            chrome.tabs.query({}, (tabs) => {
                for (let i = 0; i < tabs.length; i++) {
                    if (tabs[i].id !== tabId) {
                        chrome.tabs.remove(tabs[i].id).catch((error) => {});
                    }
                }
            });
        });
    }
}

export async function blockTab(tabId) {
    tabId = parseInt(tabId);

    return new Promise((resolve, reject) => {
        // find tab by id
        chrome.tabs.get(tabId, (tab) => {
            // Set tab url
            chrome.tabs.update(tabId, {url: chrome.runtime.getURL("blocked.html?title="+ tab.title + "&host=" + urlToHost(tab.url))}, (tab) => {
                resolve(tab);
            });
        });

        return true;
    });
}

export async function closeTab(tabId) {
    return new Promise((resolve, reject) => {
        const removing = chrome.tabs.remove(parseInt(tabId))
        removing.then(resolve, reject);
        return true;
    });
}
export async function warnTab(tabId) {
    tabId = parseInt(tabId);
    return new Promise((resolve, reject) => {
        chrome.tabs.get(tabId, (tab) => {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                    document.body.innerHTML = `
                        <div id="palablock" style="background-color: rgb(77 77 86 / 65%);
                        position: fixed; z-index: 9999; height: 100%;width: 100%;
                        display: flex; justify-content: center; align-content: center;
                        align-items: center; user-select: none; color: white;">
                            <div style="background: #00000096; padding: 50px; text-align: center">
                                <div style="font-size: 50px;"> Ups! Estàs accedint a una pàgina no recomenada per PalamBlock </div>
                                <div style="font-size: 20px;"> Clica per continuar</div>
                            </div>
                        </div> ` + document.body.innerHTML;

                        document.getElementById("palablock").addEventListener("click", function(){
                            document.getElementById("palablock").remove();
                        });
                }
                }).then(() => {
                    resolve(tab);
                }).catch((error) => {
                    reject(error);
                });
        });
        return true;
    });
}


export async function printMesasgeToTab(tabId, message) {
    tabId = parseInt(tabId);
    return new Promise((resolve, reject) => {
        // TODO Open new tab with message

        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (message) => {

                if(document.getElementById("palablock"))
                    document.getElementById("palablock").remove();

                document.body.innerHTML = `
                        <div id="palablock" style="background-color: rgb(77 77 86 / 65%);
                        position: fixed; z-index: 9999; height: 100%;width: 100%;
                        display: flex; justify-content: center; align-content: center;
                        align-items: center; user-select: none; color: white;">
                            <div style="background: #00000096; padding: 50px; text-align: center">
                                <div style="font-size: 50px;"> Missatge de PalamBlock: ${message} </div>
                                <div style="font-size: 20px;"> Clica per continuar</div>
                            </div>
                        </div> ` + document.body.innerHTML;

                document.getElementById("palablock").addEventListener("click", function(){
                    document.getElementById("palablock").remove();
                });
            },
            args: [message]
        }).then(() => {
            resolve();
        }).catch((error) => {
            reject(error);
        });
        return true;
    });
}
