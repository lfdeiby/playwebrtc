var cookieParser = require('cookie-parser');
var expressSesion = require('express-session');
var expressFlash = require('express-flash');
var compression = require('compression');
var express = require('express');
var nunjucks = require('nunjucks');
var helmet = require('helmet');
var methodOverride = require('method-override');

var PORT = process.env.PORT || 3000;
var app = express();

var server = require('http').Server(app);
var io = require('socket.io')(server);

/*
var https = require('https');
var fs = require('fs');
var server = https.createServer({
        key: fs.readFileSync('server.key'),
        cert: fs.readFileSync('server.cert')
    }, app
);
var io = require('socket.io')(server);
*/
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
    /*
    const accountSid = 'AC08c974e15c6d582b34e82aeb43c4827e';
    const authToken = '0e19040d4e7d556afbc7cf492c1495e7';
    const client = require('twilio')(accountSid, authToken);
    
    //{ttl: 3600} crea un token por 1 hora
    client.tokens.create({ttl: 3600}).then(token =>{
        console.log("------------------------");
        console.log(token);
        const params = {
            name: "Deiby",
            token: token.iceServers
        }
 
        res.render('index.html', params);
    });
    */
    res.render('index.html', {name:'', token:[]});
});


io.sockets.on('connection', function(socket){

    socket.on('ready', function(data){
        const MESSAGE_DUPLICATE = "El usuario ya tiene una sesión abierta";

        var clientsInRoom = io.sockets.adapter.rooms[data.signal_room];
        var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;

        let duplicate = false;
        if( clientsInRoom !== undefined ){
            //console.log(clientsInRoom.sockets);
            let sss = clientsInRoom.sockets;
            Object.keys(sss).forEach(function (item) {
                const client = io.sockets.connected[item];
                if( client.user_id == data.user_id ){
                    duplicate = true;
                }
            });
        }
        
        //if( duplicate ){
        //    socket.emit('problemas', { message: MESSAGE_DUPLICATE } );
        //}else{
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
        //}
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
        socket.emit('call_start', data.signal_room);
    });

    socket.on('signal', function(data){
        socket.to(data.room).emit('signaling_message', { data });
    });
});

server.listen(PORT, function(){
	console.log('Server running in: localhost:' + PORT);
});

/*
TWILIO
SID: SK0cd0193f14595f27925d62e1adfb7d2f
key type: Standard
Secret: LtWUz9gBN8Nk4ysFkXx3f10LsJqy3Vi2

*/