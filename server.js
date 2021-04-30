//require('dotenv').config();
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

app.get('/', async function(req, res){
    try{

    const accountSid = process.env.TWILIOID;
    const authToken  = process.env.TWILIOTOKEN; // "0e19040d4e7d556afbc7cf492c1495e7"; // process.env.TWILIO_TOKEN;
    const client = require('twilio')(accountSid, authToken);
    
    //{ttl: 3600} crea un token por 1 hora
    const token = await client.tokens.create(); 
    
    const params = {
        name: "Deiby",
        token: token.iceServers
    }

    res.render('index.html', params);
    }catch(err){
        console.log(err);
    }
    //res.render('index.html', {name:'', token:[]});
});

app.post('/sesion/api/info/:room', function(req, res){
    return res.send("ok");
});

var ioconection = require('./ioserver');
ioconection(io);

server.listen(PORT, function(){
	console.log('Server running in: localhost:' + PORT);
});

