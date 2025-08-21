const socket = io(":4000", {
  path: "/ws-cast",
});

const roomInput = document.getElementById("room");
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const statusEl = document.getElementById("status");
const preview = document.getElementById("preview");
const toastEl = document.getElementById("toast");
const modalEl = document.getElementById("modal");
const modalCancel = document.getElementById("modalCancel");
const modalConfirm = document.getElementById("modalConfirm");
// Elements del modal de selecció de compartició
const shareModalEl = document.getElementById("shareModal");
const shareCancelBtn = document.getElementById("shareCancel");
const shareConfirmBtn = document.getElementById("shareConfirm");
const shareKindScreen = document.getElementById("shareKindScreen");
const shareKindUrl = document.getElementById("shareKindUrl");
const shareUrlBlock = document.getElementById("shareUrlBlock");
const shareUrlInput = document.getElementById("shareUrl");
const shareInteractiveInput = document.getElementById("shareInteractive");

let screenStream = null;
let isBroadcaster = false;
let roomName = null;
const peersByViewerId = new Map();
let currentKind = null; // 'webrtc' | 'url' | null
let pendingShare = null; // { kind, url?, interactive? }

document.addEventListener("contextmenu", function (e) {
  e.preventDefault();
});

function setStatus(text) {
  statusEl.textContent = text;
}

function showToast(text, timeoutMs = 3000) {
  if (!toastEl) return;
  toastEl.textContent = text;
  toastEl.classList.add("show");
  setTimeout(() => {
    toastEl.classList.remove("show");
  }, timeoutMs);
}

function showConfirmReplaceModal() {
  return new Promise((resolve) => {
    if (!modalEl) {
      resolve(true);
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
      modalCancel.removeEventListener("click", onCancel);
      modalConfirm.removeEventListener("click", onConfirm);
      document.removeEventListener("keydown", onKey, true);
    }
    modalCancel.addEventListener("click", onCancel);
    modalConfirm.addEventListener("click", onConfirm);
    document.addEventListener("keydown", onKey, true);
    modalEl.classList.remove("hidden");
    try {
      modalConfirm.focus();
    } catch {}
  });
}

function isValidHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function showShareModal() {
  return new Promise((resolve) => {
    if (!shareModalEl) {
      resolve({ kind: "webrtc" });
      return;
    }

    const onKindChange = () => {
      if (shareKindUrl && shareKindUrl.checked) {
        shareUrlBlock.classList.remove("hidden");
        try {
          shareUrlInput.focus();
        } catch {}
      } else {
        shareUrlBlock.classList.add("hidden");
      }
    };
    const onCancel = () => {
      cleanup();
      resolve(null);
    };
    const onConfirm = () => {
      const kind = shareKindUrl && shareKindUrl.checked ? "url" : "webrtc";
      if (kind === "url") {
        const url = (shareUrlInput.value || "").trim();
        const interactive = !!shareInteractiveInput.checked;
        if (!isValidHttpUrl(url)) {
          alert("Introdueix una URL vàlida (http/https)");
          return;
        }
        cleanup();
        resolve({ kind, url, interactive });
        return;
      }
      cleanup();
      resolve({ kind: "webrtc" });
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };

    shareKindScreen && shareKindScreen.addEventListener("change", onKindChange);
    shareKindUrl && shareKindUrl.addEventListener("change", onKindChange);
    shareCancelBtn && shareCancelBtn.addEventListener("click", onCancel);
    shareConfirmBtn && shareConfirmBtn.addEventListener("click", onConfirm);
    document.addEventListener("keydown", onKey, true);
    onKindChange();
    shareModalEl.classList.remove("hidden");
    try {
      (shareKindUrl && shareKindUrl.checked
        ? shareUrlInput
        : shareConfirmBtn
      ).focus();
    } catch {}

    function cleanup() {
      shareModalEl.classList.add("hidden");
      shareKindScreen &&
        shareKindScreen.removeEventListener("change", onKindChange);
      shareKindUrl && shareKindUrl.removeEventListener("change", onKindChange);
      shareCancelBtn && shareCancelBtn.removeEventListener("click", onCancel);
      shareConfirmBtn &&
        shareConfirmBtn.removeEventListener("click", onConfirm);
      document.removeEventListener("keydown", onKey, true);
    }
  });
}

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

