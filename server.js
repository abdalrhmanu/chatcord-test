const path  = require('path');
const http  = require('http')
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
    userJoin,
    getCurrentUser, 
    userLeave, 
    getRoomUsers
} = require('./utils/users');


const app = express();
const server = http.createServer(app)
const io = socketio(server);

const PORT = process.env.PORT || 3000;

// Set static folder
app.use(express.static(path.join(__dirname, '/')));

const Messanger = 'Messanger'; 

// Run when client connects
io.on('connection', socket =>{
    console.log('New websocket connection...');

    socket.on('joinRoom', ({username, room}) =>{
        const user = userJoin(socket.id, username, room);

        socket.join(user.room)

        // Welcome current user
        socket.emit('message', formatMessage(Messanger,'Welcome to myRehab consultation portal.'));

        // Broadcast when a user connects - to all of the clients except the client that is connecting
        socket.broadcast.to(user.room)
                .emit('message',
                formatMessage(Messanger,
                    `${user.username} has joined the chat.`));

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room : user.room,
            users: getRoomUsers(user.room)
        })
    })

    // Listen for chatMessage
    socket.on('chatMessage', msg =>{
        const user = getCurrentUser(socket.id);

        // Emit to everybody - client
        io.to(user.room).emit('message', formatMessage(user.username,msg));
    });

    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user){
        // Broadcast to all the clients in general
        io.to(user.room).emit('message', formatMessage(Messanger,`${user.username} has left the chat.`));

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room : user.room,
            users: getRoomUsers(user.room)
        })
        }
    });
});

server.listen(PORT, () =>{
    // npm run dev
    console.log(`Server running on port ${PORT}`);
})