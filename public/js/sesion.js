

var videoLocal = document.querySelector("#videoLocal");
var videoRemote = document.querySelector("#videoRemote");
var signalingArea = document.querySelector("#signalingArea");
var btnMicro = document.querySelector('#btnMicro');
var btnHungup = document.querySelector('#btnHungup');
var btnVideo = document.querySelector('#btnVideo');

var testplay = document.querySelector('#play');
play.addEventListener('click', function(){
    send("hola btn play");
    videoRemote.play();
    displaySignalMessage("press Play button");
})

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
var config = {
    'iceServers': [
        {
            'url': 'stun:stun.deiby.xyz:5349'
        },
        {
            'url': 'stun:stun.deiby.xyz:3478'
        },
        {
            urls: 'turn:turn.deiby.xyz:5349',
            username: 'guest',
            credential: 'mipassword'
        },
        {
            urls: 'turn:turn.deiby.xyz:3478',
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
            //var description = data.message;
            console.log("DESCRIPTION.TYPE: ", description.type);
            console.log("PC.SIGNALINGSTATE: ", pc.signalingState);
            console.log("MAKINGOFFER: ", makingOffer);
            const offerCollision = (description.type == 'offer') && (makingOffer || pc.signalingState != 'stable');
            console.log("OFFERCOLLISION: ", offerCollision);
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
                console.log("ANSWER", answer);
                await pc.setLocalDescription(answer);
                io.emit('signal', {description: pc.localDescription, room: SIGNAL_ROOM});
              }
            
        }else if(candidate){
            try{
                //console.log("CANDIDATE", candidate);
                await pc.addIceCandidate(candidate);
            }catch(err){
                console.log("ERROR CANDIDATE", candidate);
                displaySignalMessage(err.message);
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
    
    pc.onicecandidate = (event) => {
        if (event.candidate){
            displaySignalMessage("Signal send: " + event.candidate);
            io.emit('signal', {candidate: event.candidate, room: SIGNAL_ROOM});
        }
    };

    pc.oniceconnectionstatechange= (event) => {
        console.log("ICE CHANGE ", event);
    }
    
    pc.onnegotiationneeded = function(){
        if( polite == false ){
            makingOffer = true;
            pc.createOffer()
            .then(function(offer){
                if (pc.signalingState != "stable") return;
                console.log("MAKE OFFERT", offer);
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
    
    
    pc.ontrack = ({track, streams}) => {
        // once media for a remote track arrives, show it in the remote video element
        displaySignalMessage("Recibiendo stream");
        track.onunmute = function(){
            // don't set srcObject again if it is already set.
            if (videoRemote.srcObject) return;
            videoRemote.srcObject = streams[0];
        };
        signalingFinalizeSuccess();
    };

    

    pc.onerror = function(err){
        displaySignalMessage("PC ERROR: " + err.message);
        console.log(err);
    }
    
    // get a local stream, show it in our video tag and add it to be sent
    //pc.addStream(localStream);

    function dataChannelMessage(data){
        console.log("datachannelReceive", data);
        displaySignalMessage(data.data);
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
        //var streams = pc.getLocalStreams();
        //for( var stream of streams ){
            for( var audioTrack of localStream.getAudioTracks() ){ // stream.getAudioTracks() ){
                if( audioTrack.enabled ){
                    btnMicro.classList.add('active');
                }else{
                    btnMicro.classList.remove('active');
                }
                audioTrack.enabled = !audioTrack.enabled;
            }
        //}
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
    displaySignalMessage("Togle video click");
    
    if( pc !== null ){
        // var streams = pc.getLocalStreams();
        // displaySignalMessage("Streams: " + streams.length);
        // for( var stream of streams ){
            for( var videoTrack of localStream.getVideoTracks() ){ // stream.getVideoTracks() ){
                displaySignalMessage("VideoTrack change: " + videoTrack.enabled.toString());
                if( videoTrack.enabled ){
                    btnVideo.classList.add('active');
                }else{
                    btnVideo.classList.remove('active');
                }
                videoTrack.enabled = !videoTrack.enabled;
            }
        // }
    }
    
    // localStream.getVideoTracks()[0].enabled = ! localStream.getVideoTracks()[0].enabled;
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


