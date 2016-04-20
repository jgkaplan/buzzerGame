var express = require('express');
var path = require('path');
var app = express();
var port = 3700;

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/host', function(req, res) {
    res.sendFile(__dirname + '/host.html');
});

app.get('/player', function(req, res) {
    res.sendFile(__dirname + '/player.html');
});
app.use('/modernizr-custom.js', express.static(path.join(__dirname, "/modernizr-custom.js")));
app.use('/css', express.static(path.join(__dirname, "/css")));
app.use('/bower_components', express.static(path.join(__dirname, "/bower_components")));
app.use('/node_modules/socket.io-client', express.static(path.join(__dirname, '/node_modules', '/socket.io-client')));

var io = require('socket.io').listen(app.listen(port));
var host = io.of('/host');
var player = io.of('/player');

var rooms = [];

player.on('connection', function(socket) {
    var roomID;
    socket.on('playerJoin', function(name, room) {
        host.to(room).emit('playerJoin', socket.id, name);
        socket.join(room);
        roomID = room;
    });
    socket.on('disconnect', function() {
        host.to(roomID).emit('playerLeave', socket.id);
    });
    socket.on('answer', function() {
        host.to(roomID).emit('playerGuess', socket.id);
    });
});

host.on('connection', function(socket) {
    var joinID = genRoomID();
    socket.emit('roomID', joinID);
    socket.join(joinID);
    socket.on('success', function(currentlyGuessing) {
        player.to(currentlyGuessing).emit('success');
    });
    socket.on('failure', function(currentlyGuessing) {
        player.to(currentlyGuessing).emit('failure');
    });
    socket.on('continue', function() {
        player.to(joinID).emit('continue');
    });
    socket.on('disconnect', function() {
        rooms.pop(rooms.indexOf(joinID));
        player.to(joinID).emit('exit');
    });
    socket.on('acceptedGuess', function(currentlyGuessing) {
        player.to(currentlyGuessing).emit('guessAccepted');
    });
    socket.on('setButton', function(button){
        player.to(joinID).emit('setButton', button);
    })
});

function genRoomID() {
    var id = '';
    while (id == '' || rooms.indexOf(id) != -1 || id.length != 5) {
        id = Math.random().toString(36).replace(/^0/g, '').replace(/[^a-zA-Z0-9]/g, '').substr(0, 5).toUpperCase();
    }
    rooms.push(id);
    return id;
}


//Host picks the image and sound of the buttons
//Maybe integrate with google hangouts
