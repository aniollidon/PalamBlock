const infoService = require("../services/infoService");
const historialService = require("../services/historialService");
const {
  WebPage,
  BrowserDetails,
  TabDetails,
} = require("../services/structures");
const { logger } = require("../logger");
const validacioService = require("../services/validacioService");
const { netejaText } = require("./utils");

const postTabInfoAPI = (req, res) => {
  //DEPRECATED
  try {
    const action = req.body.action;
    const host = req.body.host;
    const protocol = req.body.protocol;
    const search = req.body.search;
    const pathname = req.body.pathname;
    const title = req.body.title;
    const alumne = netejaText(req.body.alumne);
    const browser = netejaText(req.body.browser);
    const windowId = req.body.windowId;
    const tabId = req.body.tabId;
    const incognito = req.body.incognito;
    const favicon = req.body.favicon;
    const active = req.body.active;
    const audible = req.body.audible;
    const timestamp = new Date();

    if (!alumne || !browser || !tabId) {
      res.status(500).send({
        status: "ERROR",
        data: "Falten dades de la info. Cal especificar alumne, browser i tabId",
      });
      return;
    }

    if (action !== "active" && action !== "close" && action !== "update") {
      res.status(500).send({
        status: "ERROR",
        data: "Action incorrecte. Ha de ser active, close o update",
      });
      return;
    }

    const browserDetails = new BrowserDetails(alumne, browser, "1.0", "API");
    const tabDetails = new TabDetails(
      tabId,
      new WebPage(host, protocol, search, pathname, title, favicon),
      windowId,
      incognito,
      active,
      audible
    );

    if (action === "active" || action === "close" || action === "update") {
      infoService.registerTab(action, browserDetails, tabDetails, timestamp);
      if (action === "update") {
        historialService.saveWeb(browserDetails, tabDetails, timestamp);
      }
    }

    res.send({
      status: "OK",
      actions: infoService.getBrowserPendingActions(alumne, browser),
    });
  } catch (err) {
    logger.error(err);
    res.status(500).send({ status: "ERROR", data: "Error desconegut" });
  }
};

const postBrowserInfoAPI = (req, res) => {
  try {
    const alumne = netejaText(req.body.alumne);
    const browser = req.body.browser;
    const timestamp = new Date();
    const tabsInfos = req.body.tabsInfos;
    const activeTab = req.body.activeTab;

    if (!alumne || !browser || !tabsInfos || !activeTab) {
      res.status(500).send({
        status: "ERROR",
        data: "Falten dades de la info. Cal especificar alumne, browser, tabsInfos i activeTab",
      });
      return;
    }

    const browserDetails = new BrowserDetails(alumne, browser, "1.0", "API");
    const structuredTabsInfos = {};

    for (const tabId in tabsInfos) {
      const tab = tabsInfos[tabId];
      structuredTabsInfos[tabId] = new TabDetails(
        tab.tabId,
        new WebPage(
          tab.host,
          tab.protocol,
          tab.search,
          tab.pathname,
          tab.title,
          tab.favicon
        ),
        tab.windowId,
        tab.incognito,
        tab.active,
        tab.audible
      );
    }
    infoService.registerBrowser(
      browserDetails,
      structuredTabsInfos,
      activeTab,
      timestamp
    );

    res.send({
      status: "OK",
      actions: infoService.getBrowserPendingActions(alumne, browser),
    });
  } catch (err) {
    logger.error(err);
    res.status(500).send({ status: "ERROR", data: "Error desconegut" });
  }
};

const postMachineInfoAPI = (req, res) => {
  try {
    const alumne = netejaText(req.body.alumne);
    const timestamp = new Date();
    const currentIp = req.body.currentIp;

    if (!alumne || !currentIp) {
      res.status(500).send({
        status: "ERROR",
        data: "Falten dades de la info. Cal especificar alumne i currentIp",
      });
      return;
    }

    infoService.registerMachine(alumne, currentIp, timestamp);
  } catch (err) {
    logger.error(err);
    res.status(500).send({ status: "ERROR", data: "Error desconegut" });
  }
};

const postTabInfoWS = (sid, msg) => {
  try {
    const action = msg.action;
    const timestamp = new Date();

    const webPage = new WebPage(
      msg.host,
      msg.protocol,
      msg.search,
      msg.pathname,
      msg.title,
      msg.favicon
    );
    const browserDetails = new BrowserDetails(
      msg.alumne,
      msg.browser,
      msg.extVersion,
      sid
    );
    const tabDetails = new TabDetails(
      msg.tabId,
      webPage,
      msg.windowId,
      msg.incognito,
      msg.active,
      msg.audible
    );

    if (
      action !== "active" &&
      action !== "close" &&
      action !== "update" &&
      action !== "complete"
    ) {
      return;
    }

    if (action === "complete") {
      const validacioAlumne = new validacioService.Validacio(msg.alumne);
      const validacio = validacioAlumne.checkWeb(webPage);

      validacio
        .then((status) => {
          tabDetails.pbStatus = status;
          infoService.registerTab(
            "complete",
            browserDetails,
            tabDetails,
            timestamp
          );
          infoService.remoteSetTabStatus(
            browserDetails,
            tabDetails.tabId,
            status
          );
          historialService
            .saveWeb(browserDetails, tabDetails, timestamp)
            .catch((err) => {
              logger.error(err);
            });
        })
        .catch((err) => {
          logger.error(err);
        });
    } else {
      infoService.registerTab(action, browserDetails, tabDetails, timestamp);

      if (action === "update") {
        historialService.saveWeb(browserDetails, tabDetails, timestamp);
      }
    }
  } catch (err) {
    logger.error(err);
  }
};

