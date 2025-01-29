// public/admin.js
'use strict';
const socket = io(':4000', {
    path: '/ws-cast',
});
const peer = new RTCPeerConnection();

const video = document.getElementById('client-screen');
peer.addEventListener('track', (track) => {
    video.srcObject = track.streams[0];
});

socket.on('offer', async (clientSDP) => {
    await peer.setRemoteDescription(clientSDP);

    const sdp = await peer.createAnswer();
    await peer.setLocalDescription(sdp);
    socket.emit('answer', peer.localDescription);
});

peer.addEventListener('icecandidate', (event) => {
    if (event.candidate) {
        socket.emit('icecandidate', event.candidate);
    }
});
socket.on('icecandidate', async (candidate) => {
    await peer.addIceCandidate(new RTCIceCandidate(candidate));
});
