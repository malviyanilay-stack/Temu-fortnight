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

// Continuous Enemy Spawning
setInterval(() => {
    const playerIds = Object.keys(players);
    if (playerIds.length > 0) {
        const randomPlayer = players[playerIds[Math.floor(Math.random() * playerIds.length)]];
        const angle = Math.random() * Math.PI * 2;
        
        const enemy = {
            id: enemyIdCounter++,
            x: randomPlayer.x + Math.cos(angle) * 50,
            y: 0,
            z: randomPlayer.z + Math.sin(angle) * 50,
            hp: 3
        };
        
        enemies[enemy.id] = enemy;
        io.emit('spawnEnemy', enemy);
    }
}, 3000); 

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
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
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