const postBrowserInfoWS = async (sid, msg) => {
  try {
    const timestamp = new Date();
    const tabsInfos = msg.tabsInfos;
    const browserDetails = new BrowserDetails(
      msg.alumne,
      msg.browser,
      msg.extVersion,
      sid
    );
    const structuredTabsInfos = {};

    const validacioAlumne = new validacioService.Validacio(msg.alumne);

    for (const tabId in tabsInfos) {
      const tab = tabsInfos[tabId];
      const webPage = new WebPage(
        tab.host,
        tab.protocol,
        tab.search,
        tab.pathname,
        tab.title,
        tab.favicon
      );
      const status = await validacioAlumne.checkWeb(webPage);
      structuredTabsInfos[tabId] = new TabDetails(
        tab.tabId,
        webPage,
        tab.windowId,
        tab.incognito,
        tab.active,
        tab.audible,
        status
      );

      //infoService.remoteSetTabStatus(browserDetails, structuredTabsInfos[tabId].tabId, status);
    }
    infoService.registerBrowser(
      browserDetails,
      structuredTabsInfos,
      msg.activeTab,
      timestamp
    );
  } catch (err) {
    logger.error(err);
  }
};

const disconnectBrowserWS = (sid) => {
  try {
    const timestamp = new Date();
    infoService.unregisterBrowser(sid, timestamp);
  } catch (err) {
    logger.error(err);
  }
};

function getAlumnesActivity() {
  try {
    return infoService.getAlumnesActivity();
  } catch (err) {
    logger.error(err);
    return [];
  }
}

function getAlumnesMachine() {
  try {
    const machines = infoService.getAlumnesMachine();
    if (!machines) return {};
    else return machines;
  } catch (err) {
    logger.error(err);
    return {};
  }
}

function registerActivityOnUpdateCallback(callback) {
  try {
    if (!callback) return;
    infoService.registerActivityOnUpdateCallback(callback);
  } catch (err) {
    logger.error(err);
  }
}

function remoteCloseTab(alumne, browser, tab) {
  try {
    if (!alumne || !browser || !tab) return;
    alumne = netejaText(alumne);
    infoService.remoteCloseTab(alumne, browser, tab);
  } catch (err) {
    logger.error(err);
  }
}

function normesWebHasChanged() {
  //DEPRECATED
  try {
    infoService.normesWebHasChanged();
  } catch (err) {
    logger.error(err);
  }
}
function registerActionListenerBrowserWS(sid, msg, callback) {
  try {
    if (!callback) return;
    const browserDetails = new BrowserDetails(
      msg.alumne,
      msg.browser,
      msg.extVersion,
      sid
    );
    infoService.registerActionListener(browserDetails, callback);
  } catch (err) {
    logger.error(err);
  }
}

function sendMessageToAlumne(alumne, msg) {
  try {
    alumne = netejaText(alumne);
    infoService.sendMessageToAlumne(alumne, msg);
  } catch (err) {
    logger.error(err);
  }
}

function registerMachine(
  sid,
  version,
  os,
  ip,
  ssid,
  alumne,
  executionCallback,
  aliveCallback
) {
  try {
    const timestamp = new Date();
    alumne = netejaText(alumne);
    ip = netejaText(ip);
    ssid = netejaText(ssid);
    os = netejaText(os);
    version = netejaText(version);

    infoService.registerMachine(
      alumne,
      sid,
      ip,
      ssid,
      os,
      version,
      executionCallback,
      aliveCallback,
      timestamp
    );
  } catch (err) {
    logger.error(err);
  }
}

function unregisterMachine(sid) {
  try {
    const timestamp = new Date();
    infoService.unregisterMachine(sid, timestamp);
  } catch (err) {
    logger.error(err);
  }
}

function updateMachine(sid, ip, ssid, username) {
  try {
    const timestamp = new Date();
    username = netejaText(username);
    ip = netejaText(ip);
    ssid = netejaText(ssid);
    infoService.updateMachine(username, sid, ip, ssid, timestamp);
  } catch (err) {
    logger.error(err);
  }
}

function sessionChangeMachine(sid, userSession) {
  try {
    const timestamp = new Date();
    userSession = netejaText(userSession);
    infoService.sessionChangeMachine(userSession, sid, timestamp);
  } catch (err) {
    logger.error(err);
  }
}

function sendCommandToAlumne(alumne, command) {
  try {
    alumne = netejaText(alumne);
    command = netejaText(command);
    infoService.sendCommandToAlumne(alumne, command);
  } catch (err) {
    logger.error(err);
  }
}

function powerOffAll(grup) {
  try {
    infoService.powerOffAllGrup(grup);
  } catch (err) {
    logger.error(err);
  }
}

function sendDisplayCommand(roomTarget, command, excludeAlumnes = []) {
  try {
    roomTarget = netejaText(roomTarget);
    command = netejaText(command);
    infoService.sendDisplayCommand(roomTarget, command, excludeAlumnes);
  } catch (err) {
    logger.error(err);
  }
}

module.exports = {
  postTabInfoAPI,
  postBrowserInfoAPI,
  postMachineInfoAPI,
  postTabInfoWS,
  postBrowserInfoWS,
  getAlumnesActivity,
  registerActivityOnUpdateCallback,
  remoteCloseTab,
  normesWebHasChanged,
  disconnectBrowserWS,
  registerActionListenerBrowserWS,
  sendMessageToAlumne,
  sendCommandToAlumne,
  sendDisplayCommand,
  powerOffAll,
  registerMachine,
  unregisterMachine,
  updateMachine,
  sessionChangeMachine,
  getAlumnesMachine,
};
