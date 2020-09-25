var pc;
var localStream = null;
var deviceChange = null; // audio|video

var btnConfig = document.querySelector("#btnConfig");
btnConfig.addEventListener('click', toggleConfig);
var popupConfig = document.getElementById("popupConfig");

var videoInputElem = document.querySelector('#videoInput');
var audioInputElem = document.querySelector('#audioInput');

videoInputElem.addEventListener('change', changeDevice);
audioInputElem.addEventListener('change', changeDevice);

var videoLocal = document.querySelector("#videoLocal");

var widthVideo = 360;

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
		var icam = 1;
		var iaud = 1;
  		devices.forEach(function(device) {
  			if( device.kind == 'videoinput' ){
  				var label = device.label == "" ? "Cámara " + icam : device.label;
  				icam += 1;
  				var html = '<option value="' + device.deviceId + '">' + label + '</option>';
  				$(videoInputElem).append(html);
  			}
  			if( device.kind == 'audioinput' ){
  				var label = device.label == "" ? "Audio " + iaud : device.label;
  				iaud += 1;
  				var html = '<option value="' + device.deviceId + '">' + label + '</option>';
  				$(audioInputElem).append(html);
  			}
	  	});
	})
	.catch(function(err) {
  		alert(err.name + ": " + err.message);
	});
}

function mediaStream(){
	var configMediaStream = {
	    audio: { 
	    	deviceId: {exact: audioInputElem.value}
	    }, 
	    video: {
	    	deviceId: {exact: videoInputElem.value},
	    	facingMode: 'user',
	    	width: widthVideo,
	    	/*
	    	{
	            min: 320,
	            max: 640,
	            ideal: 640
	        },
        	height: {
        		min: 240,
        		max: 480,
        		ideal: 480
        	}
        	*/
	        frameRate: 15
		}
	};

	navigator.mediaDevices.getUserMedia(configMediaStream)
	    .then(defineStream)
	    .then(refreshSender)
	    .catch(errorNotAccessCamera);
}

function defineStream(stream){
	localStream = stream;
    videoLocal.autoplay = true;
    videoLocal.muted = true;
    videoLocal.srcObject = stream;
    document.querySelector('.local').classList.add('active');
}

function refreshSender(){
	if( pc != undefined && pc != null ){
		if( deviceChange == 'video' ){
			refreshSenderVideo();
		}else if( deviceChange == 'audio' ){
			refreshSenderAudio();
		}
	}
	deviceChange = null;
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
    if( err.message == ""){
    	//mediaStream();
    	alert(err.message );
    }else{
    	alert(err.message );// "\nNo hemos podido acceder a la camara\npor favor vuelva a cargar la página y permita el acceso.");
		alert(err.toString());
	    console.error(err.message);	
    }
}

function changeDevice(){
	if( this.getAttribute('id') == 'videoInput' )
		deviceChange = 'video';
	else if( this.getAttribute('id') == 'audioInput' )
		deviceChange = 'audio';

	if( deviceChange ){
		if( localStream ){
			localStream.getTracks().forEach(function(t){
				if( t.kind == deviceChange )
					t.stop();
			});
		}
		mediaStream();
	}
}




initSources();