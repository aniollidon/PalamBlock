const DEFAULT_SECONDARY_SERVER = "https://palamblock.online/";

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
        chrome.storage.local.set(
          { alumne: alumne, server: server, secondaryServer: secondaryServer },
          function () {
            window.close();
          },
        );
      } else {
        alert("Error d'autentificació de l'alumne");
      }
    });
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

chrome.management.getSelf((myInfo) => {
  if (myInfo.installType !== "admin") {
    document.getElementById("uninstall").addEventListener("click", function () {
      chrome.runtime.sendMessage({ type: "uninstall" });
    });
  } else {
    document.getElementById("uninstall-message").style.display = "none";
    document.getElementById("no-uninstall-message").style.display = "";
  }
});
