// public/client.js
'use strict';
const socket = io(':4000', {
    path: '/ws-cast',
});

const peer = new RTCPeerConnection();
let stream = null;

const shareButton = document.getElementById('comparteix');
shareButton.addEventListener('click', async () => {
    try {
        stream = await navigator.mediaDevices.getDisplayMedia({
            audio: false,
            video: true,
        });

        peer.addTrack(stream.getVideoTracks()[0], stream);

        const sdp = await peer.createOffer();
        await peer.setLocalDescription(sdp);
        socket.emit('offer', peer.localDescription);
    } catch (error) {

        console.error(error);
        alert(error.message);
    }
});

socket.on('answer', async (adminSDP) => {
    peer.setRemoteDescription(adminSDP);
});

peer.addEventListener('icecandidate', (event) => {
    if (event.candidate) {
        socket.emit('icecandidate', event.candidate);
    }
});
socket.on('icecandidate', async (candidate) => {
    await peer.addIceCandidate(new RTCIceCandidate(candidate));
});

const stopButton = document.getElementById('atura');
stopButton.addEventListener('click', () => {
    if(stream){
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());  // Atura totes les pistes
    }
});
