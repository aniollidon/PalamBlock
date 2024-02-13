class WebPage {
    constructor(host, protocol, search, pathname, title, favicon) {
        this.host = host;
        this.protocol = protocol;
        this.search = search;
        this.pathname = pathname;
        this.title = title;
        this.favicon = favicon;
    }

    from(other) {
        this.host = other.host;
        this.protocol = other.protocol;
        this.search = other.search;
        this.pathname = other.pathname;
        this.title = other.title;
        this.favicon = other.favicon;
    }

    join() {
        return this.protocol + "//" + this.host + this.pathname + this.search;
    }

    update(newWebPage) {
        let changed = false;
        if(this.host !== newWebPage.host) {
            this.host = newWebPage.host;
            changed = true;
        }
        if(this.protocol !== newWebPage.protocol) {
            this.protocol = newWebPage.protocol;
            changed = true;
        }
        if(this.search !== newWebPage.search) {
            this.search = newWebPage.search;
            changed = true;
        }
        if(this.pathname !== newWebPage.pathname) {
            this.pathname = newWebPage.pathname;
            changed = true;
        }
        if(this.title !== newWebPage.title) {
            this.title = newWebPage.title;
            changed = true;
        }
        if(this.favicon !== newWebPage.favicon) {
            this.favicon = newWebPage.favicon;
            changed = true;
        }
        return changed;
    }

    toString() {
        return "url: " + this.join() + " title: " + this.title + " favicon: " + this.favicon;
    }
}

class BroserDetails {
    constructor(owner, browser, extVersion, id) {
        this.owner = owner;
        this.browser = browser;
        this.extVersion = extVersion;
        this.id = id;
    }

    from(other) {
        this.owner = other.owner;
        this.browser = other.browser;
        this.extVersion = other.extVersion;
        this.id = other.id;
    }

    toString() {
        return "owner: " + this.owner + " browser: " + this.browser + " v: " + this.extVersion + " id: " + this.id;
    }
}

class TabDetails{
    constructor(tabId, webPage, windowId, incognito, active, audible, pbStatus= undefined) {
        this.tabId = tabId;
        this.webPage = webPage ? webPage : new WebPage();
        this.windowId = windowId;
        this.incognito = incognito;
        this.active = active;
        this.audible = audible;
        this.pbStatus = pbStatus;
    }

    from(other) {
        this.tabId = other.tabId;
        this.webPage.from(other.webPage);
        this.windowId = other.windowId;
        this.incognito = other.incognito;
        this.active = other.active;
        this.audible = other.audible;
        this.pbStatus = other.pbStatus;
    }

    update(newTabDetails) {
        let changed = false;
        if(this.tabId !== newTabDetails.tabId) {
            this.tabId = newTabDetails.tabId;
            changed = true;
        }
        if(this.windowId !== newTabDetails.windowId) {
            this.windowId = newTabDetails.windowId;
            changed = true;
        }
        if(this.incognito !== newTabDetails.incognito) {
            this.incognito = newTabDetails.incognito;
            changed = true;
        }
        if(this.active !== newTabDetails.active) {
            this.active = newTabDetails.active;
            changed = true;
        }
        if(this.audible !== newTabDetails.audible) {
            this.audible = newTabDetails.audible;
            changed = true;
        }
        if(this.pbStatus !== newTabDetails.pbStatus) {
            this.pbStatus = newTabDetails.pbStatus;
            changed = true;
        }
        changed = this.webPage.update(newTabDetails.webPage) || changed;
        return changed;
    }

    toString() {
        return "tabId: " + this.tabId + " " + this.webPage.toString() + " windowId: " + this.windowId + " incognito: " +
            this.incognito + " active: " + this.active + " audible: " + this.audible + " pbStatus: " + this.pbStatus;
    }
}

module.exports = {
    WebPage,
    BrowserDetails: BroserDetails,
    TabDetails
}
