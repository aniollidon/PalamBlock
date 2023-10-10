
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
    constructor(tabId, incognito, timestamp) {
        this.tabId = tabId;
        this.incognito = incognito;
        this.webPage = undefined;
        this.active = false;
        this.opened = true;
        this.startedAt = timestamp;
        this.updatedAt = timestamp;

    }

    update(webPage, timestamp) {
        this.webPage = webPage;
        this.updatedAt = timestamp;
        this.opened = true;
    }

    close(timestamp) {
        this.opened = false;
        this.updatedAt = timestamp;
    }

    setActive(timestamp) {
        this.active = true;
        this.opened = true;
        this.updatedAt = timestamp;
    }

    setInactive(timestamp) {
        this.active = false;
    }
}



class BrowserStatus {
    constructor(browser, browser_id, timestamp) {
        this.browser = browser;
        this.browser_id = browser_id;
        this.tabs = {};
        this.startedAt = timestamp;
        this.updatedAt = timestamp;
    }

    register(tab_id, incognito, webPage, timestamp){
        // Check if tab exists
        if(!this.tabs[tab_id]) {
            this.tabs[tab_id] = new TabStatus(tab_id, incognito, timestamp);
        }

        if(this.tabs[tab_id].incognito !== incognito) {
            console.error("Tab " + tab_id + " has changed incognito status from " + this.tabs[tab_id].incognito + " to " + incognito + " on browser " + this.browser + " " + this.browser_id);
        }

        this.setActiveTab(tab_id, timestamp);
        this.tabs[tab_id].update(webPage, timestamp);
        this.updatedAt = timestamp;
    }

    closeTab(tab_id, timestamp) {
        if(!this.tabs[tab_id]) {
            console.error("Tab " + tab_id + " not found");
            return; //TODO algo millor
        }

        this.tabs[tab_id].close(timestamp);
        this.updatedAt = timestamp;
    }

    setActiveTab(tab_id, timestamp) {

        // Desactivem tots els tabs
        for (const tab in this.tabs) {
            if (tab !== tab_id.toString()) {
                this.tabs[tab].setInactive(timestamp);
            }
        }

        // Comprovacions
        if(!this.tabs[tab_id]) {
            console.error("Tab " + tab_id + " not found");
            return;
        }

        // Activem
        this.tabs[tab_id].setActive(timestamp);
        this.updatedAt = timestamp;
    }

    checkTabs(tabsIds, activeTab, timestamp) {
        let changes = false;

        for (const tab in this.tabs) {
            if (!tabsIds.includes(parseInt(tab))) {
                this.tabs[tab].close(timestamp);
                changes = true;
            }
            // todo: que passa amb els nous tabs?
        }

        if(!this.tabs[activeTab] || !this.tabs[activeTab].active) {
            this.setActiveTab(activeTab, timestamp);
            changes = true;
        }

        return changes;
    }

}

class AlumneStatus {
    constructor(alumne) {
        this.alumne = alumne;
        this.browsers = {};
    }

    register(browser, browser_id, tab_id, incognito, webPage, timestamp) {
        // Check if browser exists
        if(!this.browsers[browser+browser_id]) {
            this.browsers[browser+browser_id] = new BrowserStatus(browser, browser_id, timestamp);
        }

        this.browsers[browser+browser_id].register(tab_id, incognito, webPage, timestamp);
    }

    closeTab(browser, browser_id, tab_id, timestamp) {
        if(!this.browsers[browser+browser_id]) {
            console.error("Browser " + browser + " " + browser_id + " not found");
            return; //TODO algo millor
        }

        this.browsers[browser+browser_id].closeTab(tab_id, timestamp);
    }

    setActiveTab(browser, browser_id, tab_id, timestamp) {
        if(!this.browsers[browser+browser_id]) {
            console.error("Browser " + browser + " " + browser_id + " not found");
            return; //TODO algo millor
        }

        this.browsers[browser+browser_id].setActiveTab(tab_id, timestamp);
    }

