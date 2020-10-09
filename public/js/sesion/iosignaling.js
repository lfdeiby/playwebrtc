// SOCKET LISTENER SIGNALING
function ioSignaling(io){
    io.on('signaling_message', async (data) => {
        
        switch(data.type){
            case 'offer':
                // verificar si ya esta en coneccion y rechazar
                pc = createPeerConnection();

                if( localStream ){
                    localStream.getTracks().forEach(function( track ){
                        pc.addTrack(track, localStream);
                    });
                }

                await pc.setRemoteDescription({
                    type: data.type,
                    sdp: data.sdp
                });

                var answer = await pc.createAnswer();

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

                await pc.addIceCandidate(data.candidate);
                break;

            default:
                console.log('Signaling not type', data);
                break;
        }
    });
}