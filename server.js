const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static('public'));

const players = {};
let enemies = {};
let enemyIdCounter = 0;

setInterval(() => {
    if (Object.keys(players).length > 0) {
        const id = enemyIdCounter++;
        const angle = Math.random() * Math.PI * 2;
        const dist = 30;
        enemies[id] = { id: id, x: Math.cos(angle) * dist, z: Math.sin(angle) * dist };
        io.emit('spawnEnemy', enemies[id]);
    }
}, 4000);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    players[socket.id] = { x: 0, y: 0, z: 0, yaw: 0 };
    socket.emit('currentPlayers', players);
    socket.emit('currentEnemies', enemies);
    socket.broadcast.emit('newPlayer', { id: socket.id, playerInfo: players[socket.id] });

    socket.on('playerMovement', (data) => {
        if (players[socket.id]) {
            players[socket.id] = data;
            socket.broadcast.emit('playerMoved', { id: socket.id, x: data.x, y: data.y, z: data.z, yaw: data.yaw });
        }
    });

    socket.on('enemyDied', (id) => {
        if (enemies[id]) {
            delete enemies[id];
            io.emit('removeEnemy', id);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
