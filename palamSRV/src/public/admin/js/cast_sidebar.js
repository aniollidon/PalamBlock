// Cast sidebar logic for /admin/screens
// Mostra i amaga la sidebar, gestiona la previsualització i la captura de pantalla

// Socket per cast (ws-cast)
const castSocket = io(":4000", {
  path: "/ws-cast",
});

// Elements

const castSidebar = document.getElementById("castSidebar");
const castSidebarClose = document.getElementById("castSidebarClose");
const castButton = document.getElementById("globalGroupCastButton");
const castShareScreenButton = document.getElementById("castShareScreenButton");
const castShareUrlButton = document.getElementById("castShareUrlButton");
const castUrlInput = document.getElementById("castUrlInput");
const castPreviewContainer = document.getElementById("castPreviewContainer");
const castPreview = document.getElementById("castPreview");
const castPreviewIframe = document.getElementById("castPreviewIframe");
const castStopButton = document.getElementById("castStopButton");
const castSidebarTitle = document.getElementById("castSidebarTitle");
const grupSelector = document.getElementById("grupSelector");
const castTabNav = document.getElementById("castTabNav");
const castScreenTab = document.getElementById("castScreenTab");
const castUrlTab = document.getElementById("castUrlTab");
const castScreenTabPane = document.getElementById("castScreenTabPane");
const castUrlTabPane = document.getElementById("castUrlTabPane");
const castUrlInteractiu = document.getElementById("castUrlInteractiu");
const castSidebarContainer = document.getElementById("castSidebarContainer");
// Nova pestanya missatge
const castMessageTab = document.getElementById("castMessageTab");
const castMessageTabPane = document.getElementById("castMessageTabPane");
const castShareMessageButton = document.getElementById(
  "castShareMessageButton"
);
const castMessageText = document.getElementById("castMessageText");
const castMessageTime = document.getElementById("castMessageTime");
// Eliminat checkbox de tancar en fer clic

// Elements del dropdown d'alumnes
const castStudentScreenDropdown = document.getElementById(
  "castStudentScreenDropdown"
);
const castStudentScreenMenu = document.getElementById("castStudentScreenMenu");

// Variables per gestionar dades d'alumnes (importades de screens.js)
let currentGrupAlumnesList = {};
let currentAlumnesMachines = {};

// Variables d'estat per cast
let screenStream = null;
let isBroadcasting = false;
let currentRoom = null;
const peersByViewerId = new Map();
let currentKind = null; // 'webrtc' | 'url' | null
let pendingShare = null; // { kind, url?, interactive? }

// Override per emetre a un alumne específic (sense seleccionar grup)
let overrideRoom = null; // nom de l'alumne si estem en mode individual iniciat des del grid

function getCurrentTargetRoom() {
  return overrideRoom || grupSelector.value;
}

// Elements per toast i modals (assumim que existeixen)
let toastEl = null;
let modalEl = null;
let modalCancel = null;
let modalConfirm = null;

// Intentar trobar elements de toast i modal si existeixen
document.addEventListener("DOMContentLoaded", () => {
  toastEl = document.getElementById("toast");
  modalEl = document.getElementById("modal");
  modalCancel = document.getElementById("modalCancel");
  modalConfirm = document.getElementById("modalConfirm");
});

// Helper per moure la sidebar dins el contenidor
function showSidebar() {
  if (castSidebarContainer && !castSidebarContainer.contains(castSidebar)) {
    castSidebarContainer.appendChild(castSidebar);
  }
  castSidebarContainer.style.display = "block";
  castSidebar.style.display = "flex";
}
function hideSidebar() {
  castSidebar.style.display = "none";
  castSidebarContainer.style.display = "none";
  stopPreview();
  // Reinicia mode override
  if (overrideRoom) {
    overrideRoom = null;
    // Torna a mostrar el dropdown d'alumnes si s'havia amagat
    const dropdownWrapper = castStudentScreenDropdown?.parentElement;
    if (dropdownWrapper) dropdownWrapper.style.display = "";
  }
}

