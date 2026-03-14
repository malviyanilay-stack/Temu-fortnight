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

// CONTINUOUS ENEMY SPAWNING LOOP
// Spawns a new enemy every 2.5 seconds if there is at least one player online
setInterval(() => {
    const playerIds = Object.keys(players);
    if (playerIds.length > 0) {
        // Pick a random player to spawn the enemy near
        const randomPlayer = players[playerIds[Math.floor(Math.random() * playerIds.length)]];
        const angle = Math.random() * Math.PI * 2;
        
        const enemy = {
            id: enemyIdCounter++,
            x: randomPlayer.x + Math.cos(angle) * 40, // Spawn 40 units away
            y: 0,
            z: randomPlayer.z + Math.sin(angle) * 40,
            hp: 3
        };
        
        enemies[enemy.id] = enemy;
        io.emit('spawnEnemy', enemy);
    }
}, 2500); 

io.on('connection', (socket) => {
    console.log(`Player joined: ${socket.id}`);
    
    // Create new player
    players[socket.id] = { x: 0, y: 0, z: 0, yaw: 0 };
    
    // Send existing data to the new player
    socket.emit('currentPlayers', players);
    socket.emit('currentEnemies', enemies);
    
    // Alert others
    socket.broadcast.emit('newPlayer', { id: socket.id, playerInfo: players[socket.id] });

    // Sync Movement
    socket.on('playerMovement', (data) => {
        players[socket.id] = data;
        socket.broadcast.emit('playerMoved', { id: socket.id, playerInfo: data });
    });

    // Sync Enemy Deaths
    socket.on('enemyDied', (enemyId) => {
        if (enemies[enemyId]) {
            delete enemies[enemyId];
            io.emit('removeEnemy', enemyId);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Player left: ${socket.id}`);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Temu Fortnite server running on port ${PORT}`);
});
