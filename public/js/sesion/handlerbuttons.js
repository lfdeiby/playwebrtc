// DOM ELEMENTS
var btnShare = null;
var btnMicro = document.querySelector('#btnMicro');
var btnHungup = document.querySelector('#btnHungup');
var btnVideo = document.querySelector('#btnVideo');
var btnFinalize = document.querySelector('#btnFinalize');


// LISTENER TO DOM ELEMENTS
btnMicro.addEventListener('click', handlerMicrophone);
btnHungup.addEventListener('click', handlerHungup);
btnVideo.addEventListener('click', handlerVideo);
btnFinalize.addEventListener('click', handlerFinalize);



// HANDLERS BUTTONS EVENT
function handlerMicrophone(){
    if( pc !== null ){
        for( var audioTrack of localStream.getAudioTracks() ){ // stream.getAudioTracks() ){
            if( audioTrack.enabled ){
                btnMicro.classList.add('active');
                //INFO.microphone('deactive');
            }else{
                btnMicro.classList.remove('active');
                //INFO.microphone('active');
            }
            audioTrack.enabled = !audioTrack.enabled;
        }
    }
    return false;
}

function handlerVideo(){
    if( pc !== null ){
        for( var videoTrack of localStream.getVideoTracks() ){ // stream.getVideoTracks() ){
            displaySignalMessage("VideoTrack change: " + videoTrack.enabled.toString());
            if( videoTrack.enabled ){
                btnVideo.classList.add('active');
                //INFO.video('deactive');
            }else{
                btnVideo.classList.remove('active');
                //INFO.video('active');
            }
            videoTrack.enabled = !videoTrack.enabled;
        }
    }
    return false;
}

function handlerHungup(){
   $('#popupFinalize').addClass('active');
    return false;
}

function handlerFinalize(){
    io.emit('bye', {"signal_room": SIGNAL_ROOM, "user_id": me.id});
    if( pc !== null ){
        displaySignalMessage("Send close connection");
        closePeerConnection();
    }
    //INFO.hungup();
    finalizeSesion();
}

function finalizeSesion(){
    var url = "/sesion/" + SIGNAL_ROOM + '/finalizada';
    window.location.href = url;
}

async function handlerShareScreen(){
    if (screenShare) {
        screenShare.getTracks().forEach(t => t.stop());
        closeShareScreen();
        return;
    }
    const stream = await navigator.mediaDevices.getDisplayMedia({video: true});
    const track = stream.getVideoTracks()[0];
    replaceVideoTrack(track);
    videoLocal.srcObject = stream;
    track.addEventListener('ended', () => {
        // 'Screensharing ended via the browser UI'
        closeShareScreen();
    });
    screenShare = stream;
    btnShare.classList.add('active');
}

function closeShareScreen(){
    screenShare = null;
    videoLocal.srcObject = localStream;
    replaceVideoTrack(localStream.getVideoTracks()[0]);
    btnShare.classList.remove('active');
}

function replaceVideoTrack(withTrack) {
    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
    if (sender) {
        sender.replaceTrack(withTrack);
    }
}