// Quan canvia el grup, actualitza el botó i el títol
grupSelector.addEventListener("change", () => {
  // Si estem en mode override (alumne individual) ignorem canvis de grup
  if (overrideRoom) return;
  if (castSidebar.style.display === "block") {
    const grup = grupSelector.value;
    if (isBroadcasting && currentRoom) {
      if (currentKind === "url")
        setStatus(`Emetent URL a la sala: ${currentRoom}`);
      else setStatus(`Emetent a la sala: ${currentRoom}`);
    } else {
      castSidebarTitle.textContent = grup ? `Emet a ${grup}` : "Emet a";
    }
  }
  updateStudentDropdown();
});

// Toggle sidebar només si hi ha grup
castButton.addEventListener("click", () => {
  // Mode grup: assegura que no estem en override
  overrideRoom = null;
  const dropdownWrapper = castStudentScreenDropdown?.parentElement;
  if (dropdownWrapper) dropdownWrapper.style.display = "";
  const grup = grupSelector.value;
  if (!grup) return;
  if (
    castSidebar.style.display !== "none" &&
    castSidebarContainer.style.display !== "none"
  ) {
    hideSidebar();
    return;
  }
  showSidebar();
  castSidebarTitle.textContent = `Emet a ${grup}`;
  castScreenTab.classList.add("active");
  castUrlTab.classList.remove("active");
  castScreenTabPane.classList.add("show", "active");
  castUrlTabPane.classList.remove("show", "active");
  updateStudentDropdown();
});

// Funció global per obrir la sidebar per un alumne concret (emissió individual)
window.openCastSidebarForStudent = function (alumne) {
  overrideRoom = alumne;
  // Amaga dropdown d'alumnes (no té sentit en mode individual)
  const dropdownWrapper = castStudentScreenDropdown?.parentElement;
  if (dropdownWrapper) dropdownWrapper.style.display = "none";
  if (
    castSidebar.style.display !== "none" &&
    castSidebarContainer.style.display !== "none"
  ) {
    // Ja oberta: simplement actualitza títol
    castSidebarTitle.textContent = `Emet a ${alumne}`;
  } else {
    showSidebar();
    castSidebarTitle.textContent = `Emet a ${alumne}`;
    castScreenTab.classList.add("active");
    castUrlTab.classList.remove("active");
    castScreenTabPane.classList.add("show", "active");
    castUrlTabPane.classList.remove("show", "active");
  }
};

// Tancar sidebar
castSidebarClose.addEventListener("click", () => {
  hideSidebar();
});

// Pestanyes
castScreenTab.addEventListener("click", () => {
  castScreenTab.classList.add("active");
  castUrlTab.classList.remove("active");
  castScreenTabPane.classList.add("show", "active");
  castUrlTabPane.classList.remove("show", "active");
});
castUrlTab.addEventListener("click", () => {
  castUrlTab.classList.add("active");
  castScreenTab.classList.remove("active");
  castUrlTabPane.classList.add("show", "active");
  castScreenTabPane.classList.remove("show", "active");
  if (castMessageTab) castMessageTab.classList.remove("active");
  if (castMessageTabPane) castMessageTabPane.classList.remove("show", "active");
});
if (castMessageTab) {
  castMessageTab.addEventListener("click", () => {
    castMessageTab.classList.add("active");
    castScreenTab.classList.remove("active");
    castUrlTab.classList.remove("active");
    if (castMessageTabPane) castMessageTabPane.classList.add("show", "active");
    castScreenTabPane.classList.remove("show", "active");
    castUrlTabPane.classList.remove("show", "active");
  });
}

