// SOCKETS LISTENERS
function ioListener(io){
    /*
    io.on('info', function(data) {
        console.log("CHECK", data);
    });
    */

    // Hellow
    io.on('hello', function(data) {
        if( data.type == 'coach' && data.open == true ){
            POPUP.closeAll();
            POPUP.pacientEnter(other)
        }
    });
    // Hellow
    io.on('duplicate', function(data) {
        INFO.duplicate();
        console.log(data);
        
    });
    // Peer close
    io.on('exit', function(data) {
        INFO.disconnect();
        MODAL.leaveroom(data);
        closePeerConnection();
    });
    // Finalize sesion
    io.on('finalize', function(data) {
        MODAL.finalize();
        localStorage.removeItem(SIGNAL_ROOM);
        if( pc !== null ){
            closePeerConnection();
        }
    });
    // Enable room to call
    io.on('open_room', function(data) {
        if( data.type == 'coach' ){
            POPUP.closeAll();
            POPUP.pacientEnter(other);
        }
    });
    // Start call conecction
    io.on('call_start', function(data){
        MODAL.connect();
        if( pc ){
            makeOffer(true);
        }else{
            call();
        }
    });
}

async function call(){
    if( me.type == 'coach'){
        createPeerConnection();

        localStream.getTracks().forEach(function( track ){
            pc.addTrack(track, localStream);
        });
        //pc.addStream(localStream);

        await makeOffer(false);
    }
}

async function makeOffer(iceRestart){
    if( iceRestart ){
        sdpConstraints.iceRestart  = true;
    }

    let offer = await pc.createOffer(sdpConstraints);

    //offer.sdp += "m=audio 54312 RTP/AVP 101";
    //offer.sdp += "a=rtpmap:101 opus/48000/2";
    //offer.sdp += "a=fmtp:101 maxplaybackrate=16000; sprop-maxcapturerate=16000";
    //offer.sdp = _useOPUSCodec(offer.sdp);
    //console.log(offer.sdp);
    INFO.offer(offer.sdp);

    await pc.setLocalDescription(offer);

    io.emit('message', {
        type: 'offer',
        sdp: offer.sdp,
        signal_room: SIGNAL_ROOM
    });
}

/*
function _useOPUSCodec(sdp){
    var custom_sdp = sdp;
    custom_sdp += "m=audio 54312 RTP/AVP 101";
    custom_sdp += "a=rtpmap:101 opus/48000/2";
    custom_sdp += "a=fmtp:101 maxplaybackrate=16000; sprop-maxcapturerate=16000";
    return custom_sdp;
}
*/