/***
 * @import handlerbuttons.js
 * @import iolistener.js
 * @import iosignaling.js
 * @import createpeer.js
*/

// GLOBAL VARIABLES
io = io.connect();
var localStream;
var screenShare;
var pc;
var sdpConstraints = { offerToReceiveAudio: true, offerToReceiveVideo: true };

var configMediaStream = {
    audio: true, 
    video: {
        width: 640, //width: 640,//height: 480,
        frameRate: 15,
        facingMode: 'user',
        //maxBitrate: 125
    }
};
/*
if( me.type == 'coach'){
var configMediaStream = {
    audio: true, 
    video: {
        width: 360, //width: 640,//height: 480,
        frameRate: 15,
        facingMode: 'user',
        //maxBitrate: 125
    }
};
}else{
var configMediaStream = {
    audio: true, 
    video: {
        width: 640, //width: 640,//height: 480,
        frameRate: 15,
        facingMode: 'user'
    }
};
}
*/
var videoLocal = document.querySelector("#videoLocal");
var videoRemote = document.querySelector("#videoRemote");
var signalingArea = document.querySelector("#signalingArea");


function enableRoom(){
    getUserMedia()
    .then(function(stream){
        localStream = stream;
        io.emit('open', {"signal_room": SIGNAL_ROOM, "user_id": me.id, 'type': me.type, 'name': me.name});
        document.querySelector('.enableroom').style.display = 'none';
        document.querySelector('.waitfor').style.display = 'block';
    })
    .catch(function(err) {
         alert("No hemos podido acceder a la camara\npor favor vuelva a cargar la página y permita el acceso.");
         console.log(err);
    });
}

function handlerStartCall(){
    getUserMedia()
    .then(function(stream){
        localStream = stream;
        io.emit('call', {"signal_room": SIGNAL_ROOM});
    })
    .catch(function(err) {
         alert("No hemos podido acceder a la camara\npor favor vuelva a cargar la página y permita el acceso.");
         console.log(err);
    });
}


async function getUserMedia(callback){
    var stream = await navigator.mediaDevices.getUserMedia(configMediaStream)
    
    videoLocal.autoplay = true;
    videoLocal.muted = true;
    videoLocal.srcObject = stream;
    document.querySelector('.local').classList.add('active');
    return stream;
}

function closePeerConnection(){
    if( pc != null ){
        pc.close();
    }
    pc = null;
    io.emit('bye', {"signal_room": SIGNAL_ROOM, "user_id": me.id});
}

function displaySignalMessage(message) {
    signalingArea.innerHTML = signalingArea.innerHTML + "<br/>" + message;
}

window.addEventListener('beforeunload', function(){
    if( pc != undefined){
        io.emit('bye', {"signal_room": SIGNAL_ROOM, "user_id": me.id});
    }
});



// INIT
function init(){
    io.emit('ready', {"signal_room": SIGNAL_ROOM, "user_id": me.id, 'type': me.type, 'name': me.name});

    if( me.type == 'coach'){
        var btnEnableRoom = document.querySelector('#enableRoom');
        btnEnableRoom.addEventListener('click', enableRoom);
        btnShare = document.getElementById('btnShare');
        btnShare.addEventListener('click', handlerShareScreen);
    }else{
        var btnStartCall = document.getElementById('startCall');
        btnStartCall.addEventListener('click', handlerStartCall);
    }

    ioListener(io);
    ioSignaling(io);
}