// Compartir URL amb emissió real i verificació prèvia
castShareUrlButton.addEventListener("click", async () => {
  const targetRoom = getCurrentTargetRoom();
  if (!targetRoom) {
    alert("Selecciona un grup o alumne abans d'emetre");
    return;
  }

  if (isBroadcasting) {
    alert("Ja estàs emetent. Atura l'emissió actual primer.");
    return;
  }

  const url = castUrlInput.value.trim();
  if (!url) {
    alert("Introdueix una URL");
    return;
  }

  if (!isValidHttpUrl(url)) {
    alert("Introdueix una URL vàlida (http/https)");
    return;
  }

  const interactive = !!castUrlInteractiu.checked;

  // Preparar dades de compartició
  const choice = { kind: "url", url: url, interactive: interactive };
  pendingShare = choice;

  // Comprova si ja hi ha emissor i demana confirmació
  let proceed = true;
  await new Promise((resolve) => {
    castSocket.emit("check-room", { room: targetRoom }, async (resp) => {
      if (resp && resp.hasBroadcaster) {
        proceed = await showConfirmReplaceModal();
      }
      resolve();
    });
  });

  if (!proceed) {
    setStatus("Operació cancel·lada");
    showToast("Operació cancel·lada");
    pendingShare = null;
    return;
  }

  currentRoom = targetRoom;
  currentKind = "url";

  // Mostrar previsualització amb iframe
  showIframePreview(url);

  setStatus("Compartint URL. Connectant...");

  // Sol·licitar unió com a emissor d'URL
  castSocket.emit("broadcaster-join-request", {
    room: currentRoom,
    kind: "url",
    url: url,
    interactive: interactive,
  });
});

// Emetre missatge (utilitza emissió URL oculta)
if (castShareMessageButton) {
  castShareMessageButton.addEventListener("click", async () => {
    const targetRoom = getCurrentTargetRoom();
    if (!targetRoom) {
      alert("Selecciona un grup o alumne abans d'emetre");
      return;
    }
    if (isBroadcasting) {
      alert("Ja estàs emetent. Atura l'emissió actual primer.");
      return;
    }
    const txt = (castMessageText?.value || "").trim();
    if (!txt) {
      alert("Introdueix un missatge");
      return;
    }
    let secs = parseInt(castMessageTime?.value || "10", 10);
    if (isNaN(secs) || secs < 0) secs = 0;
    // Construeix URL cap a misssatge.html (sense tancar per clic)
    const url = `http://192.168.1.72:4000/cast/misssatge.html?text=${encodeURIComponent(
      txt
    )}&temps=${secs}`;

    // Preparar dades de compartició
    const choice = { kind: "url", url: url, interactive: false };
    pendingShare = choice;

    // Comprova si ja hi ha emissor
    let proceed = true;
    await new Promise((resolve) => {
      castSocket.emit("check-room", { room: targetRoom }, async (resp) => {
        if (resp && resp.hasBroadcaster) {
          proceed = await showConfirmReplaceModal();
        }
        resolve();
      });
    });
    if (!proceed) {
      setStatus("Operació cancel·lada");
      showToast("Operació cancel·lada");
      pendingShare = null;
      return;
    }

    currentRoom = targetRoom;
    currentKind = "url";

    // Previsualització (iframe) del missatge
    showIframePreview(url);
    setStatus("Compartint missatge. Connectant...");
    showToast("Emetent missatge...");

    castSocket.emit("broadcaster-join-request", {
      room: currentRoom,
      kind: "url",
      url: url,
      interactive: false,
    });

    // Auto aturar emissió si hi ha temps definit
    if (secs > 0) {
      setTimeout(() => {
        if (
          isBroadcasting &&
          currentKind === "url" &&
          currentRoom === targetRoom &&
          castPreviewIframe?.src.includes("misssatge.html")
        ) {
          stopCast();
          showToast("Emissió de missatge finalitzada");
        }
      }, secs * 1000 + 500);
    }
  });
}

// Atura emissió real
castStopButton.addEventListener("click", () => {
  stopCast();
  showToast("Emissió aturada");
});

