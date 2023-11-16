const validacioService = require('./validacioService');
require('dotenv').config();
const alumneService = require("./alumneService");
const logger = require('../logger').logger;

class WebPage {
    constructor(host, protocol, search, pathname, title, favicon) {
        this.host = host;
        this.protocol = protocol;
        this.search = search;
        this.pathname = pathname;
        this.title = title;
        this.favicon = favicon;
    }

    join() {
        return this.protocol + "//" + this.host + this.pathname + this.search;
    }
}

class TabStatus {
    constructor(tabId, tabPropierties, webPage, timestamp) {
        this.tabId = tabId.toString();
        this.incognito = tabPropierties.incognito;
        this.status = tabPropierties.actionStatus;
        this.webPage = webPage;
        this.active = tabPropierties.active;
        this.audible = tabPropierties.audible;
        this.windowId = tabPropierties.windowId;
        this.opened = true;
        this.startedAt = timestamp;
        this.updatedAt = timestamp;

    }

    update(tabPropierties, webPage, timestamp) {

        let changed = false;
        if (tabPropierties.incognito && this.incognito !== tabPropierties.incognito) {
            this.incognito = tabPropierties.incognito;
            changed = true;
        }

        if (tabPropierties.actionStatus && this.status !== tabPropierties.actionStatus) {
            this.status = tabPropierties.actionStatus;
            changed = true;
        }

        if (tabPropierties.active !== undefined && this.active !== tabPropierties.active) {
            this.active = tabPropierties.active;
            changed = this.active;
        }

        if (tabPropierties.audible !== undefined && this.audible !== tabPropierties.audible) {
            this.audible = tabPropierties.audible;
            changed = true;
        }

        if (tabPropierties.windowId && this.windowId !== tabPropierties.windowId) {
            this.windowId = tabPropierties.windowId;
            changed = true;
        }

        if (webPage && this.webPage.join() !== webPage.join()) {
            this.webPage = webPage;
            changed = true;
        }

        if (webPage && this.webPage.title !== webPage.title) {
            this.webPage.title = webPage.title;
            changed = true;
        }

        if (webPage && webPage.favicon && this.webPage.favicon !== webPage.favicon) {
            this.webPage.favicon = webPage.favicon;
            changed = true;
        }

        if (changed) this.updatedAt = timestamp;

        this.opened = true;

        return changed;
    }

    close(timestamp) {
        this.opened = false;
        this.updatedAt = timestamp;
    }


    setInactive(timestamp) {
        let changed = this.active;
        this.active = false;
        this.updatedAt = timestamp;
        return changed;
    }

    setActive(timestamp) {
        let changed = !this.active;
        this.active = true;
        this.updatedAt = timestamp;
        return changed;
    }
}

class BrowserStatus {
    constructor(browser, timestamp, onUpdateCallback) {
        this.browser = browser;
        this.tabs = {};
        this.startedAt = timestamp;
        this.updatedAt = timestamp;
        this._passiveupdatedAt = timestamp;
        this._onUpdateCallback = onUpdateCallback;
        this.opened = true;

        // Comprova si el browser s'ha desconnectat
        const NOCONN_TIME = parseInt(process.env.NOCONNECTION_TIME || 60000);
        setInterval(() => {
            if (this.opened && this._passiveupdatedAt && (new Date() - this._passiveupdatedAt) > NOCONN_TIME) {
                for (const tab in this.tabs) {
                    this.tabs[tab].close(new Date());
                }
                this.opened = false;
                this._onUpdateCallback();
            }
        }, NOCONN_TIME);
    }

    setAlive(timestamp) {
        this._passiveupdatedAt = timestamp;
        this.opened = true;
    }

    registerCallback(onUpdateCallback) {
        this._onUpdateCallback = onUpdateCallback;
    }

    register(tabId, tabPropierties, webPage, timestamp) {
        this.setAlive(timestamp);
        tabId = tabId.toString();
        // Check if tab exists
        if (!this.tabs[tabId]) {
            this.tabs[tabId] = new TabStatus(tabId, tabPropierties, webPage, timestamp);
        } else this.tabs[tabId].update(tabPropierties, webPage, timestamp);

        this.updatedAt = timestamp;
    }

