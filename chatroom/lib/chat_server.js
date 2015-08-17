/**
 * author zhengang.wei
 * 2015-8-13
 * @type {*}
 */
var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

/**
 * main process
 * @param server
 */
exports.listen = function(server){
    //initial socket
    io = socketio.listen(server);
    io.set('log level',1);

    io.sockets.on('connection', function(socket){
        //assign guest name
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
        joinRoom(socket, 'Lobby');

        handleMessageBroadcasting(socket, nickNames);
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);
        socket.on('rooms', function(){
            socket.emit('rooms', io.sockets.manager.rooms);
        });
        handleClientDisconnection(socket, nickNames, namesUsed);
    });
};

/**
 * assign a guest name
 * @param socket socket
 * @param guestNumber current number of guest
 * @param nickNames all nicknames in a list
 * @param namesUsed used nicknames
 * @returns {*}
 */
function assignGuestName(socket, guestNumber, nickNames, namesUsed){
    var name = 'Guest' +guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResult',{
        success: true,
        name: name
    });
    namesUsed.push(name);
    return guestNumber+1;
}

/**
 * join a room
 * @param socket
 * @param room room name
 */
function joinRoom(socket, room){
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult', {room:room});
    //tell everyone that a guest join the room
    socket.broadcast.to(room).emit('message',{
        text:nickNames[socket.id] + 'has joined ' + room + '.'
    });

    var usersInRoom = io.sockets.clients(room);
    //show the people in the room
    if(usersInRoom.length > 1){
        var usersInRoomSummary = 'User currently in ' + room + ':';
        for(var index in usersInRoom){
            var userSocketId = usersInRoom[index].id;
            if(userSocketId != socket.id){
                if(index > 0){
                    usersInRoomSummary +=', ';
                }
                usersInRoomSummary += nickNames[userSocketId];
            }
        }
        usersInRoomSummary += ".";
        socket.emit('message', {text:usersInRoomSummary});
    }
}
/**
 * change name
 * @param socket
 * @param nickNames
 * @param namesUsed
 */
function handleNameChangeAttempts(socket, nickNames, namesUsed){
    socket.on('nameAttempt', function(name){
        //if nickname not in use
        if(namesUsed.indexOf(name)==-1){
            var previousName = nickNames[socket.id];
            var previousNameIndex = namesUsed.indexOf(previousName);
            //add a new nickname
            namesUsed.push(name);
            nickNames[socket.id] = name;
            //delete the previous nickname
            delete namesUsed[previousNameIndex];
            socket.emit('nameResult',{
                success: true,
                name: name
            });
            socket.broadcast.to(currentRoom[socket.id]).emit('message',{
                text:previousName + ' is now changed to ' + name +'.'
            });
        }else{
            socket.emit('nameResult',{
                success: false,
                message: 'Name duplicated!'
            });
        }
    });
}

/**
 * send message
 * @param socket
 * @param nickNames
 */
function handleMessageBroadcasting(socket, nickNames){
    socket.on('message', function(message){
        socket.broadcast.to(message.room).emit('message', {
            text: nickNames[socket.id] + ': ' +message.text
        });
    });
}

/**
 * join a room
 * @param socket
 */
function handleRoomJoining(socket){
    socket.on('join', function(room){
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    });
}

/**
 * disconnect the server
 * @param socket
 * @param nickNames
 * @param namesUsed
 */
function handleClientDisconnection(socket, nickNames, namesUsed){
    socket.on('discount', function(){
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}

