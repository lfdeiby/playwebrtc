/***
 * @import handlerbuttons.js
 * @import iolistener.js
 * @import iosignaling.js
 * @import createpeer.js
*/

// GLOBAL VARIABLES
io = io.connect();
var localStream;
var remoteStream;
var screenShare;
var pc;
var sdpConstraints = { offerToReceiveAudio: true, offerToReceiveVideo: true, iceRestart: true };
var configMediaStream = {
    audio: true, 
    video: {
        width: 360, //width: 640,//height: 480,
        frameRate: 15,
        facingMode: 'user'
    }
};
// console.log(configMediaStream);
var videoLocal = document.querySelector("#videoLocal");
var videoRemote = document.querySelector("#videoRemote");
var signalingArea = document.querySelector("#signalingArea");


function enableRoom(){
    getUserMedia()
    .then(function(stream){
        localStream = stream;
        io.emit('open', {"signal_room": SIGNAL_ROOM, "user_id": me.id, 'type': me.type, 'name': me.name});
        POPUP.closeAll();
        POPUP.doctorWait(other, SIGNAL_ROOM);
        INFO.habilitar_sala();
    })
    .catch(notAccessToCam);
}

function handlerStartCall(){
    getUserMedia()
    .then(function(stream){
        localStream = stream;
        io.emit('call', {"signal_room": SIGNAL_ROOM});
        INFO.start_call();
    })
    .catch(notAccessToCam);
}

function notAccessToCam(error){
    if( error.message == 'Invalid constraint'){
        if( configMediaStream.video.width == 360 ){
            configMediaStream.video.width = 640;
            if( me.type == 'coach' ){
                enableRoom();
            }else{
                handlerStartCall();
            }
            return;
        }
    }
    INFO.camera_error(error.message);
    alert(error.message + ": No hemos podido acceder a la camara\npor favor vuelva a cargar la página y permita el acceso.");
}


async function getUserMedia(){
    var stream = await navigator.mediaDevices.getUserMedia(configMediaStream);
    
    videoLocal.autoplay = true;
    videoLocal.muted = true;
    videoLocal.srcObject = stream;
    document.querySelector('.local').classList.add('active');

/*
    pc = new RTCPeerConnection(config);
    pc.onicecandidate = function(event){
        console.log("GATH STATE: " + event.target.iceGatheringState  , event.candidate);
    }
*/
    return stream;
}
/*
function handleChannel(chanel){
    chanel.onerror = function(err){console.log("Error", err);}
    chanel.onclose = function(evt){console.log("Close", evt);}
    chanel.onopen = function(evt){console.log("Open"); chanel.send("hola Peer");}
    chanel.onmessage = function(msg){console.log(msg.data);}
}
*/
function closePeerConnection(){
    console.log("CLOSE PEER CONECCTION");
    if( pc != null ){
        pc.close();
    }
    pc = null;
}

window.addEventListener('beforeunload', function(){
    if( pc != undefined){
        io.emit('bye', {"signal_room": SIGNAL_ROOM, "user_id": me.id});
    }
});

function updateOnlineStatus(event) {
    var condition = navigator.onLine ? "online" : "offline";

    if( navigator.onLine ){
        MODAL.closeOffline();
        reconnectOnOnline();
        INFO.error_offline("paso de offline a online");
    }else{
        MODAL.offline();
        closePeerConnection();
    }
}

function reconnectOnOnline(){
    MODAL.reconnect();
    setTimeout(function(){
        io = io.connect();
        var info =  {"signal_room": SIGNAL_ROOM, "user_id": me.id, 'type': me.type, 'name': me.name, 'open': true};
        io.emit('ready', info);
        if( me.type == 'coach' ){
            call();
        }else{
            io.emit('call', {"signal_room": SIGNAL_ROOM});
        }
    }, 1500);
}

window.addEventListener('online',  updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

function verifyReloadPage(){
    var info =  {
        "signal_room": SIGNAL_ROOM,
        "user_id": me.id,
        'type': me.type,
        'name': me.name
    };

    if( localStorage.getItem(SIGNAL_ROOM) ){
        info['open'] = true;
        io.emit('ready', info);
        if( me.type == 'coach' ){
            getUserMedia()
            .then(function(stream){
                localStream = stream;
                call();
            })
            .catch(notAccessToCam);
        }else{
            getUserMedia()
            .then(function(stream){
                localStream = stream;
                io.emit('call', {"signal_room": SIGNAL_ROOM});
            })
            .catch(notAccessToCam);
        }
    }else{
        io.emit('ready', info);
        if( me.type == 'coach' ){
            POPUP.doctorEnter();
        }else{
            POPUP.pacientWait(other, SIGNAL_ROOM);
        }
    }
}


function verifyBrowser(){
    INFO.browser(window.navigator.userAgent);
    if( adapter.browserDetails.browser.indexOf('Not a supported') > 0){
        POPUP.browserNotSupport();
        INFO.error_browser(window.navigator.userAgent);
        return false;
    }
    if( ('ontouchstart' in document.documentElement ) == false ){
        if( me.type == 'coach'){
            btnShare = document.getElementById('btnShare');
            btnShare.addEventListener('click', handlerShareScreen);
            document.getElementById('btnShare').style.display = 'block';
        }
    }
    return true;
}

// INIT
function init(){

if( verifyBrowser() ){
    ioListener(io);
    ioSignaling(io);
    verifyReloadPage();
}

}

