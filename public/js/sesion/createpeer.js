var WEBRTC_CONNECTED = false;
var ATTEMPTS = 0;
var RECONNECT_SWITCH = true;

// CREATE RTC CONECION
function createPeerConnection() {
    if( pc ){
        closePeerConnection();
    }

    pc = new RTCPeerConnection(config);

    pc.addEventListener('icecandidate', function(event){
        var candidate = event.candidate;
        // console.log(candidate);
        if( candidate ){
            io.emit('message', {
                type: 'candidate',
                candidate: candidate,
                signal_room: SIGNAL_ROOM
            });
        }
    });

    pc.addEventListener('track', function(event){
        videoRemote.onloadedmetadata = function(){
            //console.log("video remoto cargado");
        }
        remoteStream = event.streams[0];
        videoRemote.srcObject = event.streams[0];
        INFO.ontrack( event.streams.length );
    });

    pc.addEventListener('iceconnectionstatechange', function(event){
        // console.log('ICE connection state: ', event.target.iceConnectionState);
        // console.log("iceconnectionstatechange: ", pc.iceConnectionState);
        INFO.ice_state(pc.iceConnectionState);

        if( pc.iceConnectionState == 'disconnected' ){
            WEBRTC_CONNECTED = false;
            MODAL.closeAll();
            MODAL.reconnect();
        }
    });

    pc.addEventListener('connectionstatechange', function(){
        //console.log("connectionstatechange: ", pc.connectionState);
        if( pc.connectionState == 'connected' ){
            signalingSuccess();
            pc.getStats().then(onConnectionStats);
        }
        if( pc.connectionState == 'failed' ){
            RECONNECT_SWITCH = true;
            tryForceConnect();
        }
    });
    /*
    pc.addEventListener('signalinstatechange', function(){
        console.log('signalinstatechange:', pc.signalingState)
    });
    */

    pc.addEventListener('addstream', function(event){
        remoteStream = event.stream;
        videoRemote.srcObject = event.stream;
        INFO.ontrack();
    });       

    pc.addEventListener('error', function(err){
        INFO.error_signaling(err.message);
        console.log(err);
    });

    /*
    var lastResult = null; // the last getStats result.
    var intervalId = setInterval(async () => {
        if (pc.signalingState === 'closed') {
            clearInterval(intervalId);
            return;
        }
        lastResult = await queryBitrateStats(pc, lastResult);
    }, 2000);
    */

    //return pc;
}

function tryForceConnect(){
    var time1 = Date.now();
    var intervalReconnect = setInterval(function(){
        if ( WEBRTC_CONNECTED == true ) {
            clearInterval(intervalReconnect);
            return;
        }
        if ( ATTEMPTS == 3 || WEBRTC_CONNECTED == true ) {
            POPUP.notConnect(other);
            clearInterval(intervalReconnect);
            return;
        }
        if(  RECONNECT_SWITCH == true ){
            ATTEMPTS += 1;
            if( me.type == 'coach' ){
                call();
            }else{
                io.emit('call', {"signal_room": SIGNAL_ROOM});
            }
            RECONNECT_SWITCH = false;
        }
        var time2 = Date.now();
        var difftime = (time2 - time1) / 1000;
        if( difftime > 15 ){
            POPUP.notConnect(other);
            clearInterval(intervalReconnect);
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
        var connectString = (remoteCandidate.address || remoteCandidate.ip || remoteCandidate.ipAddress) 
            + ":" + ( remoteCandidate.port || remoteCandidate.portNumber )
            + " - " + ( remoteCandidate.candidateType )
            + " | " + ( remoteCandidate.protocol );

        INFO.webrtc_connect(connectString);
    }
}

function signalingSuccess(){
    MODAL.closeAll();
    POPUP.closeAll();

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
    INFO.signaling_finalize();

    showStats();
}

async function showStats(){
    /**/
    var lastResult = null; // the last getStats result.
    var intervalId = setInterval(async () => {
        if( videoRemote.srcObject == null ){
            videoRemote.srcObject = remoteStream;
        }

        if (pc && pc.signalingState === 'closed') {
            clearInterval(intervalId);
            return;
        }
        lastResult = await queryBitrateStats(pc, lastResult);
    }, 5000);
    /**/
}

async function queryBitrateStats(pc, lastResult) {
    var sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
    if (pc == null || !sender ) {
        return;
    }
    var stats = await sender.getStats();
    var sendReport = { outbound: null, inbound: null };

    stats.forEach(report => {

        if (report.type === 'outbound-rtp') {

            if( report.mediaType == 'video' ){
                var now = report.timestamp;
                var bytes = report.bytesSent;
                var headerBytes = report.headerBytesSent;

                var packets = report.packetsSent;
                if (lastResult && lastResult.has(report.id)) {
                    // calculate bitrate
                    var bitrate = Math.floor(8 * (bytes - lastResult.get(report.id).bytesSent) /
                        (now - lastResult.get(report.id).timestamp));

                    //var headerrate = Math.floor(8 * (headerBytes - lastResult.get(report.id).headerBytesSent) /
                    //    (now - lastResult.get(report.id).timestamp));

                    var packetrate = Math.floor(1000 * (packets - lastResult.get(report.id).packetsSent) /
                        (now - lastResult.get(report.id).timestamp));
                    //console.log(`Bitrate ${bitrate}kbps, overhead ${headerrate}kbps, ${packetrate} packets/second`);

                    sendReport.outbound = { 
                        Bitrate: bitrate + "kbps", 
                        // overhead: headerrate + "kbps", 
                        packetrate: packetrate + "packets/second"
                    };
                }
            }
        }

        if (report.type === 'remote-inbound-rtp') {

            if( report.kind == 'video' ){
                const jitter = parseFloat( report.jitter ).toFixed(3); 
                const packetsLost = report.packetsLost; 

                sendReport.inbound = { 
                    jitter: jitter, 
                    packetsLost: packetsLost, 
                };
            }
        }
    });
    console.log(sendReport);
    INFO.stats( JSON.stringify(sendReport) );
    return stats;
}

function defineBandwidth(){
    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
    if (!sender) {
        return;
    }
    const parameters = sender.getParameters();
    if (!parameters.encodings) { // Firefox workaround.
      parameters.encodings = [{}];
    }

    if (bandwidth === 'unlimited') {
      delete parameters.encodings[0].maxBitrate;
    } else {
      parameters.encodings[0].maxBitrate = bandwidth * 1000;
    }
    sender.setParameters(parameters)
        .then(() => {
          //bandwidthSelector.disabled = false;
        })
        .catch(e => console.error(e));
}