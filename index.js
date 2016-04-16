var express = require('express');
var path = require('path');
var app = express();
var port = 3700;

app.get('/', function(req, res){
    res.sendFile(__dirname+'/index.html');
});

app.use(express.static(path.join(__dirname,"/public")));
app.use('/bower_components', express.static(path.join(__dirname,"/bower_components")));
app.use('/node_modules/socket.io-client', express.static(path.join(__dirname,'/node_modules','/socket.io-client')))

var io = require('socket.io').listen(app.listen(port));
var ready = true;
var Users = [];

io.on('connection', function(socket){
    socket.on('playerJoin', function(player){
        io.emit('newPlayer', player);
    });
    socket.on('result', function(emit){
        io.emit(emit);
    });
    socket.on('answer', function(playerName){
        if(ready){
            io.emit('playerGuess', playerName);
            ready = false;
        }
    });
    socket.on('continue',function(){
        ready = true;
        socket.broadcast.emit('continue');
    });
    socket.on('isReady', function(){
        return ready;
    })
});
