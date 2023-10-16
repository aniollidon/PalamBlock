
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

        if(tabPropierties.actionStatus && this.status !== tabPropierties.actionStatus) {
            this.status = tabPropierties.actionStatus;
            changed = true;
        }

        if(tabPropierties.active !== undefined && this.active !== tabPropierties.active) {
            this.active = tabPropierties.active;
            changed = this.active;
        }

        if(webPage && this.webPage.join() !== webPage.join()) {
            this.webPage = webPage;
            changed = true;
        }

        if(changed)
            this.updatedAt = timestamp;

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
    constructor(browser, browserId, timestamp) {
        this.browser = browser;
        this.browserId = browserId;
        this.tabs = {};
        this.startedAt = timestamp;
        this.updatedAt = timestamp;
    }

    register(tabId, tabPropierties, webPage, timestamp){
        tabId = tabId.toString();
        // Check if tab exists
        if(!this.tabs[tabId]) {
            this.tabs[tabId] = new TabStatus(tabId, tabPropierties, webPage, timestamp);
        }
        else
            this.tabs[tabId].update(tabPropierties, webPage, timestamp);

        this.updatedAt = timestamp;
    }

    update(tabId, tabPropierties, webPage, timestamp){
        let changes = false;
        tabId = tabId.toString();

        // Check if tab exists
        if(!this.tabs[tabId]) {
            this.tabs[tabId] = new TabStatus(tabId, tabPropierties, webPage, timestamp);
            changes = true;
        }
        else
            changes = this.tabs[tabId].update(tabPropierties, webPage, timestamp);

        if(tabPropierties.active) {
            changes = this.setActiveTab(tabId, timestamp) || changes;
        }

        this.updatedAt = timestamp;
        return changes;
    }

    closeTab(tabId, timestamp) {
        tabId = tabId.toString();

        if(!this.tabs[tabId]) {
            console.error("Tab " + tabId + " not found");
            return; //TODO algo millor
        }

        this.tabs[tabId].close(timestamp);
        this.updatedAt = timestamp;
    }

    setActiveTab(tabId, timestamp) {
        let changes = false;
        tabId = tabId.toString();

        // Desactivem tots els altres tabs
        for (const tab in this.tabs) {
            if (tab !== tabId.toString())
                changes = this.tabs[tab].setInactive(timestamp) || changes;
            else
                changes = this.tabs[tab].setActive(timestamp) || changes;
        }

        // Comprovacions
        if(!this.tabs[tabId]) {
            console.error("Tab " + tabId + " not found");
            return changes;
        }

        changes = this.tabs[tabId].setActive(timestamp) || changes;
        this.updatedAt = timestamp;
        return changes;
    }

    checkTabs(tabsInfos, activeTab, timestamp) {
        let changes = false;
        activeTab = activeTab.toString();

        for (const tab in this.tabs) { // Repassa els tabs existents
            if (!Object.keys(tabsInfos).includes(tab)) { // Els tabs tancats
                this.tabs[tab].close(timestamp);
                changes = true;
            }
            else { // Els tabs oberts
                const webPage = new WebPage(tabsInfos[tab].host, tabsInfos[tab].protocol, tabsInfos[tab].search, tabsInfos[tab].pathname, tabsInfos[tab].title, tabsInfos[tab].favicon);
                const tabPropierties = {
                    incognito: tabsInfos[tab].incognito,
                    actionStatus: undefined,
                    active: tabsInfos[tab].active
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
                    active: tabsInfos[tab].active
                };
                this.tabs[tab.toString()] = new TabStatus(tab, tabPropierties, webPage, timestamp);
                changes = true;
            }
        }

        changes = this.setActiveTab(activeTab, timestamp) || changes;

        return changes;
    }

}

class AlumneStatus {
    constructor(alumne) {
        this.alumne = alumne;
        this.browsers = {};
    }

    register(browser, browserId, tabId, tabPropierties, webPage, timestamp) {
        // Check if browser exists
        if(!this.browsers[browser+browserId]) {
            this.browsers[browser+browserId] = new BrowserStatus(browser, browserId, timestamp);
        }

        this.browsers[browser+browserId].register(tabId, tabPropierties, webPage, timestamp);
    }

    update(browser, browserId, tabId, tabPropierties, webPage, timestamp) {
        // Check if browser exists
        if(!this.browsers[browser+browserId]) {
            this.browsers[browser+browserId] = new BrowserStatus(browser, browserId, timestamp);
        }

        return this.browsers[browser+browserId].update(tabId, tabPropierties, webPage, timestamp);
    }
    closeTab(browser, browserId, tabId, timestamp) {
        if(!this.browsers[browser+browserId]) {
            console.error("Browser " + browser + " " + browserId + " not found");
            return; //TODO algo millor
        }

        this.browsers[browser+browserId].closeTab(tabId, timestamp);
    }

    checkTabs(browser, browserId, tabsInfos, activeTab, timestamp){
        if(!this.browsers[browser+browserId]) {
            this.browsers[browser+browserId] = new BrowserStatus(browser, browserId, timestamp);
        }

        return this.browsers[browser+browserId].checkTabs(tabsInfos, activeTab, timestamp);
    }
}

class AllAlumnesStatus{
    constructor(onUpdateCallback = ()=>{}) {
        this.alumnesStat = {};
        this.pendingBrowserActions = {};
        this._onUpdateCallback = onUpdateCallback;
        this.lastPingUpdate = undefined;

        setInterval(() => {
            // Todo check if last ping update is too old
        }, 120000); // 2 minuts
    }

