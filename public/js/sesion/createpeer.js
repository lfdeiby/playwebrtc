var WEBRTC_CONNECTED = false;
var ATTEMPTS = 0;
var RECONNECT_SWITCH = true;

// CREATE RTC CONECION
function createPeerConnection() {
    var pc = new RTCPeerConnection(config);

    pc.addEventListener('icecandidate', function(e){
        const candidate = e.candidate;

        /*
         * the following code block demonstrates a failure to connect.
         * Do not use in production.
        if (candidate && candidate.candidate !== '') {
            const parts = candidate.candidate.split(' ');
            parts[5] = 10000; // replace port with 10000 to make ice fail.

            io.emit('message', {
                type: 'candidate',
                candidate: {
                    candidate: parts.join(' '),
                    sdpMid: candidate.sdpMid,
                    sdpMLineIndex: candidate.sdpMLineIndex,
                },
                signal_room: SIGNAL_ROOM
            });

            return;
        }
        */

        io.emit('message', {
            type: 'candidate',
            candidate: candidate,
            signal_room: SIGNAL_ROOM
        });
    });

    pc.addEventListener('track', function(e){
        videoRemote.onloadedmetadata = function(){
            console.log("video remoto cargado");
        }
        videoRemote.srcObject = e.streams[0];
    });

    pc.addEventListener('iceconnectionstatechange', function(){
        console.log("iceconnectionstatechange: ", pc.iceConnectionState);
        if( pc.iceConnectionState == 'disconnected' ){
            MODAL.reconnect();
        }
        if( pc.iceConnectionState == 'failed' ){
            RECONNECT_SWITCH = true;
            tryForceConnect();
        }
    });

    pc.addEventListener('connectionstatechange', function(){
        console.log("connectionstatechange: ", pc.connectionState);
        if( pc.connectionState == 'connected' ){
            signalingSuccess();
            pc.getStats().then(onConnectionStats);
        }
    });

    pc.addEventListener('signalinstatechange', function(){
        console.log('signalinstatechange:', pc.signalingState)
    });

    pc.addEventListener('error', function(err){
        console.log(err);
    });

    var lastResult = null; // the last getStats result.
    var intervalId = setInterval(async () => {
        if (pc.signalingState === 'closed') {
            clearInterval(intervalId);
            return;
        }
        lastResult = await queryBitrateStats(pc, lastResult);
    }, 2000);

    return pc;
}

function tryForceConnect(){
    var intervalReconnect = setInterval(function(){
        if ( WEBRTC_CONNECTED == true ) {
            alert(" YA HIZO LA CONEXIÓN");
            clearInterval(intervalReconnect);
            return;
        }
        if ( ATTEMPTS == 3 || WEBRTC_CONNECTED == true ) {
            clearInterval(intervalReconnect);
            alert("No es posible conectar");
            return;
        }
        if(  RECONNECT_SWITCH == true ){
            ATTEMPTS += 1;
            alert("INTENTO NRO:" + ATTEMPTS );
            if( me.type == 'coach' ){
                call();
            }else{
                io.emit('call', {"signal_room": SIGNAL_ROOM});
            }
            RECONNECT_SWITCH = false;
        }
    }, 2000);
}

function onConnectionStats(results) {
    // figure out the peer's ip
    let activeCandidatePair = null;
    let remoteCandidate = null;

    // Search for the candidate pair, spec-way first.
    results.forEach(report => {
        if (report.type === 'transport') {
            activeCandidatePair = results.get(report.selectedCandidatePairId);
        }
    });
    // Fallback for Firefox.
    if (!activeCandidatePair) {
        results.forEach(report => {
            if (report.type === 'candidate-pair' && report.selected) {
                activeCandidatePair = report;
            }
        });
    }
    if (activeCandidatePair && activeCandidatePair.remoteCandidateId) {
        remoteCandidate = results.get(activeCandidatePair.remoteCandidateId);
    }
    
    if (remoteCandidate) {
        // Statistics are a bit of a mess still...
        console.log('Remote is',
        remoteCandidate.address || remoteCandidate.ip || remoteCandidate.ipAddress,
        remoteCandidate.port || remoteCandidate.portNumber);
    }
}

async function queryBitrateStats(pc, lastResult) {
    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
    if (!sender) {
        return;
    }
    const stats = await sender.getStats();
    stats.forEach(report => {
      if (report.type === 'outbound-rtp') {
        if (report.isRemote) {
          return;
        }
        const now = report.timestamp;
        const bytes = report.bytesSent;
        const headerBytes = report.headerBytesSent;

        const packets = report.packetsSent;
        if (lastResult && lastResult.has(report.id)) {
          // calculate bitrate
          const bitrate = Math.floor(8 * (bytes - lastResult.get(report.id).bytesSent) /
            (now - lastResult.get(report.id).timestamp));
          const headerrate = Math.floor(8 * (headerBytes - lastResult.get(report.id).headerBytesSent) /
            (now - lastResult.get(report.id).timestamp));

          const packetrate = Math.floor(1000 * (packets - lastResult.get(report.id).packetsSent) /
            (now - lastResult.get(report.id).timestamp));
          console.log(`Bitrate ${bitrate}kbps, overhead ${headerrate}kbps, ${packetrate} packets/second`);
        }
      }
    });
    return stats;
}

function signalingSuccess(){
    MODAL.closeReconnect();
    MODAL.closeConnect();

    document.querySelector('.signal').style.display = 'none';
    document.querySelector('.remote').classList.add('active');
    document.querySelector('.local').classList.add('mini');
    btnMicro.disabled = false;
    btnVideo.disabled = false;
    btnHungup.disabled = false;
    if( btnShare ){
        btnShare.disabled = false;
    }
    WEBRTC_CONNECTED = true;
    ATTEMPTS = 0;
    localStorage.setItem(SIGNAL_ROOM, true);
    //INFO.signaling_finalize();
}