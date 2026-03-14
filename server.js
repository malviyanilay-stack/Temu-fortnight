const express = require('express');
const http = require('http');
const { Server } = require("socket.io"); // Make sure this line is exactly like this

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static('public'));

// Your game logic
const players = {};
let enemies = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  players[socket.id] = { x: 0, y: 0, z: 0 };
  
  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

// CRITICAL FIX: Render needs process.env.PORT
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is actually running on port ${PORT}`);
});
