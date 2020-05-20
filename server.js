var cookieParser = require('cookie-parser');
var expressSesion = require('express-session');
var expressFlash = require('express-flash');
var compression = require('compression');
var express = require('express');
var nunjucks = require('nunjucks');
var helmet = require('helmet');
var methodOverride = require('method-override');


var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.use(compression()); // Para comprimir ne gzip
app.use(helmet()); // Seguridad en las cabeceras https://expressjs.com/es/advanced/best-practice-security.html
app.use(express.json()); // Hace que los datos enviados desde un json
app.use(express.urlencoded({extended: false})); // Hace que pueda entender los datos desde un formulario
app.use(cookieParser());
app.use(expressSesion({
	secret: 'Millavesecreta',
	resave: true,
	saveUninitialized: false,
	cookie: { httpOnly: true, maxAge: 86400000 }
}));
app.use(expressFlash());
app.use('/static', express.static(__dirname + '/public'));
app.use(methodOverride('_method'));


// VISTA TEMPLATE
nunjucks.configure('views', {
	autoescape: true,
	express: app
})

app.get('/', function(req, res){
    res.render('index.html');
});


io.sockets.on('connection', function(socket){

    socket.on('ready', function(data){
        const MESSAGE_DUPLICATE = "El usuario ya tiene una sesión abierta";

        var clientsInRoom = io.sockets.adapter.rooms[data.signal_room];
        var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;

        let duplicate = false;
        if( clientsInRoom !== undefined ){
            console.log(clientsInRoom.sockets);
            let sss = clientsInRoom.sockets;
            Object.keys(sss).forEach(function (item) {
                const client = io.sockets.connected[item];
                if( client.user_id == data.user_id ){
                    duplicate = true;
                }
            });
        }
        
        if( duplicate ){
            socket.emit('problemas', { message: MESSAGE_DUPLICATE } );
        }else{
            if( data.type == 'coach' /*numClients == 0*/ && duplicate == false ){
                socket.user_id = data.user_id;
                socket.user_type = data.type;
                socket.join(data.signal_room);
                socket.emit('polite', {
                    message: socket.user_id + ' Unido POLITE ' + data.signal_room + " room"
                });
    
            }else if( data.type == 'client' /*numClients !== 0*/ && duplicate == false ){
                // io.sockets.in(data.signal_room).emit('join', data.signal_room);
                socket.user_id = data.user_id;
                socket.user_type = data.type;
                socket.join(data.signal_room);
                socket.emit('impolite', {
                    message: socket.user_id + ' UNIDO IMPOLITE ' + data.signal_room + " room"
                });
            }
            socket.to(data.signal_room).emit('join', {
                id: data.user_id,
                name: data.name,
                type: data.type
            });
        }
    });

    socket.on('client_reconect', function(data){
        socket.to(data.signal_room).emit('join', {
            id: data.user_id,
            name: data.name,
            type: data.type
        });
    });

    socket.on('call', function(data){
        socket.to(data.signal_room).emit('call_start', data.signal_room);
    });

    socket.on('signal', function(data){
        socket.to(data.room).emit('signaling_message', {
            type: data.type,
            message: data.message
        });
        
    });
});



server.listen(PORT, function(){
	console.log('Server running in: localhost:' + PORT);
});