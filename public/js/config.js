var btnConfig = document.querySelector("#btnConfig");
btnConfig.addEventListener('click', toggleConfig);
var popupConfig = document.getElementById("popupConfig");

var videoInputElem = document.querySelector('#videoInput');
var audioInputElem = document.querySelector('#audioInput');

videoInputElem.addEventListener('change', changeDevice);
audioInputElem.addEventListener('change', changeDevice);

var localStream;
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

	    	//console.log(device);
	    	//start();
	  	});
	})
	.catch(function(err) {
  		console.log(err.name + ": " + err.message);
	});
}

async function start(){
	console.log(audioInputElem.value);
	console.log(videoInputElem.value);
	var configMediaStream = {
	    audio: { 
	    	deviceId: audioInputElem.value 
	    }, 
	    video: {
	    	deviceId: videoInputElem.value,
	    	facingMode: 'user',
	        width: 360,
	        //width: 640,
	        //height: 480,
	        frameRate: 15
		}
	};

	const stream = await navigator.mediaDevices.getUserMedia(configMediaStream)
    .then(function(stream){
        localStream = stream;
        videoLocal.autoplay = true;
        videoLocal.muted = false;
        videoLocal.srcObject = stream;
        document.querySelector('.local').classList.add('active');
    }).catch(function(err) {
        alert("No hemos podido acceder a la camara\npor favor vuelva a cargar la página y permita el acceso.");
        console.error(err.message);
    });
}

function changeDevice(){
	start();
}

initSources();