    update(tabId, tabPropierties, webPage, timestamp) {
        this.setAlive(timestamp);
        let changes = false;
        tabId = tabId.toString();

        // Check if tab exists
        if (!this.tabs[tabId]) {
            this.tabs[tabId] = new TabStatus(tabId, tabPropierties, webPage, timestamp);
            changes = true;
        } else changes = this.tabs[tabId].update(tabPropierties, webPage, timestamp);

        if (tabPropierties.active) {
            changes = this.setActiveTab(tabId, timestamp) || changes;
        }

        this.updatedAt = timestamp;
        return changes;
    }

    closeTab(tabId, timestamp) {
        this.setAlive(timestamp);
        tabId = tabId.toString();

        if (!this.tabs[tabId]) {
            console.error("Tab " + tabId + " not found");
            return; //TODO algo millor
        }

        this.tabs[tabId].close(timestamp);
        this.updatedAt = timestamp;
    }

    setActiveTab(tabId, timestamp) {
        this.setAlive(timestamp);
        let changes = false;
        tabId = tabId.toString();

        // Desactivem tots els altres tabs
        for (const tab in this.tabs) {
            if (tab !== tabId.toString()) changes = this.tabs[tab].setInactive(timestamp) || changes; else changes = this.tabs[tab].setActive(timestamp) || changes;
        }

        // Comprovacions
        if (!this.tabs[tabId]) {
            console.error("Tab " + tabId + " not found");
            return changes;
        }

        changes = this.tabs[tabId].setActive(timestamp) || changes;
        this.updatedAt = timestamp;
        return changes;
    }

    checkTabs(tabsInfos, activeTab, timestamp) {
        if (!tabsInfos) return false;
        if (!activeTab) return false;

        this.setAlive(timestamp);

        let changes = false;
        activeTab = activeTab.toString();

        for (const tab in this.tabs) { // Repassa els tabs existents
            if (!Object.keys(tabsInfos).includes(tab)) { // Els tabs tancats
                this.tabs[tab].close(timestamp);
                changes = true;
            } else { // Els tabs oberts
                const webPage = new WebPage(tabsInfos[tab].host, tabsInfos[tab].protocol, tabsInfos[tab].search, tabsInfos[tab].pathname, tabsInfos[tab].title, tabsInfos[tab].favicon);
                const tabPropierties = {
                    incognito: tabsInfos[tab].incognito,
                    actionStatus: undefined,
                    active: tabsInfos[tab].active,
                    audible: tabsInfos[tab].audible,
                    windowId: tabsInfos[tab].windowId
                };
                changes = this.tabs[tab].update(tabPropierties, webPage, timestamp);
            }
        }

        for (const tab in tabsInfos) {
            if (!Object.keys(this.tabs).includes(tab)) { // Repassa els tabs nous
                const webPage = new WebPage(tabsInfos[tab].host, tabsInfos[tab].protocol, tabsInfos[tab].search, tabsInfos[tab].pathname, tabsInfos[tab].title, tabsInfos[tab].favicon);
                const tabPropierties = {
                    incognito: tabsInfos[tab].incognito,
                    actionStatus: undefined,
                    active: tabsInfos[tab].active,
                    audible: tabsInfos[tab].audible,
                    windowId: tabsInfos[tab].windowId

                };
                this.tabs[tab.toString()] = new TabStatus(tab, tabPropierties, webPage, timestamp);
                changes = true;
            }
        }

        changes = this.setActiveTab(activeTab, timestamp) || changes;

        return changes;
    }

}

class AppStatus {
    constructor(app, status, timestamp) {
        this.name = app.name;
        this.title = app.title;
        this.path = app.path;
        this.status = status;
        this.startedAt = timestamp;
        this.updatedAt = timestamp;
        this.opened = true;
        this.iconB64 = app.iconType === "base64" ? app.icon : undefined
        this.iconSVG = app.iconType === "svg" ? app.icon : undefined
    }

    update(status, timestamp) {
        this.status = status;
        this.updatedAt = timestamp;
        this.opened = true;
    }

    close() {
        this.opened = false;
    }
}

