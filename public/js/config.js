var pc;

var btnConfig = document.querySelector("#btnConfig");
btnConfig.addEventListener('click', toggleConfig);
var popupConfig = document.getElementById("popupConfig");

var videoInputElem = document.querySelector('#videoInput');
var audioInputElem = document.querySelector('#audioInput');

videoInputElem.addEventListener('change', changeDevice);
audioInputElem.addEventListener('change', changeDevice);

var localStream = null;
var videoLocal = document.querySelector("#videoLocal");

function toggleConfig(){
	popupConfig.classList.toggle('active');
	return false;
}

function initSources(){
	if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
	  alert("enumerateDevices() not supported.");
	  return;
	}

	navigator.mediaDevices.enumerateDevices()
	.then(function(devices) {
  		devices.forEach(function(device) {
  			if( device.kind == 'videoinput' ){
  				var html = `<option value="${ device.deviceId }">${ device.label }</option>`;
  				$(videoInputElem).append(html);
  			}
  			if( device.kind == 'audioinput' ){
  				var html = `<option value="${ device.deviceId }">${ device.label }</option>`;
  				$(audioInputElem).append(html);
  			}
	  	});
	    mediaStream(null);
	})
	.catch(function(err) {
  		console.log(err.name + ": " + err.message);
	});
}

async function mediaStream(type){
	var configMediaStream = {
	    audio: { 
	    	deviceId: audioInputElem.value 
	    }, 
	    video: {
	    	deviceId: videoInputElem.value,
	    	facingMode: 'user',
	        width: 360,
	        frameRate: 15
		}
	};

	const stream = await navigator.mediaDevices.getUserMedia(configMediaStream)
	    .then(defineStream)
	    .then(refreshSender(type))
	    .catch(errorNotAccessCamera);
}

function defineStream(stream){
	localStream = stream;
    videoLocal.autoplay = true;
    videoLocal.muted = false;
    videoLocal.srcObject = stream;
    document.querySelector('.local').classList.add('active');
}

function refreshSender(type){
	if( pc != undefined && pc != null ){
		if( type == 'video' ){
			refreshSenderVideo();
		}else if( type == 'audio' ){
			refreshSenderAudio();
		}
	}
}

function refreshSenderVideo(){
	console.log("Refresh Video");
	var videoTrack = localStream.getVideoTracks()[0];
	var sender = pc.getSenders().find(function(s) {
    	return s.track.kind == videoTrack.kind;
  	});
  	if ( sender ) {
  		console.log('found sender video:', sender);
  		sender.replaceTrack(videoTrack);
  	}
}

function refreshSenderAudio(){
	console.log("Refresh Audio");
	var audioTrack = localStream.getAudioTracks()[0];
	var sender = pc.getSenders().find(function(s) {
    	return s.track.kind == audioTrack.kind;
  	});
  	if ( sender ) {
  		console.log('found sender video:', sender);
  		sender.replaceTrack(audioTrack);
  	}
}

function errorNotAccessCamera(err){
	alert("No hemos podido acceder a la camara\npor favor vuelva a cargar la página y permita el acceso.");
    console.error(err.message);
}

function changeDevice(){
	var type = null;
	if( this.getAttribute('id') == 'videoInput' )
		type = 'video';
	else if( this.getAttribute('id') == 'audioInput' )
		type = 'audio';

	if( type && localStream ){
		localStream.getTracks().forEach(t=>{
			if( t.kind == type )
				t.stop();
		});
		mediaStream(type);
	}
}



initSources();