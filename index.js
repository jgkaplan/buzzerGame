var express = require('express');
var path = require('path');
var app = express();
var port = 3700;

app.get('/', function(req, res){
    res.sendFile(__dirname+'/index.html');
});

app.get('/host', function(req, res){
    res.sendFile(__dirname+'/host.html');
});

app.get('/player', function(req, res){
    res.sendFile(__dirname+'/player.html');
})

app.use(express.static(path.join(__dirname,"/public")));
app.use('/bower_components', express.static(path.join(__dirname,"/bower_components")));
app.use('/node_modules/socket.io-client', express.static(path.join(__dirname,'/node_modules','/socket.io-client')))

var io = require('socket.io').listen(app.listen(port));
var host = io.of('/host');
var player = io.of('/player');

var ready = true;
var currentlyGuessing;

player.on('connection', function(socket){
    socket.on('playerJoin', function(name){
        host.emit('playerJoin', socket.id, name);
    });
    socket.on('disconnect', function(){
        host.emit('playerLeave', socket.id);
    });
    socket.on('answer', function(callback){
        if(ready){
            host.emit('playerGuess', socket.id);
            ready = false;
            currentlyGuessing = socket.id;
            callback(true);
        }else{
            callback(false);
        }
    });
});

host.on('connection', function(socket){
    socket.on('success', function(){
        player.to(currentlyGuessing).emit('success');
    });
    socket.on('failure', function(){
        player.to(currentlyGuessing).emit('failure');
    });
    socket.on('continue',function(){
        ready = true;
        player.emit('continue');
    });
});
