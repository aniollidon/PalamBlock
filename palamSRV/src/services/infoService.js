const validacioService = require("./validacioService");
require("dotenv").config();
const alumneService = require("./alumneService");
const logger = require("../logger").logger;
const { BrowserDetails, TabDetails } = require("./structures");
const { estructuraPublica } = require("./utils");

class TabStatus extends TabDetails {
  constructor(details, timestamp) {
    super();
    super.from(details);

    this.tabId = this.tabId.toString();
    this.opened = true;
    this.startedAt = timestamp;
    this.updatedAt = timestamp;
  }

  update(tabDetails, timestamp) {
    let changed = super.update(tabDetails);
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

class BrowserStatus extends BrowserDetails {
  constructor(details, timestamp, onUpdateCallback = () => {}) {
    super();
    super.from(details);

    this.tabs = {};
    this.startedAt = timestamp;
    this.updatedAt = timestamp;
    this._passiveupdatedAt = timestamp; // (v1.0) used to check if the browser is disconnected
    this._onUpdateCallback = onUpdateCallback;
    this._onActionCallback = () => {};
    this._checkInterval = undefined; // (v1.0) used to check if the browser is disconnected
    this.opened = true;

    if (this.extVersion === "1.0") {
      // Legacy support version 1.0
      // Comprova si el browser s'ha desconnectat
      const NOCONN_TIME = parseInt(process.env.NOCONNECTION_TIME || 60000);
      this._checkInterval = setInterval(() => {
        if (
          this.opened &&
          this._passiveupdatedAt &&
          new Date() - this._passiveupdatedAt > NOCONN_TIME
        ) {
          this.close(new Date());
        }
      }, NOCONN_TIME);
    }
  }

  updateDetails(details) {
    const prevVersion = this.extVersion;
    super.from(details);

    if (prevVersion !== this.extVersion && this.extVersion !== "1.0") {
      clearInterval(this._checkInterval);
    }
  }

  close(timestamp, silent = false) {
    for (const tab in this.tabs) {
      this.tabs[tab].close(timestamp);
    }
    this.opened = false;
    this.updatedAt = timestamp;
    if (!silent) this._onUpdateCallback("browsers");
  }

  setAlive(timestamp) {
    this._passiveupdatedAt = timestamp;
    this.opened = true;
  }

  registerOnUpdateCallback(onUpdateCallback) {
    this._onUpdateCallback = onUpdateCallback;
  }

  registerActionCallback(actionCallback) {
    this._onActionCallback = actionCallback;
  }

  update(tabDetails, timestamp) {
    this.setAlive(timestamp);
    let changes = false;
    const tabId = tabDetails.tabId.toString();

    // Check if tab exists
    if (!this.tabs[tabId]) {
      this.tabs[tabId] = new TabStatus(tabDetails, timestamp);
      changes = true;
    } else {
      changes = this.tabs[tabId].update(tabDetails, timestamp);
    }

    if (tabDetails.active) {
      // TODO: Comprovar si això és necessari
      changes = this.setActiveTab(tabId, timestamp) || changes;
    }

    this.updatedAt = timestamp;
    return changes;
  }

  closeTab(tabId, timestamp) {
    this.setAlive(timestamp);
    tabId = tabId.toString();

    if (!this.tabs[tabId]) {
      logger.error("on closeTab - tab " + tabId + " not found");
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
      if (tab !== tabId.toString())
        changes = this.tabs[tab].setInactive(timestamp) || changes;
      else changes = this.tabs[tab].setActive(timestamp) || changes;
    }

    // Comprovacions
    if (!this.tabs[tabId]) {
      logger.error("on setActiveTab - tab " + tabId + " not found");
      return changes;
    }

    changes = this.tabs[tabId].setActive(timestamp) || changes;
    this.updatedAt = timestamp;
    return changes;
  }

  updateTabs(tabsInfos, activeTab, timestamp) {
    if (!tabsInfos) return false;
    if (!activeTab) return false;

    this.setAlive(timestamp);

    let changes = false;
    activeTab = activeTab.toString();

    for (const tab in this.tabs) {
      // Repassa els tabs existents
      if (!Object.keys(tabsInfos).includes(tab)) {
        // Els tabs tancats
        this.tabs[tab].close(timestamp);
        changes = true;
      } else {
        // Els tabs oberts
        changes = this.tabs[tab].update(tabsInfos[tab], timestamp);
      }
    }

    for (const tab in tabsInfos) {
      if (!Object.keys(this.tabs).includes(tab)) {
        // Repassa els tabs nous
        this.tabs[tab.toString()] = new TabStatus(tabsInfos[tab], timestamp);
        changes = true;
      }
    }

    changes = this.setActiveTab(activeTab, timestamp) || changes;

    return changes;
  }

  remoteAction(action, tabId, message = undefined) {
    this._onActionCallback(action, tabId, message);
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
    this.iconB64 = app.iconType === "base64" ? app.icon : undefined;
    this.iconSVG = app.iconType === "svg" ? app.icon : undefined;
    this.onTaskBar = app.onTaskBar;
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

class MachineStatus {
  constructor(
    ip,
    wifi_ssid,
    os,
    version,
    executionCallback,
    aliveCallback,
    timestamp,
    onUpdateCallback = () => {}
  ) {
    this.ip = ip;
    this.os = os;
    this.version = version;
    this.wifi_ssid = wifi_ssid;
    this.lastUpdate = timestamp;
    this.connected = true;
    this.session = "undefined";
    this._execute = executionCallback;
    this._isAlive = aliveCallback;
    this._onUpdateCallback = onUpdateCallback;

    // Comprova si la màquina s'ha desconnectat
    const NOCONN_TIME = parseInt(process.env.NOCONNECTION_TIME || 60000);
    setInterval(() => {
      if (
        this.connected &&
        this.lastUpdate &&
        new Date() - this.lastUpdate > NOCONN_TIME
      ) {
        this.__checkAlive();
      }
    }, NOCONN_TIME);
  }

  __checkAlive() {
    if (this._isAlive()) {
      this.lastUpdate = new Date();
      return true;
    } else {
      this.connected = false;
      this.lastUpdate = new Date();
      logger.trace("Machine " + this.ip + " autodisconnected");
      this._onUpdateCallback("machines");
      return false;
    }
  }

  execute(command) {
    if (this.connected && this.__checkAlive()) {
      // Comprova si està connectada ara mateix
      try {
        logger.trace("Executing command " + command + " on machine " + this.ip);
        this._execute(command);
        return true;
      } catch (err) {
        logger.error(
          "Error executing command " + command + " on machine " + this.ip,
          err
        );
        return false;
      }
    } else {
      logger.error(
        "Error executing command " +
          command +
          ". Machine " +
          this.ip +
          " is not connected"
      );
      return false;
    }
  }

  updateSession(userSession) {
    this.session = userSession;
    this.lastUpdate = new Date();
    this._onUpdateCallback("machines");
  }
}

class AlumneStatus {
  constructor(alumne, onUpdateCallback = () => {}) {
    this.alumne = alumne;
    this.browsers = {};
    this.apps = {};
    this.conected = true;
    this.machines = {};
    this._onUpdateCallback = onUpdateCallback;
    this._garbageInterval = undefined;
    this._lastNews = new Date();

    // Comprova si l'alumne s'ha desconnectat
    const NOCONN_TIME = parseInt(process.env.NOCONNECTION_TIME || 60000);
    setInterval(() => {
      if (
        this.conected &&
        this._lastNews &&
        new Date() - this._lastNews > NOCONN_TIME
      ) {
        //logger.info("Alumne " + this.alumne + " disconnected");
        for (const app in this.apps) {
          this.apps[app].close();
        }
        this.conected = false;
        this._onUpdateCallback("browsers,apps,machines");
      }
    }, NOCONN_TIME);

    // Neteja Browsers antics
    this._garbageInterval = setInterval(() => {
      for (const browser in this.browsers) {
        if (
          !this.browsers[browser].opened &&
          this.browsers[browser].updatedAt >
            new Date() - process.env.GARBAGE_COLLECTOR_TIME
        ) {
          logger.trace(
            "[GARBAGE COLLECTOR] Browser " + browser + " deleted from " + alumne
          );
          delete this.browsers[browser];
        }
      }
    }, process.env.GARBAGE_COLLECTOR_TIME);
  }

  setAlive(timestamp) {
    this._lastNews = timestamp;
    this.conected = true;
  }

  registerApp(appinfo, status, timestamp) {
    this.setAlive(timestamp);
    if (!this.apps[appinfo.pid])
      this.apps[appinfo.pid] = new AppStatus(appinfo, status, timestamp);
    else this.apps[appinfo.pid].update(status, timestamp);
  }

  registerMachine(
    sid,
    ip,
    ssid,
    os,
    version,
    executionCallback,
    aliveCallback,
    timestamp
  ) {
    this.setAlive(timestamp);

    // Si hi ha una maquina amb la mateixa ip, la borra i la substitueix
    for (const machine in this.machines) {
      if (this.machines[machine].ip === ip) {
        delete this.machines[machine];
        logger.debug("Machine " + machine + " with ip " + ip + " deleted");
      }
    }

    this.machines[sid] = new MachineStatus(
      ip,
      ssid,
      os,
      version,
      executionCallback,
      aliveCallback,
      timestamp,
      this._onUpdateCallback
    );

    this._onlyOneOrAlive();
    this._onUpdateCallback("machines");
  }

  unregisterMachine(sid, timestamp) {
    if (this.machines[sid]) {
      this.machines[sid].connected = false;
      this.machines[sid].lastUpdate = timestamp;
    }

    this._onlyOneOrAlive();
    this._onUpdateCallback("machines");
  }

  _onlyOneOrAlive() {
    // Esborra les màquines que no estan connectades, excepte si només en queda una
    let connected = 0;
    let mostRecentUnconnected = undefined;
    let mostRecentUnconnectedDate = new Date(0);
    for (const machine in this.machines) {
      if (this.machines[machine].connected) {
        connected++;
      } else {
        if (this.machines[machine].lastUpdate > mostRecentUnconnectedDate) {
          mostRecentUnconnected = machine;
          mostRecentUnconnectedDate = this.machines[machine].lastUpdate;
        }
      }
    }

    if (connected === 0 && mostRecentUnconnected) {
      // Borra totes excepte
      for (const machine in this.machines) {
        if (machine !== mostRecentUnconnected) {
          delete this.machines[machine];
          logger.trace("Machine " + machine + " deleted");
        }
      }
    } else if (connected > 1) {
      // Borra totes les desconnectades
      for (const machine in this.machines) {
        if (!machine.connected) {
          delete this.machines[machine];
          logger.trace("Machine " + machine + " deleted");
        }
      }
    }
  }

  updateMachine(sid, ip, ssid, timestamp) {
    this.setAlive(timestamp);
    if (!this.machines[sid]) {
      this.machines[sid] = new MachineStatus(
        ip,
        ssid,
        "unknown",
        "unknown",
        timestamp,
        this._onUpdateCallback
      );
    }

    this.machines[sid].ip = ip;
    this.machines[sid].wifi_ssid = ssid;
    this.machines[sid].lastUpdate = timestamp;
    this._onUpdateCallback("machines");
  }

  closeNotUpdatedApps(timestamp) {
    this.setAlive(timestamp);
    for (const app in this.apps) {
      if (this.apps[app].updatedAt !== timestamp) this.apps[app].close();
    }
  }

  updateBrowser(browserDetails, tabDetails, timestamp) {
    this.setAlive(timestamp);

    // Check if browser exists
    if (!this.browsers[browserDetails.browser]) {
      this.browsers[browserDetails.browser] = new BrowserStatus(
        browserDetails,
        timestamp,
        this._onUpdateCallback
      );
    }

    return this.browsers[browserDetails.browser].update(tabDetails, timestamp);
  }

  closeTab(browser, tabId, timestamp) {
    this.setAlive(timestamp);
    if (!this.browsers[browser]) {
      logger.error("Browser " + browser + " not found");
      return; //TODO algo millor
    }

    this.browsers[browser].closeTab(tabId, timestamp);
  }

  updateTabs(browserDetails, tabsInfos, activeTab, timestamp) {
    this.setAlive(timestamp);

    if (!this.browsers[browserDetails.browser]) {
      this.browsers[browserDetails.browser] = new BrowserStatus(
        browserDetails,
        timestamp,
        this._onUpdateCallback
      );
    }

    return this.browsers[browserDetails.browser].updateTabs(
      tabsInfos,
      activeTab,
      timestamp
    );
  }

  registerActivityOnUpdateCallback(callback) {
    this._onUpdateCallback = callback;
    for (const browser in this.browsers) {
      this.browsers[browser].registerOnUpdateCallback(callback);
    }
  }

  registerActionCallback(browserDetails, callback) {
    if (!this.browsers[browserDetails.browser]) {
      this.browsers[browserDetails.browser] = new BrowserStatus(
        browserDetails,
        new Date(),
        this._onUpdateCallback
      );
    }

    this.browsers[browserDetails.browser].registerActionCallback(callback);
  }
}

class AllAlumnesStatus {
  constructor(_onUpdateCallback = () => {}) {
    this.alumnesStat = {};
    this.pendingBrowserActions = {};
    this._onSavePending = false;
    this._onUpdateCallback = _onUpdateCallback;
  }

  updateBrowserDetails(browserDetails) {
    if (!this.alumnesStat[browserDetails.owner]) {
      this.alumnesStat[browserDetails.owner] = new AlumneStatus(
        browserDetails.owner,
        this._onUpdateCallback
      );
    } else {
      if (
        !this.alumnesStat[browserDetails.owner].browsers[browserDetails.browser]
      )
        this.alumnesStat[browserDetails.owner].browsers[
          browserDetails.browser
        ] = new BrowserStatus(
          browserDetails,
          new Date(),
          this._onUpdateCallback
        );
      else
        this.alumnesStat[browserDetails.owner].browsers[
          browserDetails.browser
        ].updateDetails(browserDetails);
    }
  }

  updateActionCallback(browserDetails, callback) {
    if (!this.alumnesStat[browserDetails.owner]) {
      this.alumnesStat[browserDetails.owner] = new AlumneStatus(
        browserDetails.owner,
        this._onUpdateCallback
      );
    }

    this.alumnesStat[browserDetails.owner].registerActionCallback(
      browserDetails,
      callback
    );
  }

  registerActivityOnUpdateCallback(onUpdateCallback) {
    this._onUpdateCallback = onUpdateCallback;
    for (const alumne in this.alumnesStat) {
      if (!this.alumnesStat[alumne]) continue; // Això no hauria de caldre
      this.alumnesStat[alumne].registerActivityOnUpdateCallback(
        onUpdateCallback
      );
    }
  }

  registerApp(appinfo, alumne, status, timestamp) {
    if (!this.alumnesStat[alumne]) {
      this.alumnesStat[alumne] = new AlumneStatus(
        alumne,
        this._onUpdateCallback
      );
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
      this.alumnesStat[alumne] = new AlumneStatus(
        alumne,
        this._onUpdateCallback
      );
    }

    this.alumnesStat[alumne].closeTab(browser, tabId, timestamp);

    //logger.info("Alumne " + alumne + " close tab " + tabId + " on browser " + browser);

    // Comprova si estava a la llista d'accions pendents. Si ho estava, l'esborra
    if (
      this.pendingBrowserActions[alumne] &&
      this.pendingBrowserActions[alumne][browser]
    ) {
      const index = this.pendingBrowserActions[alumne][browser].findIndex(
        (action) => action.tabId === tabId
      );
      if (index !== -1) {
        this.pendingBrowserActions[alumne][browser].splice(index, 1);
        if (this.pendingBrowserActions[alumne][browser].length === 0) {
          delete this.pendingBrowserActions[alumne][browser];
        }
      }
    }
    this._onUpdateCallback("browsers");
  }

  updateTabs(browserDetails, tabsInfos, activeTab, timestamp) {
    if (!this.alumnesStat[browserDetails.owner]) {
      this.alumnesStat[browserDetails.owner] = new AlumneStatus(
        browserDetails.owner,
        this._onUpdateCallback
      );
    }

    const changes = this.alumnesStat[browserDetails.owner].updateTabs(
      browserDetails,
      tabsInfos,
      activeTab,
      timestamp
    );
    if (changes) this._onUpdateCallback("browsers");
  }

  updateBrowser(browserDetails, tabDetails, timestamp) {
    // Check if alumne exists
    if (!this.alumnesStat[browserDetails.owner]) {
      this.alumnesStat[browserDetails.owner] = new AlumneStatus(
        browserDetails.owner,
        this._onUpdateCallback
      );
    }

    const changes = this.alumnesStat[browserDetails.owner].updateBrowser(
      browserDetails,
      tabDetails,
      timestamp
    );
    if (changes) this._onUpdateCallback("browsers");
  }
}

const allAlumnesStatus = new AllAlumnesStatus();

function registerTab(action, browserDetails, tabDetails, timestamp) {
  if (action === "close") {
    allAlumnesStatus.closeTab(
      browserDetails.owner,
      tabDetails.tabId,
      browserDetails.browser,
      timestamp
    );
  } else if (
    action === "complete" ||
    action === "update" ||
    action === "active"
  ) {
    allAlumnesStatus.updateBrowser(browserDetails, tabDetails, timestamp);
  }
}

function registerBrowser(browserDetails, tabsInfos, activeTab, timestamp) {
  allAlumnesStatus.updateTabs(browserDetails, tabsInfos, activeTab, timestamp);
}

async function getAlumnesActivity() {
  // Get alumnes status on db
  for (const alumne in allAlumnesStatus.alumnesStat) {
    try {
      allAlumnesStatus.alumnesStat[alumne].status =
        await alumneService.getAlumneStatus(alumne);
    } catch (err) {
      logger.error(
        "Error getting alumne=" + alumne + " status. Esborrant alumne",
        err
      );
      allAlumnesStatus.alumnesStat[alumne] = undefined; // Esborra l'alumne
    }
  }
  return estructuraPublica(allAlumnesStatus.alumnesStat);
}

function registerActivityOnUpdateCallback(callback) {
  if (!callback) return;
  allAlumnesStatus.registerActivityOnUpdateCallback(callback);
}

function remoteCloseTab(alumne, browser, tabId) {
  // TODO: Métode legacy v1.0

  // Si la versió és 1.0 afegeix l'acció a la llista d'accions pendents
  if (
    allAlumnesStatus.alumnesStat[alumne].browsers[browser].extVersion === "1.0"
  ) {
    const action = { action: "close", browser: browser, tabId: tabId };
    if (!allAlumnesStatus.pendingBrowserActions[alumne])
      allAlumnesStatus.pendingBrowserActions[alumne] = {};

    if (!allAlumnesStatus.pendingBrowserActions[alumne][browser])
      allAlumnesStatus.pendingBrowserActions[alumne][browser] = [];

    allAlumnesStatus.pendingBrowserActions[alumne][browser].push(action);
  } else {
    if (allAlumnesStatus.alumnesStat[alumne].browsers[browser])
      allAlumnesStatus.alumnesStat[alumne].browsers[browser].remoteAction(
        "close",
        tabId
      );
    else {
      logger.error(
        "Remote close for tab " +
          tabId +
          " but browser " +
          browser +
          " not found"
      );
    }
  }
}

function getBrowserPendingActions(alumne, browser) {
  if (!allAlumnesStatus.pendingBrowserActions[alumne]) return undefined;
  if (!allAlumnesStatus.pendingBrowserActions[alumne][browser])
    return undefined;
  const pending = allAlumnesStatus.pendingBrowserActions[alumne][browser];

  if (!allAlumnesStatus._onSavePending)
    delete allAlumnesStatus.pendingBrowserActions[alumne][browser];

  return pending;
}

async function normesWebHasChanged() {
  for (const alumne in allAlumnesStatus.alumnesStat) {
    const validacio = new validacioService.Validacio(alumne);
    for (const browser in allAlumnesStatus.alumnesStat[alumne].browsers) {
      for (const tab in allAlumnesStatus.alumnesStat[alumne].browsers[browser]
        .tabs) {
        const webPage =
          allAlumnesStatus.alumnesStat[alumne].browsers[browser].tabs[tab]
            .webPage;
        const permition = await validacio.checkWeb(webPage);

        if (permition !== "allow") {
          if (
            allAlumnesStatus.alumnesStat[alumne].browsers[browser]
              .extVersion === "1.0"
          ) {
            const action = { action: "refresh", tabId: tab };
            allAlumnesStatus._onSavePending = true;
            if (!allAlumnesStatus.pendingBrowserActions[alumne])
              allAlumnesStatus.pendingBrowserActions[alumne] = {};
            if (!allAlumnesStatus.pendingBrowserActions[alumne][browser])
              allAlumnesStatus.pendingBrowserActions[alumne][browser] = [];
            allAlumnesStatus.pendingBrowserActions[alumne][browser].push(
              action
            );
            allAlumnesStatus._onSavePending = false;
          } else {
            allAlumnesStatus.alumnesStat[alumne].browsers[browser].remoteAction(
              permition,
              tab
            );
          }
        }
      }
    }
  }
}

function registerApps(apps, alumne, status, timestamp) {
  // DEPRECATED
  for (const appinfo of apps) {
    allAlumnesStatus.registerApp(
      appinfo,
      alumne,
      status[appinfo.name],
      timestamp
    );
  }
  allAlumnesStatus.closeNotUpdatedApps(alumne, timestamp);
  allAlumnesStatus._onUpdateCallback("apps");
}

function registerMachine(
  alumne,
  sid,
  ip,
  ssid,
  os,
  version,
  executionCallback,
  aliveCallback,
  timestamp
) {
  if (!allAlumnesStatus.alumnesStat[alumne]) {
    allAlumnesStatus.alumnesStat[alumne] = new AlumneStatus(
      alumne,
      allAlumnesStatus._onUpdateCallback
    );
  }

  allAlumnesStatus.alumnesStat[alumne].setAlive(timestamp);
  allAlumnesStatus.alumnesStat[alumne].registerMachine(
    sid,
    ip,
    ssid,
    os,
    version,
    executionCallback,
    aliveCallback,
    timestamp
  );

  logger.debug(
    "Machine " +
      os +
      " " +
      sid +
      " from " +
      alumne +
      " registered on ip " +
      ip +
      " with ssid " +
      ssid
  );
}

function unregisterMachine(sid, timestamp) {
  // Busca l'alumne que té aquest sid
  for (const alumne in allAlumnesStatus.alumnesStat) {
    if (allAlumnesStatus.alumnesStat[alumne].machines[sid]) {
      allAlumnesStatus.alumnesStat[alumne].unregisterMachine(sid, timestamp);
      logger.debug("Machine " + sid + " from " + alumne + " unregistered");
    }
  }
}

function updateMachine(sid, ip, ssid, alumne, timestamp) {
  if (allAlumnesStatus.alumnesStat[alumne]) {
    allAlumnesStatus.alumnesStat[alumne].updateMachine(
      sid,
      ip,
      ssid,
      timestamp
    );
    logger.debug("Machine " + sid + " from " + alumne + " updated");
  }
}

function sessionChangeMachine(sid, userSession) {
  for (const alumne in allAlumnesStatus.alumnesStat) {
    if (allAlumnesStatus.alumnesStat[alumne].machines[sid]) {
      allAlumnesStatus.alumnesStat[alumne].machines[sid].updateSession(
        userSession
      );
      logger.debug(
        "Machine " +
          sid +
          " from " +
          alumne +
          " changed session to " +
          userSession
      );
    }
  }
}

function unregisterBrowser(sid, timestamp) {
  for (const alumne in allAlumnesStatus.alumnesStat) {
    for (const browser in allAlumnesStatus.alumnesStat[alumne].browsers) {
      if (allAlumnesStatus.alumnesStat[alumne].browsers[browser].id === sid) {
        allAlumnesStatus.alumnesStat[alumne].browsers[browser].close(timestamp);
        logger.debug("Browser " + browser + " from " + alumne + " closed");
      }
    }
  }
}

function registerActionListener(browserDetails, callback) {
  if (!callback) return;

  // Update browserDetails
  allAlumnesStatus.updateBrowserDetails(browserDetails);
  allAlumnesStatus.updateActionCallback(browserDetails, callback);
}

function remoteSetTabStatus(browserDetails, tabId, status) {
  if (
    allAlumnesStatus.alumnesStat[browserDetails.owner] &&
    allAlumnesStatus.alumnesStat[browserDetails.owner].browsers[
      browserDetails.browser
    ]
  )
    allAlumnesStatus.alumnesStat[browserDetails.owner].browsers[
      browserDetails.browser
    ].remoteAction(status, tabId);
  else {
    logger.error(
      "Remote set status for tab " +
        tabId +
        " but browser " +
        browserDetails.browser +
        " not found"
    );
  }
}

function sendMessageToAlumne(alumne, message) {
  if (!allAlumnesStatus.alumnesStat[alumne]) return;
  for (const browser in allAlumnesStatus.alumnesStat[alumne].browsers) {
    if (
      parseInt(
        allAlumnesStatus.alumnesStat[alumne].browsers[browser].extVersion
      ) >= 1
    )
      for (const tab in allAlumnesStatus.alumnesStat[alumne].browsers[browser]
        .tabs) {
        if (
          allAlumnesStatus.alumnesStat[alumne].browsers[browser].tabs[tab]
            .active
        )
          allAlumnesStatus.alumnesStat[alumne].browsers[browser].remoteAction(
            "message",
            tab,
            message
          );
      }
  }
}
function sendCommandToAlumne(alumne, command) {
  if (!allAlumnesStatus.alumnesStat[alumne]) return;
  for (const machines in allAlumnesStatus.alumnesStat[alumne].machines) {
    allAlumnesStatus.alumnesStat[alumne].machines[machines].execute(command);
  }
}

function powerOffAllGrup(grup) {
  // TODO: Implementar
}

function sendCommandToGrup(grup, command) {
  // Busca tots els alumnes del grup i envia la comanda a les seves màquines
  const alumneService = require("./alumneService");

  alumneService
    .getGrupAlumnesList()
    .then((grupAlumnesList) => {
      if (grupAlumnesList[grup] && grupAlumnesList[grup].alumnes) {
        for (const alumneId in grupAlumnesList[grup].alumnes) {
          sendCommandToAlumne(alumneId, command);
        }
      }
    })
    .catch((err) => {
      logger.error("Error getting grup alumnes list for command:", err);
    });
}

function sendDisplayCommand(roomTarget, command) {
  // roomTarget pot ser un nom de grup o un alumne individual
  // command pot ser "open-display" o "close-display"

  // Primer comprova si és un alumne individual
  if (allAlumnesStatus.alumnesStat[roomTarget]) {
    sendCommandToAlumne(roomTarget, command);
    logger.debug(`Sent ${command} to alumne: ${roomTarget}`);
    return;
  }

  // Si no és un alumne, prova com a grup
  sendCommandToGrup(roomTarget, command);
  logger.debug(`Sent ${command} to grup: ${roomTarget}`);
}

function getAlumnesMachine() {
  const alumnes = {};
  for (const alumne in allAlumnesStatus.alumnesStat) {
    if (allAlumnesStatus.alumnesStat[alumne])
      alumnes[alumne] = estructuraPublica(
        allAlumnesStatus.alumnesStat[alumne].machines
      );
    else alumnes[alumne] = {};
  }
  return alumnes;
}

module.exports = {
  registerTab,
  registerBrowser,
  unregisterBrowser,
  getAlumnesActivity,
  registerActivityOnUpdateCallback,
  registerActionListener,
  remoteCloseTab,
  getBrowserPendingActions,
  normesWebHasChanged,
  registerApps,
  remoteSetTabStatus,
  registerMachine,
  unregisterMachine,
  updateMachine,
  sessionChangeMachine,
  sendMessageToAlumne,
  sendCommandToAlumne,
  sendCommandToGrup,
  sendDisplayCommand,
  powerOffAllGrup,
  getAlumnesMachine,
};
