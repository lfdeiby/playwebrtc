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
        call();
    });
}

async function call(){
    if( me.type == 'coach'){
        pc = createPeerConnection();

        localStream.getTracks().forEach(function( track ){
            pc.addTrack(track, localStream);
        });

        const offer = await pc.createOffer(sdpConstraints);

        await pc.setLocalDescription(offer);

        io.emit('message', {
            type: 'offer',
            sdp: offer.sdp,
            signal_room: SIGNAL_ROOM
        });
    }
}