// Compartir pantalla amb emissió real i verificació prèvia
castShareScreenButton.addEventListener("click", async () => {
  const targetRoom = getCurrentTargetRoom();
  if (!targetRoom) {
    alert("Selecciona un grup o alumne abans d'emetre");
    return;
  }

  if (isBroadcasting) {
    alert("Ja estàs emetent. Atura l'emissió actual primer.");
    return;
  }

  // Preparar dades de compartició
  const choice = { kind: "webrtc" };
  pendingShare = choice;

  // Comprova si ja hi ha emissor i demana confirmació
  let proceed = true;
  await new Promise((resolve) => {
    castSocket.emit("check-room", { room: targetRoom }, async (resp) => {
      if (resp && resp.hasBroadcaster) {
        proceed = await showConfirmReplaceModal();
      }
      resolve();
    });
  });

  if (!proceed) {
    setStatus("Operació cancel·lada");
    showToast("Operació cancel·lada");
    pendingShare = null;
    return;
  }

  try {
    // Obtenir pantalla amb preferència d'àudio
    screenStream = await getScreenStreamPreferAudio();

    currentRoom = targetRoom;
    currentKind = "webrtc";

    // Mostrar previsualització amb vídeo
    await showVideoPreview(screenStream);

    // Configurar event d'aturada automàtica
    const videoTrack = screenStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.onended = () => {
        stopCast();
        showToast("Compartició aturada");
      };
    }

    setStatus("Captura iniciada. Connectant...");

    // Sol·licitar unió com a emissor
    castSocket.emit("broadcaster-join-request", {
      room: currentRoom,
      kind: "webrtc",
    });
  } catch (err) {
    console.error("Error obtenint pantalla", err);
    setStatus(
      "No s'ha pogut obtenir la pantalla. Revisa permisos del navegador."
    );
    alert(
      "No s'ha pogut obtenir la pantalla. Pot ser que Brave/Chrome bloquegi la captura o l'àudio."
    );
    pendingShare = null;
  }
});

function stopPreview() {
  castPreviewContainer.style.display = "none";

  // Netejar vídeo
  if (castPreview.srcObject) {
    const tracks = castPreview.srcObject.getTracks();
    tracks.forEach((track) => track.stop());
    castPreview.srcObject = null;
  }
  castPreview.src = "";
  castPreview.style.display = "none";

  // Netejar iframe
  if (castPreviewIframe) {
    castPreviewIframe.src = "";
    castPreviewIframe.style.display = "none";
  }
}

// Funció per mostrar previsualització de vídeo (pantalla compartida)
function showVideoPreview(stream) {
  if (!castPreviewContainer || !castPreview) return;

  // Ocultar iframe i mostrar vídeo
  if (castPreviewIframe) castPreviewIframe.style.display = "none";
  castPreview.style.display = "block";

  castPreviewContainer.style.display = "block";
  castPreview.srcObject = stream;

  return castPreview.play().catch((e) => {
    console.warn("Error reproduint previsualització de vídeo:", e);
  });
}

// Funció per mostrar previsualització d'iframe (URL o pantalla d'alumne)
function showIframePreview(url) {
  if (!castPreviewContainer || !castPreviewIframe) return;

  // Ocultar vídeo i mostrar iframe
  castPreview.style.display = "none";
  if (castPreview.srcObject) {
    const tracks = castPreview.srcObject.getTracks();
    tracks.forEach((track) => track.stop());
    castPreview.srcObject = null;
  }

  castPreviewIframe.style.display = "block";
  castPreviewContainer.style.display = "block";
  castPreviewIframe.src = url;
}

// Funcions auxiliars per cast
async function getScreenStreamPreferAudio() {
  try {
    // Primer intent: amb àudio
    return await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });
  } catch (e1) {
    console.warn(
      "getDisplayMedia amb àudio ha fallat, reintentant sense àudio",
      e1
    );
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      setStatus("Captura sense àudio (permisos/navegador)");
      showToast("Captura iniciada sense àudio");
      return stream;
    } catch (e2) {
      throw e1;
    }
  }
}

function isValidHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function showToast(text, timeoutMs = 3000) {
  if (toastEl) {
    // Si existeix un element toast global, usar-lo però posicionar-lo millor
    toastEl.textContent = text;

    // Determinar posició segons si la sidebar està oberta
    const topPosition = isSidebarVisible() ? "80px" : "20px";

    // Assegurar posicionament consistent
    toastEl.style.cssText = `
      position: fixed;
      top: ${topPosition};
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 10050;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      border: 1px solid #555;
      text-align: center;
      max-width: 400px;
      word-wrap: break-word;
      transition: all 0.3s ease;
    `;

    toastEl.classList.add("show");
    setTimeout(() => {
      toastEl.classList.remove("show");
    }, timeoutMs);
  } else {
    // Fallback: usar sistema de toasts temporals
    console.log("Toast:", text);
    createTemporaryToast(text, timeoutMs);
  }
}

