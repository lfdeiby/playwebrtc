
var videoLocal = document.querySelector("#videoLocal");
var videoRemote = document.querySelector("#videoRemote");
var signalingArea = document.querySelector("#signalingArea");
var btnMicro = document.querySelector('#btnMicro');
var btnHungup = document.querySelector('#btnHungup');
var btnVideo = document.querySelector('#btnVideo');

btnMicro.addEventListener('click', toggleMicrophoneAction);
btnHungup.addEventListener('click', hungupAction);
btnVideo.addEventListener('click', toggleVideoAction);

var localStream;
/*
var config = {
    iceServers: [
        {
            urls: [ "stun:sp-turn1.xirsys.com" ]
        }, 
        {
            username: "QZnwvjPLo6gHW-s7AWLLl_3XqTiUQMQTReHxgyMyy0FwI3rU-XBCEAFxkc6MxIrpAAAAAF7HR6tsZmRlaWJ5",
            credential: "c8e5a8ee-9bdc-11ea-9f7e-0242ac140004",
            urls: [
               "turn:sp-turn1.xirsys.com:80?transport=udp",
               "turn:sp-turn1.xirsys.com:3478?transport=udp",
               "turn:sp-turn1.xirsys.com:80?transport=tcp",
               "turn:sp-turn1.xirsys.com:3478?transport=tcp",
               "turns:sp-turn1.xirsys.com:443?transport=tcp",
               "turns:sp-turn1.xirsys.com:5349?transport=tcp"
            ]
        }
    ]
};
*/

var configMediaStream = {
    audio: true, 
    video: {
        width: 360,
        //width: 640,
        //height: 480,
        frameRate: 15
    }
};

var pc;
var dataChannel;
var polite = false;
var sdpConstraints = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
};

io = io.connect();

function init(){
    if( me.type == 'coach'){
        var btnEnableRoom = document.querySelector('#enableRoom');
        btnEnableRoom.addEventListener('click', enableRoomAction);
    }else{
        var btnStartCall = document.getElementById('startCall');
        btnStartCall.addEventListener('click', startCall);
    }

    if( me.type == 'client' ){
        io.emit('ready', {"signal_room": SIGNAL_ROOM, "user_id": me.id, 'type': me.type, 'name': me.name});
    }
}

// Metodos son para informar que el usuario 1 y 2 ya estan disponibles para empezar la comunicación
function enableRoomAction(){
    io.emit('ready', {"signal_room": SIGNAL_ROOM, "user_id": me.id, 'type': me.type, 'name': me.name});
}

io.on('polite', function(data) {
    polite = true;
    document.querySelector('.enableroom').style.display = 'none';
    document.querySelector('.waitfor').style.display = 'block';
    start();
    displaySignalMessage("Registrado como Polite <br>");
});

io.on('impolite', function(data) {
    polite = false;
    start();
    displaySignalMessage("Registrado como Impolite <br>");
});

io.on('join', function(data) {
    if( data.type == 'coach' ){
        document.querySelector('.startCall').style.display = 'block';
        document.querySelector('.waitfor').style.display = 'none';
    }else if( data.type == 'client'){
        io.emit('client_reconect', {"signal_room": SIGNAL_ROOM, "user_id": me.id, 'type': me.type, 'name': me.name});
    }
});

io.on('call_start', function(data){
    displaySignalMessage("Start Signal Process");
    startSignaling();
})

io.on('problemas', function(data){
    alert(data.message);
});

// El usuario 2 empieza la llamada con el emtodo startCall
function startCall(){
    io.emit('call', {"signal_room": SIGNAL_ROOM});
}

var makingOffer = false;
var ignoreOffer = false;

