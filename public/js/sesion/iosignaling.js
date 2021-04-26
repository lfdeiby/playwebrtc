// SOCKET LISTENER SIGNALING
function ioSignaling(io){
    io.on('signaling_message', async (data) => {
        
        switch(data.type){
            case 'offer':
                // verificar si ya esta en coneccion y rechazar
                createPeerConnection();

                if( localStream ){
                    localStream.getTracks().forEach(function( track ){
                        pc.addTrack(track, localStream);
                    });
                    //pc.addStream(localStream);
                }

                await pc.setRemoteDescription({
                    type: data.type,
                    sdp: data.sdp
                });

                var answer = await pc.createAnswer();
                INFO.answer(answer.sdp);
                //answer.sdp = _useOPUSCodec(answer.sdp);
                //answer.sdp += "a=fmtp:100 x-google-max-bitrate=250\r\n";
                //console.log(answer.sdp);
                await pc.setLocalDescription(answer);
                io.emit('message', {
                    type: 'answer',
                    sdp: answer.sdp,
                    signal_room: SIGNAL_ROOM
                });
                break;

            case 'answer':

                await pc.setRemoteDescription({
                    type: data.type,
                    sdp: data.sdp
                });
                break;

            case 'candidate':
                if( data.candidate == null ) return;
                //console.log(data.candidate);
                await pc.addIceCandidate(data.candidate);
                break;

            default:
                console.log('Signaling not type', data);
                break;
        }
    });
}