async function startCast() {
  roomName = (roomInput.value || "").trim();
  if (!roomName) {
    alert("Introdueix un nom de sala");
    return;
  }

  // Selecció del tipus de compartició
  const choice = await showShareModal();
  if (!choice) {
    setStatus("Operació cancel·lada");
    showToast("Operació cancel·lada");
    return;
  }
  pendingShare = choice;

  // Comprova si ja hi ha emissor i demana confirmació
  let proceed = true;
  await new Promise((resolve) => {
    socket.emit("check-room", { room: roomName }, async (resp) => {
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

  if (choice.kind === "webrtc") {
    try {
      screenStream = await getScreenStreamPreferAudio();
    } catch (e) {
      console.error("Error obtenint pantalla", e);
      setStatus(
        "No s'ha pogut obtenir la pantalla. Revisa permisos del navegador."
      );
      alert(
        "No s'ha pogut obtenir la pantalla. Pot ser que Brave/Chrome bloquegi la captura o l'àudio."
      );
      pendingShare = null;
      return;
    }

    preview.srcObject = screenStream;
    try {
      await preview.play();
    } catch (e) {}
    const videoTrack = screenStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.onended = () => {
        stopCast();
        showToast("Compartició aturada");
      };
    }
    currentKind = "webrtc";
    setStatus("Captura iniciada. Connectant...");
    socket.emit("broadcaster-join-request", { room: roomName, kind: "webrtc" });
  } else {
    // Mode URL
    currentKind = "url";
    // Assegura que no queda cap vídeo en previsualització
    if (preview && preview.srcObject) {
      try {
        preview.pause();
      } catch {}
      preview.srcObject = null;
    }
    setStatus("Compartint URL. Connectant...");
    socket.emit("broadcaster-join-request", {
      room: roomName,
      kind: "url",
      url: choice.url,
      interactive: !!choice.interactive,
    });
  }
}

function stopCast(localOnly = false) {
  // Stop local tracks
  if (screenStream) {
    screenStream.getTracks().forEach((t) => t.stop());
    screenStream = null;
  }

  // Clear preview element to ensure OS/browser sharing UI disappears
  if (preview && preview.srcObject) {
    try {
      preview.pause();
    } catch {}
    preview.srcObject = null;
  }

  // Close all peer connections
  for (const [, pc] of peersByViewerId) {
    try {
      pc.close();
    } catch {}
  }
  peersByViewerId.clear();

  if (isBroadcaster && !localOnly) {
    socket.emit("stop-broadcast");
  }

  isBroadcaster = false;
  currentKind = null;
  pendingShare = null;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  setStatus("Aturat");
  if (roomInput) {
    try {
      roomInput.focus();
    } catch {}
  }
}

startBtn.addEventListener("click", startCast);
stopBtn.addEventListener("click", () => {
  stopCast();
  showToast("Compartició aturada");
});

// Avisa i permet cancel·lar si hi ha una compartició en curs
window.addEventListener("beforeunload", (e) => {
  if (isBroadcaster) {
    e.preventDefault();
    e.returnValue = "";
  }
});
// Si finalment es marxa, notifica l'aturada
window.addEventListener("pagehide", () => {
  if (isBroadcaster) {
    try {
      socket.emit("stop-broadcast");
    } catch {}
  }
});

socket.on("replace-required", async () => {
  // Auto-accept replacement mantenint el tipus de compartició
  const payload = { room: roomName, confirm: true };
  const share = pendingShare || { kind: currentKind };
  if (share && share.kind === "url") {
    payload.kind = "url";
    payload.url = share.url;
    payload.interactive = !!share.interactive;
  } else {
    payload.kind = "webrtc";
  }
  socket.emit("confirm-replace", payload);
  setStatus("Substituint l'emissor existent...");
  showToast("Substituint emissor existent...");
});

socket.on("replace-declined", () => {
  stopCast(true);
  setStatus("Substitució rebutjada");
  showToast("Substitució rebutjada");
});

socket.on("force-disconnect", () => {
  stopCast(true);
  setStatus(
    "S'ha aturat la compartició: algú altre està emetent en aquesta sala"
  );
  showToast(
    "Algú altre està emetent en aquesta sala. S'ha aturat la teva compartició."
  );
  if (roomInput) {
    try {
      roomInput.focus();
    } catch {}
  }
  // Ensure buttons reset to initial state
  startBtn.disabled = false;
  stopBtn.disabled = true;
});

socket.on("broadcaster-accepted", () => {
  isBroadcaster = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  if (currentKind === "url") {
    setStatus(`Emetent URL a la sala: ${roomName}`);
  } else {
    setStatus(`Emetent a la sala: ${roomName}`);
  }
  showToast("Emetent a la sala");
});

socket.on("viewer-offer", async ({ viewerId, sdp }) => {
  if (!screenStream) return;
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
  socket.emit("broadcaster-answer", {
    room: roomName,
    toViewerId: viewerId,
    sdp: pc.localDescription,
  });
});

socket.on("ice-candidate", async ({ viewerId, candidate }) => {
  const pc = peersByViewerId.get(viewerId);
  if (!pc || !candidate) return;
  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (e) {
    console.warn("Error afegint ICE candidate", e);
  }
});

socket.on("viewer-left", ({ viewerId }) => {
  const pc = peersByViewerId.get(viewerId);
  if (pc) {
    try {
      pc.close();
    } catch {}
    peersByViewerId.delete(viewerId);
  }
});

function createPeerConnectionForViewer(viewerId) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        room: roomName,
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