io.on('signaling_message', async ({data: {description, candidate}}) => {
    displaySignalMessage("Signal received");
    try{
        if (description){
            const offerCollision = (description.type == 'offer') && (makingOffer || pc.signalingState != 'stable');
            ignoreOffer = !polite && offerCollision;
            if( ignoreOffer )
                return;
            if (offerCollision) {
                await Promise.all([
                    pc.setLocalDescription({type: "rollback"}),
                    pc.setRemoteDescription(description)
                ]);
            } else {
                await pc.setRemoteDescription(description);
            }
            if( description.type == "offer" ){
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                io.emit('signal', {description: pc.localDescription, room: SIGNAL_ROOM});
            }
        }else if(candidate){
            try{
                await pc.addIceCandidate(candidate);
            }catch(err){
                displaySignalMessage(err.message);
                if(!ignoreOffer){
                    throw err;
                }
            }
        }
    }catch(err){
        console.log(err.message);
        INFO.error_signaling(err.message);
    }
});
console.log("DESDE SESION:JS");
console.log(config);
function startSignaling() {
    displaySignalMessage("starting signaling...");

    pc = new RTCPeerConnection(config);

    for (const track of localStream.getTracks()) {
      pc.addTrack(track, localStream);
    }

    if( polite == false ){
        dataChannel = pc.createDataChannel('chat', null);
        dataChannel.onopen = function(){
            if( dataChannel.readyState == 'open' ){
                displaySignalMessage("Data Channel is ready");
                dataChannel.onmessage = dataChannelMessage;
                dataChannel.onclose = function(){ displaySignalMessage("Remote close conection"); closePeerConnection(); }
            }
        }
    }else {
        pc.ondatachannel = function(event){
            dataChannel = event.channel;
            dataChannel.onmessage = dataChannelMessage;
            dataChannel.onclose = function(){ displaySignalMessage("Remote close conection"); closePeerConnection(); }
        }
    }
    
    pc.onicecandidate = function(event){
        if (event.candidate){
            displaySignalMessage("Signal send: " + event.candidate);
            io.emit('signal', {candidate: event.candidate, room: SIGNAL_ROOM});
        }
    };

    pc.oniceconnectionstatechange = function(event){
        console.log("ICE CHANGE ", pc.iceConnectionState, event);
    }
    
    pc.onnegotiationneeded = function(){
        if( polite == false ){
            makingOffer = true;
            pc.createOffer(sdpConstraints)
            .then(function(offer){
                if (pc.signalingState != "stable") return;
                return pc.setLocalDescription(offer);
            })
            .then(function(){
                io.emit('signal', {description: pc.localDescription, room: SIGNAL_ROOM});
            })
            .catch(function(err){
                displaySignalMessage("ERROR OFFER", err.message);
            });
        }
    }

    pc.oniceconnectionstatechange = function(evt){
        displaySignalMessage("ICE connection state change: " + evt.target.iceConnectionState);
        if (pc != null && pc.iceConnectionState === "failed") {
            pc.restartIce();
        }
    };

    pc.onaddstream =  function (event) {
        videoRemote.srcObject = event.stream;
        signalingFinalizeSuccess();
    };
    
    pc.ontrack = ({track, streams}) => {
        track.onunmute = () => {
            if (videoRemote.srcObject) return;
            videoRemote.srcObject = streams[0];
        };
        signalingFinalizeSuccess();
    };

    pc.onerror = function(err){
        displaySignalMessage("PC ERROR: " + err.message);
        console.log(err);
    }

    function dataChannelMessage(data){
        console.log("datachannelReceive", data);
        displaySignalMessage(data);
    }

}

/* METODS AUXILIARES */
// Metodo para arrancar la camara
async function start(){
    const stream = await navigator.mediaDevices.getUserMedia(configMediaStream)
    .then(function(stream){
        localStream = stream;
        videoLocal.autoplay = true;
        videoLocal.muted = true;
        videoLocal.srcObject = stream;
        document.querySelector('.local').classList.add('active');
    }).catch(function(err) {
        alert("No hemos podido acceder a la camara\npor favor vuelva a cargar la página y permita el acceso.");
        console.error(err.message);
    });
}
// Envia un mensaje por dataChannel
function send(text){
    if( dataChannel ){
        dataChannel.send(text);
    }
}

function signalingFinalizeSuccess(){
    document.querySelector('.signal').style.display = 'none';
    document.querySelector('.remote').classList.add('active');
    document.querySelector('.local').classList.add('mini');
    btnMicro.disabled = false;
    btnVideo.disabled = false;
    btnHungup.disabled = false;
}

function toggleMicrophoneAction(){
    if( pc !== null ){
        for( var audioTrack of localStream.getAudioTracks() ){
            if( audioTrack.enabled ){
                btnMicro.classList.add('active');
                INFO.microphone('deactive');
            }else{
                btnMicro.classList.remove('active');
                INFO.microphone('active');
            }
            audioTrack.enabled = !audioTrack.enabled;
        }
    }
    return false;
}

function hungupAction(){
    if( pc !== null ){
        displaySignalMessage("Send close connection");
        closePeerConnection();
    }
    return false;
}

function toggleVideoAction(){
    if( pc !== null ){
        for( var videoTrack of localStream.getVideoTracks() ){
            displaySignalMessage("VideoTrack change: " + videoTrack.enabled.toString());
            if( videoTrack.enabled ){
                btnVideo.classList.add('active');
                INFO.video('deactive');
            }else{
                btnVideo.classList.remove('active');
                INFO.video('active');
            }
            videoTrack.enabled = !videoTrack.enabled;
        }
    }
    return false;
}

function closePeerConnection(){
    if( pc != null ){
        pc.close();
    }
    pc = null;
    dataChannel = null;
    makingOffer = false;
    ignoreOffer = false;
}

function displaySignalMessage(message) {
    signalingArea.innerHTML = signalingArea.innerHTML + "<br/>" + message;
}


