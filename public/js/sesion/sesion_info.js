var URLINFO = '/sesion/api/info/' + SIGNAL_ROOM;
function sendInfoServer(data){
    $.ajax({
        url: URLINFO,
        type: 'post',
        data: data,
        success: function(){/*console.log(data);*/},
        error: function(err){console.log(err);}
    });
}

var INFO =  {
    
    habilitar_sala: function(){
        var data = {
            code: '001',
            user: me.id
        };
        sendInfoServer(data);
    },

    hazle_recuerdo: function(){
        var data = {
            code: '002',
            user: me.id
        };
        sendInfoServer(data);
    },

    entrar_sala: function(){
        var data = {
            code: '003',
            user: me.id
        };
        sendInfoServer(data);
    },

    start_call: function(){
        var data = {
            code: '004',
            user: me.id
        };
        sendInfoServer(data);
    },

    signaling_finalize: function(){
        var data = {
            code: '005',
            user: me.id
        };
        sendInfoServer(data);
    },

    microphone: function(message){
        var data = {
            code: '006',
            message: message,
            user: me.id
        };
        sendInfoServer(data);
    },

    video: function(message){
        var data = {
            code: '007',
            message: message,
            user: me.id
        };
        sendInfoServer(data);
    },

    hungup: function(){
        var data = {
            code: '008',
            user: me.id
        };
        sendInfoServer(data);
    },

    exit_page: function(){
        var data = {
            code: '009',
            user: me.id
        };
        sendInfoServer(data);
    },

    reconectar: function(){
        var data = {
            code: '010',
            user: me.id
        };
        sendInfoServer(data);
    },

    camera_error: function(message){
        var data = {
            code: '011',
            message: message,
            user: me.id
        };
        sendInfoServer(data);
    },

    duplicate: function(){
        var data = {
            code: '012',
            user: me.id
        };
        sendInfoServer(data);
    },

    disconnect: function(){
        var data = {
            code: '013',
            user: other.id
        };
        sendInfoServer(data);
    },

    sharescreen: function(message){
        var data = {
            code: '014',
            message: message,
            user: me.id
        };
        sendInfoServer(data);
    },

    webrtc_connect: function(message){
        var data = {
            code: '015',
            message: message,
            user: me.id
        };
        sendInfoServer(data);
    },

    socket_io_error: function(message){
        var data = {
            code: '400',
            message: message,
            user: me.id
        };
        sendInfoServer(data);
    },

    error_signaling: function(message){
        var data = {
            code: '401',
            message: message,
            user: me.id
        };
        sendInfoServer(data);
    },

    error_offline: function(message){
        var data = {
            code: '402',
            message: message,
            user: me.id
        };
        sendInfoServer(data);
    },

    error_browser: function(message){
        var data = {
            code: '403',
            message: message,
            user: me.id
        };
        sendInfoServer(data);
    }


}