    checkTabs(tabsIds, activeTab, browser, browser_id, timestamp){
        if(!this.browsers[browser+browser_id]) {
            console.error("Browser " + browser + " " + browser_id + " not found");
            return; //TODO algo millor
        }

        return this.browsers[browser+browser_id].checkTabs(tabsIds, activeTab, timestamp);
    }
}

class AllAlumnesStatus{
    constructor(onUpdateCallback = ()=>{}) {
        this.alumnesStat = {};
        this._onUpdateCallback = onUpdateCallback;
        this.lastPingUpdate = undefined;

        setInterval(() => {
            // Todo check if last ping update is too old
        }, 120000); // 2 minuts
    }

    registerCallback(onUpdateCallback) {
        this._onUpdateCallback = onUpdateCallback;
    }

    register(alumne, timestamp, host, protocol, search, pathname, title, browser, browser_id, tab_id, incognito, favicon) {

        const webPage = new WebPage(host, protocol, search, pathname, title, favicon);

        // Check if alumne exists
        if(!this.alumnesStat[alumne]) {
            this.alumnesStat[alumne] = new AlumneStatus(alumne);
        }

        this.alumnesStat[alumne].register(browser, browser_id, tab_id, incognito, webPage, timestamp);

        this._onUpdateCallback();
    }

    closeTab(alumne, tabId, browser, browser_id, timestamp) {
        if(!this.alumnesStat[alumne]) {
            console.error("Alumne " + alumne + " not found");
            return; //TODO algo millor
        }

        this.alumnesStat[alumne].closeTab(browser, browser_id, tabId, timestamp);

        console.log("Alumne " + alumne + " close tab " + tabId + " on browser " + browser + " " + browser_id);

        this._onUpdateCallback();

    }

    setActiveTab(alumne, tabId, browser, browser_id, timestamp) {
        if(!this.alumnesStat[alumne]) {
            console.error("Alumne " + alumne + " not found");
            return; //TODO algo millor
        }

        this.alumnesStat[alumne].setActiveTab(browser, browser_id, tabId, timestamp);

        console.log("Alumne " + alumne + " active tab " + tabId + " on browser " + browser + " " + browser_id);
        this._onUpdateCallback();
    }

    checkTabs(alumne, tabsIds, activeTab, browser, browser_id, timestamp) {
        if(!this.alumnesStat[alumne]) {
            console.error("Alumne " + alumne + " not found");
            return; //TODO algo millor
        }

        const changes = this.alumnesStat[alumne].checkTabs(tabsIds, activeTab, browser, browser_id, timestamp);
        if(changes) this._onUpdateCallback();
    }
}

const allAlumnesStatus = new AllAlumnesStatus();

function registerAction(alumne, action, tabId, browser, browser_id, timestamp) {

    if (action === "close") {
        allAlumnesStatus.closeTab(alumne, tabId, browser, browser_id, timestamp);
    }
    else if (action === "active") {
        allAlumnesStatus.setActiveTab(alumne, tabId, browser, browser_id, timestamp);
    }
}

function register(alumne, timestamp, host, protocol, search, pathname, title, browser, browser_id, tab_id, incognito, favicon) {
    allAlumnesStatus.register(alumne, timestamp, host, protocol, search, pathname, title, browser, browser_id, tab_id, incognito, favicon);
}


function registerPing(alumne, tabsIds, activeTab, browser, browser_id, timestamp) {
    allAlumnesStatus.checkTabs(alumne, tabsIds, activeTab, browser, browser_id, timestamp);
    allAlumnesStatus.lastPingUpdate = timestamp;
}
function getAlumnesBrowsingActivity() {
    return allAlumnesStatus.alumnesStat;
}

function registerOnUpdateCallback(callback) {
    allAlumnesStatus.registerCallback(callback);
}

function remoteCloseTab(alumne, browser, browserId, tab) {
    // TODO. Enviar un missatge al alumne per tancar la tab
}

module.exports = {
    register,
    registerAction,
    registerPing,
    getAlumnesBrowsingActivity,
    registerOnUpdateCallback,
    remoteCloseTab
}