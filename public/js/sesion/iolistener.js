// SOCKETS LISTENERS
function ioListener(io){
    // Hellow
    io.on('hello', function(data) {
        console.log(data);
        if( data.type == 'coach' && data.open == true ){
            document.querySelector('.startCall').style.display = 'block';
            document.querySelector('.waitfor').style.display = 'none';
        }
    });
    // Peer close
    io.on('exit', function(data) {
        console.log("Se desconecto: ", data);
    });
    // Peer disconnected IO
    io.on('fall', function(data) {
        console.log("Se desconecto: ", data);
    });
    // Enable room to call
    io.on('open_room', function(data) {
        if( data.type == 'coach' ){
            document.querySelector('.startCall').style.display = 'block';
            document.querySelector('.waitfor').style.display = 'none';
        }
    });
    // Start call conecction
    io.on('call_start', function(data){
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

function setBandwidth(sdp) {
    //sdp = sdp.replace(/a=mid:audio\r\n/g, 'a=mid:audio\r\nb=AS:' + audioBandwidth + '\r\n');
    console.log(sdp);
    // sdp = sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:' + 250 + '\r\n');
    sdp += "a=fmtp:100 x-google-max-bitrate=500\r\n";
    console.log("-------------------------------------------")
    console.log(sdp);

    return sdp;
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
