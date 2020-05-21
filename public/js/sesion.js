

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
var config = {
    'iceServers': [
        {
            'url': 'stun:stun.deiby.xyz:5349'
        },
        {
            urls: 'turn:turn.deiby.xyz:5349',
            username: 'guest',
            credential: 'mipassword'
        }
    ]
};
var configMediaStream = {
    audio: true, 
    video: {
        width: 640,
        height: 480,
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
    document.querySelector('.enableroom').style.display = 'none';
    document.querySelector('.waitfor').style.display = 'block';
    polite = true;
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
    startSignaling();
})

io.on('problemas', function(data){
    alert(data.message);
});


// El usuario 2 empieza la llamada con el emtodo startCall

function startCall(){
    io.emit('call', {"signal_room": SIGNAL_ROOM});
}

let makingOffer = false;
let ignoreOffer = false;

io.on('signaling_message', async (data) => {

    displaySignalMessage("Signal received: " + data.type);

    try{
        if (data.type == "description" && data.message ) {

            var description = data.message;
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
                await pc.setLocalDescription();
                io.emit('signal', {
                    'type': 'description',
                    'message': pc.localDescription,
                    'room': SIGNAL_ROOM
                });
            }
            
        }else if( data.type == 'candidate' && data.message ){
            try{
                var candidate = JSON.parse(data.message.candidate);
                console.log("CANDIDATE", candidate);
                await pc.addIceCandidate(candidate);
            }catch(err){
                console.log(err.message);
                if(!ignoreOffer){
                    throw err;
                }
            }
        }
    }catch(err){
        console.log(err.message);
    }
});


function startSignaling() {
    displaySignalMessage("starting signaling...");

    pc = new RTCPeerConnection(config);

    if( polite == false ){
        dataChannel = pc.createDataChannel('chat', null);
        dataChannel.onopen = function(){
            if( dataChannel.readyState == 'open' ){
                displaySignalMessage("Data Channel is ready");
                dataChannel.onmessage = dataChannelMessage;
            }
        }
    }else {
        pc.ondatachannel = function(event){
            dataChannel = event.channel;
            dataChannel.onmessage = dataChannelMessage;
        }
    }
    
    pc.onicecandidate = (event) => {
        if (event.candidate)
            displaySignalMessage("Signal send: " + event.candidate);
            console.log("signal send:",  event.candidate);
            io.emit('signal', {
                "type": 'candidate',
                "message": {
                    candidate: JSON.stringify(event.candidate)
                },
                "room":SIGNAL_ROOM
            }
        );
        displaySignalMessage("completed that ice candidate..." + event.target.iceGatheringState);
    };
    
    pc.onnegotiationneeded = async () => {
        try{
            makingOffer = true;
            await pc.setLocalDescription();
            io.emit('signal', {
                'type': 'description',
                'message': pc.localDescription,
                "room":SIGNAL_ROOM
            });
        }catch(err){
            console.log(err);
        }finally{
            makingOffer = false;
        }
    }

    pc.oniceconnectionstatechange = (evt) => {
        displaySignalMessage("ICE connection state change: " + evt.target.iceConnectionState);
        if (pc.iceConnectionState === "failed") {
            pc.restartIce();
        }
    };
    
    // once remote stream arrives, show it in the remote video element
    pc.onaddstream =  function (event) {
        videoRemote.srcObject = event.stream;
        signalingFinalizeSuccess();
        console.log("recibiendo el stream");
    };
    
    // get a local stream, show it in our video tag and add it to be sent
    pc.addStream(localStream);

    function dataChannelMessage(data){
        console.log("datachannelReceive", data);
        displaySignalMessage(data);
    }

}

/* METODS AUXILIARES */

// Metodo para arrancar la camara
async function start(){
    try {
        const stream = await navigator.mediaDevices.getUserMedia(configMediaStream);
        localStream = stream;
        videoLocal.autoplay = true;
        videoLocal.muted = true;
        videoLocal.srcObject = stream;
        document.querySelector('.local').classList.add('active');
    } catch(err) {
        alert("No hemos podido acceder a la camara\npor favor vuelva a cargar la página y permita el acceso.");
        console.error(err.message);
    }
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
        var streams = pc.getLocalStreams();
        for( var stream of streams ){
            for( var audioTrack of stream.getAudioTracks() ){
                if( audioTrack.enabled ){
                    btnMicro.classList.add('active');
                }else{
                    btnMicro.classList.remove('active');
                }
                audioTrack.enabled = !audioTrack.enabled;
            }
        }
    }
    return false;
}

function hungupAction(){
    if( pc !== null ){

    }
    return false;
}

function toggleVideoAction(){
    if( pc !== null ){
        var streams = pc.getLocalStreams();
        for( var stream of streams ){
            for( var videoTrack of stream.getVideoTracks() ){
                if( videoTrack.enabled ){
                    btnVideo.classList.add('active');
                }else{
                    btnVideo.classList.remove('active');
                }
                videoTrack.enabled = !videoTrack.enabled;
            }
        }
    }
    return false;
}

function displaySignalMessage(message) {
    signalingArea.innerHTML = signalingArea.innerHTML + "<br/>" + message;
}