class AlumneStatus {
    constructor(alumne, onUpdateCallback) {
        this.alumne = alumne;
        this.browsers = {};
        this.apps = {};
        this.conected = true;
        this._onUpdateCallback = onUpdateCallback;
        this._lastNews = new Date();

        // Comprova si l'alumne s'ha desconnectat
        const NOCONN_TIME = parseInt(process.env.NOCONNECTION_TIME || 60000);
        setInterval(() => {
            if (this.conected && this._lastNews && (new Date() - this._lastNews) > NOCONN_TIME) {
                //console.log("Alumne " + this.alumne + " disconnected");
                for (const app in this.apps) {
                    this.apps[app].close();
                }
                this.conected = false;
                this._onUpdateCallback();
            }
        }, NOCONN_TIME);
    }

    setAlive(timestamp) {
        this._lastNews = timestamp;
        this.conected = true;
    }

    registerApp(appinfo, status, timestamp) {
        this.setAlive(timestamp);
        if (!this.apps[appinfo.pid]) this.apps[appinfo.pid] = new AppStatus(appinfo, status, timestamp); else this.apps[appinfo.pid].update(status, timestamp);
    }

    closeNotUpdatedApps(timestamp) {
        this.setAlive(timestamp);
        for (const app in this.apps) {
            if (this.apps[app].updatedAt !== timestamp) this.apps[app].close();
        }
    }

    register(browser, tabId, tabPropierties, webPage, timestamp) {
        this.setAlive(timestamp);
        // Check if browser exists
        if (!this.browsers[browser]) {
            this.browsers[browser] = new BrowserStatus(browser, timestamp, this._onUpdateCallback);
        }

        this.browsers[browser].register(tabId, tabPropierties, webPage, timestamp);
    }

    update(browser, tabId, tabPropierties, webPage, timestamp) {
        this.setAlive(timestamp);
        // Check if browser exists
        if (!this.browsers[browser]) {
            this.browsers[browser] = new BrowserStatus(browser, timestamp, this._onUpdateCallback);
        }

        return this.browsers[browser].update(tabId, tabPropierties, webPage, timestamp);
    }

    closeTab(browser, tabId, timestamp) {
        this.setAlive(timestamp);
        if (!this.browsers[browser]) {
            console.error("Browser " + browser + " not found");
            return; //TODO algo millor
        }

        this.browsers[browser].closeTab(tabId, timestamp);
    }

    checkTabs(browser, tabsInfos, activeTab, timestamp) {
        this.setAlive(timestamp);

        if (!this.browsers[browser]) {
            this.browsers[browser] = new BrowserStatus(browser, timestamp, this._onUpdateCallback);
        }

        return this.browsers[browser].checkTabs(tabsInfos, activeTab, timestamp);
    }

    updateCallbacks(callback) {
        this._onUpdateCallback = callback;
        for (const browser in this.browsers) {
            this.browsers[browser].registerCallback(callback);
        }
    }
}

class AllAlumnesStatus {
    constructor(onUpdateCallback = () => {
    }) {
        this.alumnesStat = {};
        this.pendingBrowserActions = {};
        this._onSavePending = false;
        this._onUpdateCallback = onUpdateCallback;
    }

    registerCallback(onUpdateCallback) {
        this._onUpdateCallback = onUpdateCallback;
        for (const alumne in this.alumnesStat) {
            if (!this.alumnesStat[alumne]) continue; // Això no hauria de caldre
            this.alumnesStat[alumne].updateCallbacks(onUpdateCallback);
        }
    }

    register(alumne, timestamp, host, protocol, search, pathname, title, browser, windowId, tabId, incognito, favicon, active, action, audible) {

        const webPage = new WebPage(host, protocol, search, pathname, title, favicon);
        const tabPropierties = {
            incognito: incognito, actionStatus: action, active: active, audible: audible, windowId: windowId
        };

        // Check if alumne exists
        if (!this.alumnesStat[alumne]) {
            this.alumnesStat[alumne] = new AlumneStatus(alumne, this._onUpdateCallback);
        }

        this.alumnesStat[alumne].register(browser, tabId, tabPropierties, webPage, timestamp);

        this._onUpdateCallback();
    }

    registerApp(appinfo, alumne, status, timestamp) {
        if (!this.alumnesStat[alumne]) {
            this.alumnesStat[alumne] = new AlumneStatus(alumne, this._onUpdateCallback);
        }

        this.alumnesStat[alumne].registerApp(appinfo, status, timestamp);
    }

    closeNotUpdatedApps(alumne, timestamp) {
        if (this.alumnesStat[alumne]) {
            this.alumnesStat[alumne].closeNotUpdatedApps(timestamp);
        }
    }

