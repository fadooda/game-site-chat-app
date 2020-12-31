const http = require('http');
const express = require('express');
const socketio = require('socket.io');


const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');
const PORT = process.env.PORT || 9000

const router = require('./router');

const options={
  cors:true
 }
 
const app = express();
const server = http.createServer(app);
const io = socketio(server,options);

app.use(router);

io.on('connect', (socket) => {
  
  const _id = socket.id
  console.log('Socket Connected: ' + _id)

  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });
    console.log("name:")
    console.log(name)
    console.log("room:")
    console.log(room)
    if(error) return callback(error);

    socket.join(user.room);

    socket.emit('message', { user: 'Admin', text: `${user.name}, welcome to room ${user.room}.`});
    socket.broadcast.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has joined!` });

    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    if(user)io.to(user.room).emit('message', { user: user.name, text: message });

    callback();
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected: ' + _id)
    const user = removeUser(socket.id);
    console.log(user)
    if(user) {
      io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
    }
  })
});

server.listen(PORT, ()=>console.log(`Server has started on port: ${PORT}`))