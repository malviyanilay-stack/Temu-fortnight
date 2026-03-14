const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const players = {};
let enemies = {};
let enemyIdCounter = 0;

// Spawns enemies every 4 seconds
setInterval(() => {
    if (Object.keys(players).length > 0) {
        const id = enemyIdCounter++;
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 20;
        
        enemies[id] = {
            id: id,
            x: Math.cos(angle) * dist,
            z: Math.sin(angle) * dist,
            hp: 3
        };
        io.emit('spawnEnemy', enemies[id]);
    }
}, 4000);

io.on('connection', (socket) => {
    players[socket.id] = { x: 0, y: 0, z: 0, yaw: 0 };
    socket.emit('currentPlayers', players);
    socket.emit('currentEnemies', enemies);
    socket.broadcast.emit('newPlayer', { id: socket.id, playerInfo: players[socket.id] });

    socket.on('playerMovement', (data) => {
        if (players[socket.id]) {
            players[socket.id] = data;
            socket.broadcast.emit('playerMoved', { id: socket.id, playerInfo: data });
        }
    });

    socket.on('enemyDied', (enemyId) => {
        if (enemies[enemyId]) {
            delete enemies[enemyId];
            io.emit('removeEnemy', enemyId);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server active on port ${PORT}`));