    closeTab(alumne, tabId, browser, timestamp) {
        if (!this.alumnesStat[alumne]) {
            this.alumnesStat[alumne] = new AlumneStatus(alumne, this._onUpdateCallback);
        }

        this.alumnesStat[alumne].closeTab(browser, tabId, timestamp);

        //console.log("Alumne " + alumne + " close tab " + tabId + " on browser " + browser);

        // Comprova si estava a la llista d'accions pendents. Si ho estava, l'esborra
        if (this.pendingBrowserActions[alumne] && this.pendingBrowserActions[alumne][browser]) {
            const index = this.pendingBrowserActions[alumne][browser].findIndex((action) => action.tabId === tabId);
            if (index !== -1) {
                this.pendingBrowserActions[alumne][browser].splice(index, 1);
                if (this.pendingBrowserActions[alumne][browser].length === 0) {
                    delete this.pendingBrowserActions[alumne][browser];
                }
            }
        }
        this._onUpdateCallback();

    }


    checkTabs(alumne, browser, tabsInfos, activeTab, timestamp) {
        if (!this.alumnesStat[alumne]) {
            this.alumnesStat[alumne] = new AlumneStatus(alumne, this._onUpdateCallback);
        }

        const changes = this.alumnesStat[alumne].checkTabs(browser, tabsInfos, activeTab, timestamp);
        if (changes) this._onUpdateCallback();
    }

    update(alumne, timestamp, host, protocol, search, pathname, title, browser, windowId, tabId, incognito, favicon, active, audible) {
        const webPage = new WebPage(host, protocol, search, pathname, title, favicon);
        const tabPropierties = {
            incognito: incognito, actionStatus: undefined, active: active, audible: audible, windowId: windowId
        };

        // Check if alumne exists
        if (!this.alumnesStat[alumne]) {
            this.alumnesStat[alumne] = new AlumneStatus(alumne, this._onUpdateCallback);
        }

        const changes = this.alumnesStat[alumne].update(browser, tabId, tabPropierties, webPage, timestamp);
        if (changes) this._onUpdateCallback();
    }
}

const allAlumnesStatus = new AllAlumnesStatus();

function registerTabAction(action, alumne, timestamp, host, protocol, search, pathname, title, browser, windowId, tabId, incognito, favicon, active, audible) {
    logger.debug("registerTabAction: action=" + action + " alumne=" + alumne + " timestamp=" + timestamp + " host=" + host + " protocol=" + protocol + " search=" + search + " pathname=" + pathname + " title=" + title + " browser=" + browser + " windowId=" + windowId + " tabId=" + tabId + " incognito=" + incognito + " favicon=" + favicon + " active=" + active + " audible=" + audible);

    if (action === "close") {
        allAlumnesStatus.closeTab(alumne, tabId, browser, timestamp);
    } else if (action === "update" || action === "active") {
        allAlumnesStatus.update(alumne, timestamp, host, protocol, search, pathname, title, browser, windowId, tabId, incognito, favicon, active, audible);
    }
}

function register(alumne, timestamp, host, protocol, search, pathname, title, browser, windowId, tabId, incognito, favicon, active, action, audible) {
    logger.debug("register: alumne=" + alumne + " timestamp=" + timestamp + " host=" + host + " protocol=" + protocol + " search=" + search + " pathname=" + pathname + " title=" + title + " browser=" + browser + " windowId=" + windowId + " tabId=" + tabId + " incognito=" + incognito + " favicon=" + favicon + " active=" + active + " action=" + action + " audible=" + audible);
    allAlumnesStatus.register(alumne, timestamp, host, protocol, search, pathname, title, browser, windowId, tabId, incognito, favicon, active, action, audible);
}


function registerBrowserInfo(alumne, browser, tabsInfos, activeTab, timestamp) {
    logger.debug("registerBrowserInfo: alumne=" + alumne + " browser=" + browser + " tabsInfos=" + tabsInfos + " activeTab=" + activeTab + " timestamp=" + timestamp);
    allAlumnesStatus.checkTabs(alumne, browser, tabsInfos, activeTab, timestamp);
}