function createTemporaryToast(text, timeoutMs = 3000) {
  // Crear contenidor de toasts si no existeix
  let toastContainer = document.getElementById("cast-toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "cast-toast-container";
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10050;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
      max-width: 400px;
    `;

    // Ajustar posició si la sidebar està oberta
    if (isSidebarVisible()) {
      toastContainer.style.top = "80px"; // Més espai quan la sidebar està oberta
    }

    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.style.cssText = `
    background: #333;
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    border: 1px solid #555;
    text-align: center;
    opacity: 0;
    transform: translateY(-20px);
    transition: all 0.3s ease;
    pointer-events: auto;
    word-wrap: break-word;
  `;
  toast.textContent = text;

  // Afegir toast al contenidor
  toastContainer.appendChild(toast);

  // Animar entrada
  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 10);

  // Animar sortida i eliminar
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-20px)";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
        // Eliminar contenidor si està buit
        if (toastContainer.children.length === 0) {
          toastContainer.remove();
        }
      }
    }, 300);
  }, timeoutMs);
}

// Funció auxiliar per detectar si la sidebar està visible
function isSidebarVisible() {
  return (
    castSidebar &&
    castSidebarContainer &&
    castSidebar.style.display !== "none" &&
    castSidebarContainer.style.display !== "none"
  );
}

function showConfirmReplaceModal() {
  return new Promise((resolve) => {
    if (!modalEl) {
      // Si no hi ha modal, crear un modal temporal
      resolve(createTemporaryConfirmModal());
      return;
    }
    const onCancel = () => {
      cleanup();
      resolve(false);
    };
    const onConfirm = () => {
      cleanup();
      resolve(true);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    function cleanup() {
      modalEl.classList.add("hidden");
      modalCancel && modalCancel.removeEventListener("click", onCancel);
      modalConfirm && modalConfirm.removeEventListener("click", onConfirm);
      document.removeEventListener("keydown", onKey, true);
    }
    modalCancel && modalCancel.addEventListener("click", onCancel);
    modalConfirm && modalConfirm.addEventListener("click", onConfirm);
    document.addEventListener("keydown", onKey, true);
    modalEl.classList.remove("hidden");
    try {
      modalConfirm && modalConfirm.focus();
    } catch {}
  });
}

function createTemporaryConfirmModal() {
  return new Promise((resolve) => {
    const result = confirm(
      "Hi ha algú emetent en aquesta sala. Vols substituir-lo?"
    );
    resolve(result);
  });
}

function setStatus(text) {
  // Actualitzar el títol de la sidebar amb l'estat
  if (castSidebarTitle) {
    const room = getCurrentTargetRoom();
    castSidebarTitle.textContent = room ? `${room} - ${text}` : text;
  }
  console.log("Status:", text);
}

// Funció per actualitzar la llista d'alumnes connectats al dropdown
function updateStudentDropdown() {
  if (!castStudentScreenMenu) return;

  const grup = grupSelector.value;

  // Netejar menu actual
  castStudentScreenMenu.innerHTML = `
    <li><h6 class="dropdown-header">Emet pantalla d'alumne</h6></li>
    <li><hr class="dropdown-divider"></li>
  `;

  if (!grup || !currentGrupAlumnesList[grup]) {
    castStudentScreenMenu.innerHTML +=
      '<li><span class="dropdown-item-text text-muted">Selecciona un grup primer</span></li>';
    return;
  }

  const alumnesConnectats = [];
  const grupAlumnes = currentGrupAlumnesList[grup].alumnes;

  // Buscar alumnes connectats
  for (let alumne in grupAlumnes) {
    if (
      currentAlumnesMachines[alumne] &&
      Object.keys(currentAlumnesMachines[alumne]).length > 0
    ) {
      const maquina = Object.values(currentAlumnesMachines[alumne])[0];
      if (maquina && maquina.connected && maquina.ip) {
        alumnesConnectats.push({ nom: alumne, ip: maquina.ip });
      }
    }
  }

  if (alumnesConnectats.length === 0) {
    castStudentScreenMenu.innerHTML +=
      '<li><span class="dropdown-item-text text-muted">Cap alumne connectat</span></li>';
    return;
  }

  // Afegir alumnes connectats al menu
  alumnesConnectats.forEach((alumne) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.className = "dropdown-item";
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-display me-2" viewBox="0 0 16 16">
        <path d="M0 4s0-2 2-2h12s2 0 2 2v6s0 2-2 2h-4q0 1 .25 1.5H11a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1h.75Q6 13 6 12H2s-2 0-2-2zm1.398-.855a.76.76 0 0 0-.254.302A1.5 1.5 0 0 0 1 4.01V10c0 .325.078.502.145.602q.105.156.302.254a1.5 1.5 0 0 0 .538.143L2.01 11H14c.325 0 .502-.078.602-.145a.76.76 0 0 0 .254-.302 1.5 1.5 0 0 0 .143-.538L15 9.99V4c0-.325-.078-.502-.145-.602a.76.76 0 0 0-.302-.254A1.5 1.5 0 0 0 13.99 3H2c-.325 0-.502.078-.602.145"/>
      </svg>
      ${alumne.nom}
    `;
    button.onclick = () => shareStudentScreen(alumne.nom, alumne.ip);
    li.appendChild(button);
    castStudentScreenMenu.appendChild(li);
  });
}

