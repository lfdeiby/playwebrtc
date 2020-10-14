// SOCKETS LISTENERS
function ioListener(io){

    io.on('info', function(data) {
        console.log("CHECK", data);
    });

    // Hellow
    io.on('hello', function(data) {
        console.log(data);
        if( data.type == 'coach' && data.open == true ){
            POPUP.closeAll();
            POPUP.pacientEnter(other)
            //document.querySelector('.startCall').style.display = 'block';
            //document.querySelector('.waitfor').style.display = 'none';
        }
    });
    // Hellow
    io.on('duplicate', function(data) {
        alert("Usuario duplicado");
        console.log(data);
        
    });
    // Peer close
    io.on('exit', function(data) {
        console.log("Se desconecto: ", data);
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