    registerCallback(onUpdateCallback) {
        this._onUpdateCallback = onUpdateCallback;
    }

    register(alumne, timestamp, host, protocol, search, pathname, title, browser, browserId, tabId, incognito, favicon, active, action) {

        const webPage = new WebPage(host, protocol, search, pathname, title, favicon);
        const tabPropierties = {
            incognito: incognito,
            actionStatus: action,
            active: active
        };

        // Check if alumne exists
        if(!this.alumnesStat[alumne]) {
            this.alumnesStat[alumne] = new AlumneStatus(alumne);
        }

        this.alumnesStat[alumne].register(browser, browserId, tabId, tabPropierties, webPage, timestamp);

        this._onUpdateCallback();
    }

    closeTab(alumne, tabId, browser, browserId, timestamp) {
        if(!this.alumnesStat[alumne]) {
            this.alumnesStat[alumne] = new AlumneStatus(alumne);
        }

        this.alumnesStat[alumne].closeTab(browser, browserId, tabId, timestamp);

        console.log("Alumne " + alumne + " close tab " + tabId + " on browser " + browser + " " + browserId);

        // Comprova si estava a la llista d'accions pendents. Si ho estava, l'esborra
        if(this.pendingBrowserActions[alumne] && this.pendingBrowserActions[alumne][browser+browserId]) {
            const index = this.pendingBrowserActions[alumne][browser+browserId].findIndex((action) => action.tabId === tabId);
            if(index !== -1) {
                this.pendingBrowserActions[alumne][browser+browserId].splice(index, 1);
                if(this.pendingBrowserActions[alumne][browser+browserId].length === 0) {
                    delete this.pendingBrowserActions[alumne][browser+browserId];
                }
            }
        }
        this._onUpdateCallback();

    }


    checkTabs(alumne, browser, browserId, tabsInfos, activeTab, timestamp) {
        if(!this.alumnesStat[alumne]) {
            this.alumnesStat[alumne] = new AlumneStatus(alumne);
        }

        const changes = this.alumnesStat[alumne].checkTabs(browser, browserId, tabsInfos, activeTab, timestamp);
        if(changes) this._onUpdateCallback();
    }

    update(alumne, timestamp, host, protocol, search, pathname, title, browser, browserId, tabId, incognito, favicon, active) {
        const webPage = new WebPage(host, protocol, search, pathname, title, favicon);
        const tabPropierties = {
            incognito: incognito,
            actionStatus: undefined,
            active: active
        };

        // Check if alumne exists
        if(!this.alumnesStat[alumne]) {
            this.alumnesStat[alumne] = new AlumneStatus(alumne);
        }

        const changes = this.alumnesStat[alumne].update(browser, browserId, tabId, tabPropierties, webPage, timestamp);
        if(changes) this._onUpdateCallback();
    }


}

const allAlumnesStatus = new AllAlumnesStatus();

function registerTabAction(action, alumne, timestamp, host, protocol, search, pathname, title, browser, browserId, tabId, incognito, favicon, active) {

    if (action === "close") {
        allAlumnesStatus.closeTab(alumne, tabId, browser, browserId, timestamp);
    }
    else if (action === "update" || action === "active") {
        allAlumnesStatus.update(alumne, timestamp, host, protocol, search, pathname, title, browser, browserId, tabId, incognito, favicon, active);
    }
}

function register(alumne, timestamp, host, protocol, search, pathname, title, browser, browserId, tabId, incognito, favicon, active, action) {
    allAlumnesStatus.register(alumne, timestamp, host, protocol, search, pathname, title, browser, browserId, tabId, incognito, favicon, active, action);
}


function registerBrowserInfo(alumne, browser, browserId, tabsInfos, activeTab, timestamp) {
    allAlumnesStatus.checkTabs(alumne, browser, browserId, tabsInfos, activeTab, timestamp);
    allAlumnesStatus.lastPingUpdate = timestamp;
}
function getAlumnesBrowsingActivity() {
    return allAlumnesStatus.alumnesStat;
}

function registerOnUpdateCallback(callback) {
    allAlumnesStatus.registerCallback(callback);
}

function remoteCloseTab(alumne, browser, browserId, tabId) {
    console.log("service remoteCloseTab", alumne, browser, browserId, tabId);
    const action = {action:'close', browser: browser, browserId: browserId, tabId: tabId};
    if(!allAlumnesStatus.pendingBrowserActions[alumne])
        allAlumnesStatus.pendingBrowserActions[alumne] = {};

    if(!allAlumnesStatus.pendingBrowserActions[alumne][browser+browserId])
        allAlumnesStatus.pendingBrowserActions[alumne][browser+browserId] = []

    allAlumnesStatus.pendingBrowserActions[alumne][browser+browserId].push(action)

}

function getBrowserPendingActions(alumne, browser, browserId) {
    if(!allAlumnesStatus.pendingBrowserActions[alumne]) return undefined;
    if(!allAlumnesStatus.pendingBrowserActions[alumne][browser+browserId]) return undefined;
    const pending = allAlumnesStatus.pendingBrowserActions[alumne][browser+browserId];
    delete allAlumnesStatus.pendingBrowserActions[alumne][browser+browserId];
    return pending;
}


module.exports = {
    register,
    registerTabAction,
    registerBrowserInfo,
    getAlumnesBrowsingActivity,
    registerOnUpdateCallback,
    remoteCloseTab,
    getBrowserPendingActions
}