// Funció per gestionar dades importades des de screens.js
function updateStudentData(grupAlumnesList, alumnesMachines) {
  currentGrupAlumnesList = grupAlumnesList || {};
  currentAlumnesMachines = alumnesMachines || {};
  updateStudentDropdown();
}

// Fer la funció global perquè pugui ser cridada des de screens.js
window.updateCastStudentData = updateStudentData;

// Funció per emetre la pantalla d'un alumne
async function shareStudentScreen(alumneNom, alumneIp) {
  const grup = grupSelector.value;
  if (!grup) {
    alert("Selecciona un grup abans d'emetre");
    return;
  }

  if (isBroadcasting) {
    alert("Ja estàs emetent. Atura l'emissió actual primer.");
    return;
  }

  // Construir URL de l'alumne (mateix format que els iframes de screens.js)
  const studentUrl = `http://${alumneIp}:6080/vnc_iframe.html?password=fpb123&view=true&reconnect&name=${alumneNom}`;

  // Preparar dades de compartició
  const choice = { kind: "url", url: studentUrl, interactive: false };
  pendingShare = choice;

  // Comprova si ja hi ha emissor i demana confirmació
  let proceed = true;
  await new Promise((resolve) => {
    castSocket.emit("check-room", { room: grup }, async (resp) => {
      if (resp && resp.hasBroadcaster) {
        proceed = await showConfirmReplaceModal();
      }
      resolve();
    });
  });

  if (!proceed) {
    setStatus("Operació cancel·lada");
    showToast("Operació cancel·lada");
    pendingShare = null;
    return;
  }

  currentRoom = grup;
  currentKind = "url";

  // Mostrar previsualització amb iframe
  showIframePreview(studentUrl);

  setStatus(`Compartint pantalla de ${alumneNom}. Connectant...`);
  showToast(`Emetent pantalla de ${alumneNom} al grup`);

  // Sol·licitar unió com a emissor d'URL
  castSocket.emit("broadcaster-join-request", {
    room: currentRoom,
    kind: "url",
    url: studentUrl,
    interactive: false,
  });
}

function stopCast(localOnly = false) {
  // Aturar streams locals
  if (screenStream) {
    screenStream.getTracks().forEach((t) => t.stop());
    screenStream = null;
  }

  // Netejar previsualització completa
  stopPreview();

  // Tancar connexions WebRTC
  for (const [, pc] of peersByViewerId) {
    try {
      pc.close();
    } catch {}
  }
  peersByViewerId.clear();

  // Notificar servidor si cal
  if (isBroadcasting && !localOnly) {
    castSocket.emit("stop-broadcast");
  }

  // Resetar estat
  isBroadcasting = false;
  currentKind = null;
  currentRoom = null;
  pendingShare = null;

  setStatus("Aturat");
}

