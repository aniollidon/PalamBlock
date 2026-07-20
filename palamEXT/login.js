const DEFAULT_SECONDARY_SERVER = "https://palamblock.online/";
const BRIDGE_URL = "http://localhost:9876/credentials";
const POLL_INTERVAL = 3000; // 3 segons

function normalizeServerUrl(url) {
  if (!url || typeof url !== "string") return "";
  return url.trim().replace(/\/+$/, "");
}

chrome.storage.local.get(["alumne", "server", "secondaryServer"], (res) => {
  if (res.server) document.getElementById("server").value = res.server;
  if (res.secondaryServer)
    document.getElementById("secondaryServer").value = res.secondaryServer;
  else
    document.getElementById("secondaryServer").value = DEFAULT_SECONDARY_SERVER;
  if (res.alumne) document.getElementById("alumne").value = res.alumne;
});

function openNewTabAndClose() {
  chrome.tabs.create({}, () => {
    window.close();
  });
}

function handleAuthSuccess(alumne, server, secondaryServer) {
  chrome.storage.local.set(
    { alumne: alumne, server: server, secondaryServer: secondaryServer },
    openNewTabAndClose,
  );
}

function save_options() {
  const alumne = document.getElementById("alumne").value;
  const clau = document.getElementById("clau").value;
  const server = normalizeServerUrl(document.getElementById("server").value);
  const secondaryServerInput = document.getElementById("secondaryServer").value;
  const secondaryServer =
    normalizeServerUrl(secondaryServerInput) ||
    normalizeServerUrl(DEFAULT_SECONDARY_SERVER);

  if (alumne === "" || clau === "" || server === "") {
    alert("Cal especificar server, alumne i clau");
    return;
  }

  chrome.runtime
    .sendMessage({
      type: "autentificacio",
      alumne: alumne,
      clau: clau,
      server: server,
      secondaryServer: secondaryServer,
    })
    .then((message) => {
      if (!message) {
        alert("Error de connexió amb el servidor");
      } else if (message.status === "OK") {
        alert("Alumne registrat correctament");
        handleAuthSuccess(alumne, server, secondaryServer);
      } else {
        alert("Error d'autentificació de l'alumne");
      }
    });
}

// ── Pont local: polling al bridge de palam-dash ──────────────────────────
// Només actiu si l'extensió està instal·lada per política (installType admin).

let pollingTimer = null;

async function tryBridgeAuth() {
  try {
    const response = await fetch(BRIDGE_URL);
    if (response.ok) {
      const data = await response.json();
      if (data.server && data.alumne) {
        // Credencials rebudes: aturar el polling i fer login
        stopPolling();
        chrome.runtime
          .sendMessage({
            type: "autentificacio",
            alumne: data.alumne,
            server: data.server,
            secondaryServer: data.secondaryServer || DEFAULT_SECONDARY_SERVER,
            // sense clau: el servidor valida per IP + machineId
          })
          .then((message) => {
            if (message && message.status === "OK") {
              handleAuthSuccess(data.alumne, data.server, data.secondaryServer || DEFAULT_SECONDARY_SERVER);
            } else {
              // Servidor rebutja: esperar el POLL_INTERVAL complet abans de tornar-hi
              if (!pollingTimer) {
                pollingTimer = setInterval(tryBridgeAuth, POLL_INTERVAL);
              }
            }
          });
      }
      // Si respon 200 però sense credencials, continuem esperant
    }
    // 503 (not_authenticated) o altres errors: tornem a programar
  } catch (_e) {
    // Bridge no disponible (palam-dash no arrencat): reintentar
  }
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

function startPollingBridge() {
  stopPolling();
  // Primer intent immediat
  tryBridgeAuth();
  pollingTimer = setInterval(tryBridgeAuth, POLL_INTERVAL);
}

function restore_options() {
  chrome.storage.local.get(["alumne"], function (result) {
    if (result.alumne && result.alumne !== "")
      document.getElementById("alumne").value = result.alumne;
  });
}

document.addEventListener("DOMContentLoaded", restore_options);
document.getElementById("save").addEventListener("click", save_options);
document.getElementById("clau").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    save_options();
  }
});

chrome.management.getSelf(async (myInfo) => {
  const debug = await chrome.storage.local.get("_dev_force_bridge");
  if (myInfo.installType === "admin" || debug._dev_force_bridge) {
    // Extensió instal·lada per política (o mode debug): activar polling al pont local
    startPollingBridge();
  }

  if (myInfo.installType !== "admin") {
    document.getElementById("uninstall").addEventListener("click", function () {
      chrome.runtime.sendMessage({ type: "uninstall" });
    });
  } else {
    document.getElementById("uninstall-message").style.display = "none";
    document.getElementById("no-uninstall-message").style.display = "";
  }
});
