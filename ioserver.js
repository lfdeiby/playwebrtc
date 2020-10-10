function ioserver(io){
    io.sockets.on('connection', function(socket){

        socket.on('check', function(){
            console.log("NAME ROOM:", socket.user_room);
            var clientsInRoom = io.sockets.adapter.rooms[socket.user_room];
            if( clientsInRoom !== undefined ){
                let allSockets = clientsInRoom.sockets;

                for (let key of Object.keys(allSockets)) {
                    const item = io.sockets.connected[key];
                    console.log("ROOM:", item.user_id);
                }
            }

            const data = {
                user_id: socket.user_id,
                user_type: socket.user_type,
                user_name: socket.user_name,
                user_room: socket.user_room,
                user_open: socket.user_open
            }
            console.log(data);
            socket.to(socket.user_room).emit('info', data);
        });

        socket.on('ready', function(data){
            const MESSAGE_DUPLICATE = "El usuario ya tiene una sesión abierta";
            const socketExist = _existSocketToRoom(data.signal_room, data.user_id);
            if( socketExist ){
                console.log("DUPLICADO", data.user_id);
                const result = { id: data.user_id, user_name: socket.user_name };
                socketExist.to(data.signal_room).emit('exit', result);
                socketExist.leave(data.signal_room);
                socket.emit('duplicate', {message: MESSAGE_DUPLICATE});
                // return;
            }

            console.log("Connect and join:", data.user_id);

            socket.user_id = data.user_id;
            socket.user_type = data.type;
            socket.user_name = data.name;
            socket.user_room = data.signal_room;
            socket.user_open = data.open || false;
            socket.join(data.signal_room);

            const otherSocket = _getOtherSocket(data.signal_room, data.user_id);
            let result = {};
            if( otherSocket){
                result = {
                    id: otherSocket.user_id,
                    type: otherSocket.user_type,
                    name: otherSocket.user_name,
                    open: otherSocket.user_open
                }
            }

            socket.emit('hello', result);
            console.log("CONECTADO IO", data.user_id);
            //socket.to(data.signal_room).emit('join', result);
            
        });

        socket.on('open', function(data){
            socket.user_open = true;
            socket.to(data.signal_room).emit('open_room', {
                id: data.user_id,
                name: data.name,
                type: data.type
            });
        });

        socket.on('bye', function(data){
            const result = { id: data.user_id, user_name: socket.user_name };
            socket.to(data.signal_room).emit('exit', result);

            socket.leave(data.signal_room);
        });

        socket.on('call', function(data){
            socket.to(data.signal_room).emit('call_start', data.signal_room);
            socket.emit('call_start', data.signal_room);
        });

        socket.on('message', function(data){
            socket.to(data.signal_room).emit('signaling_message', data );
        });

        socket.on('disconnect', function(){
            console.log("DESCOENCTADO EL USR: ", socket.user_id, socket.user_name);
            if( socket.user_room ){
                socket.leave(socket.user_room);
                const result = { id: socket.user_id, user_name: socket.user_name };
                socket.to(socket.user_room).emit('bye', result);
            }
        });

        
    });


    function _existSocketToRoom(room, user_id){
        var clientsInRoom = io.sockets.adapter.rooms[room];
        if( clientsInRoom !== undefined ){
            let allSockets = clientsInRoom.sockets;

            for (let key of Object.keys(allSockets)) {
                const item = io.sockets.connected[key];
                if( item.user_id == user_id ){
                    return item;
                }
            }
        }
        return null;
    }

    function _getOtherSocket(room, user_id){
        var clientsInRoom = io.sockets.adapter.rooms[room];
        if( clientsInRoom !== undefined ){
            let allSockets = clientsInRoom.sockets;

            for (let key of Object.keys(allSockets)) {
                const item = io.sockets.connected[key];
                if( item.user_id != user_id ){
                    return item;
                }
            }
        }
        return null;
    }


}

module.exports = ioserver;