function createPeerConnectionForViewer(viewerId) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      castSocket.emit("ice-candidate", {
        room: currentRoom,
        toViewerId: viewerId,
        candidate: event.candidate,
      });
    }
  };

  pc.onconnectionstatechange = () => {
    if (
      pc.connectionState === "failed" ||
      pc.connectionState === "disconnected" ||
      pc.connectionState === "closed"
    ) {
      try {
        pc.close();
      } catch {}
      peersByViewerId.delete(viewerId);
    }
  };

  return pc;
}

// Event listeners del socket cast
castSocket.on("broadcaster-accepted", () => {
  isBroadcasting = true;
  if (currentKind === "url") {
    setStatus(`Emetent URL a la sala: ${currentRoom}`);
    showToast(`Emetent URL al grup: ${currentRoom}`);
  } else {
    setStatus(`Emetent a la sala: ${currentRoom}`);
    showToast(`Emetent pantalla al grup: ${currentRoom}`);
  }
});

castSocket.on("viewer-offer", async ({ viewerId, sdp }) => {
  if (!screenStream || currentKind !== "webrtc") return;
  let pc = peersByViewerId.get(viewerId);
  if (!pc) {
    pc = createPeerConnectionForViewer(viewerId);
    peersByViewerId.set(viewerId, pc);
  }

  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  for (const track of screenStream.getTracks()) {
    pc.addTrack(track, screenStream);
  }
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  castSocket.emit("broadcaster-answer", {
    room: currentRoom,
    toViewerId: viewerId,
    sdp: pc.localDescription,
  });
});

castSocket.on("ice-candidate", async ({ viewerId, candidate }) => {
  const pc = peersByViewerId.get(viewerId);
  if (!pc || !candidate) return;
  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (e) {
    console.warn("Error afegint ICE candidate", e);
  }
});

castSocket.on("viewer-left", ({ viewerId }) => {
  const pc = peersByViewerId.get(viewerId);
  if (pc) {
    try {
      pc.close();
    } catch {}
    peersByViewerId.delete(viewerId);
  }
});

castSocket.on("force-disconnect", () => {
  stopCast(true);
  setStatus(
    "S'ha aturat la compartició: algú altre està emetent en aquesta sala"
  );
  showToast(
    "Algú altre està emetent en aquesta sala. S'ha aturat la teva emissió."
  );
});

castSocket.on("replace-required", async () => {
  // Auto-acceptar substitució mantenint el tipus de compartició
  const payload = { room: currentRoom, confirm: true };
  const share = pendingShare || { kind: currentKind };
  if (share && share.kind === "url") {
    payload.kind = "url";
    payload.url = share.url;
    payload.interactive = !!share.interactive;
  } else {
    payload.kind = "webrtc";
  }
  castSocket.emit("confirm-replace", payload);
  setStatus("Substituint l'emissor existent...");
  showToast("Substituint emissor existent...");
});

castSocket.on("replace-declined", () => {
  stopCast(true);
  setStatus("Substitució rebutjada");
  showToast("Substitució rebutjada");
});

// Gestió de tancar pàgina
window.addEventListener("beforeunload", (e) => {
  if (isBroadcasting) {
    e.preventDefault();
    e.returnValue = "";
  }
});

window.addEventListener("pagehide", () => {
  if (isBroadcasting) {
    try {
      castSocket.emit("stop-broadcast");
    } catch {}
  }
});

// Rebre notificació de tancament de missatge des de l'iframe
window.addEventListener("message", (ev) => {
  const d = ev.data;
  if (!d || d.type !== "palam-message-close") return;
  if (
    isBroadcasting &&
    currentKind === "url" &&
    castPreviewIframe?.src.includes("misssatge.html")
  ) {
    stopCast();
    showToast("Missatge tancat");
  }
});