async function getAlumnesActivity() {
    logger.debug("getAlumnesActivity");
    // Get alumnes status on db
    for (const alumne in allAlumnesStatus.alumnesStat) {
        try {
            allAlumnesStatus.alumnesStat[alumne].status = await alumneService.getAlumneStatus(alumne);
        } catch (err) {
            console.error("Error getting alumne=" + alumne + " status. Esborrant alumne", err);
            allAlumnesStatus.alumnesStat[alumne] = undefined; // Esborra l'alumne
        }
    }
    return allAlumnesStatus.alumnesStat;
}

function registerOnUpdateCallback(callback) {
    if (!callback) return;
    allAlumnesStatus.registerCallback(callback);
}

function remoteCloseTab(alumne, browser, tabId) {
    logger.debug("remoteCloseTab: alumne=" + alumne + " browser=" + browser + " tabId=" + tabId);
    const action = {action: 'close', browser: browser, tabId: tabId};
    if (!allAlumnesStatus.pendingBrowserActions[alumne]) allAlumnesStatus.pendingBrowserActions[alumne] = {};

    if (!allAlumnesStatus.pendingBrowserActions[alumne][browser]) allAlumnesStatus.pendingBrowserActions[alumne][browser] = []

    allAlumnesStatus.pendingBrowserActions[alumne][browser].push(action)
}

function getBrowserPendingActions(alumne, browser) {
    logger.debug("getBrowserPendingActions: alumne=" + alumne + " browser=" + browser);
    if (!allAlumnesStatus.pendingBrowserActions[alumne]) return undefined;
    if (!allAlumnesStatus.pendingBrowserActions[alumne][browser]) return undefined;
    const pending = allAlumnesStatus.pendingBrowserActions[alumne][browser];

    if (!allAlumnesStatus._onSavePending) delete allAlumnesStatus.pendingBrowserActions[alumne][browser];

    return pending;
}

async function normesWebHasChanged() {
    for (const alumne in allAlumnesStatus.alumnesStat) {
        const validacio = new validacioService.Validacio(alumne);
        for (const browser in allAlumnesStatus.alumnesStat[alumne].browsers) {
            for (const tab in allAlumnesStatus.alumnesStat[alumne].browsers[browser].tabs) {
                const action = {action: 'refresh', tabId: tab};
                const webPage = allAlumnesStatus.alumnesStat[alumne].browsers[browser].tabs[tab].webPage;
                const permition = await validacio.checkWeb(webPage.host, webPage.protocol, webPage.search, webPage.pathname, webPage.title);

                if (permition !== "allow") {
                    allAlumnesStatus._onSavePending = true;
                    if (!allAlumnesStatus.pendingBrowserActions[alumne]) allAlumnesStatus.pendingBrowserActions[alumne] = {};
                    if (!allAlumnesStatus.pendingBrowserActions[alumne][browser]) allAlumnesStatus.pendingBrowserActions[alumne][browser] = [];
                    allAlumnesStatus.pendingBrowserActions[alumne][browser].push(action)
                    allAlumnesStatus._onSavePending = false;
                }
            }
        }
    }
}

function registerApps(apps, alumne, status, timestamp) {
    logger.debug("registerApps: apps=" + apps + " alumne=" + alumne + " status=" + status + " timestamp=" + timestamp);
    for (const appinfo of apps) {

        allAlumnesStatus.registerApp(appinfo, alumne, status[appinfo.name], timestamp);
    }
    allAlumnesStatus.closeNotUpdatedApps(alumne, timestamp);
    allAlumnesStatus._onUpdateCallback();
}

function operaHasInfo(alumne, caption, since) {
    if (allAlumnesStatus.alumnesStat[alumne] === undefined) return false;
    const browserslist = allAlumnesStatus.alumnesStat[alumne].browsers;
    // Search for opera browers
    for (const browsername in allAlumnesStatus.alumnesStat[alumne].browsers) {
        if (browsername.toLowerCase().includes("opera")) {
            // Search for tab with caption
            for (const tab in browserslist[browsername].tabs) {
                if (browserslist[browsername].tabs[tab].webPage.title.includes(caption)) {
                    if (browserslist[browsername].tabs[tab].updatedAt > since) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

module.exports = {
    register,
    registerTabAction,
    registerBrowserInfo,
    getAlumnesActivity,
    registerOnUpdateCallback,
    remoteCloseTab,
    getBrowserPendingActions,
    normesWebHasChanged,
    registerApps,
    operaHasInfo
}
