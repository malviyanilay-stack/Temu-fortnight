const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

let players = {};
let enemies = {};

// --- AI SPAWNER ---
setInterval(() => {
    if (Object.keys(players).length > 0 && Object.keys(enemies).length < 8) {
        const id = "Bot_" + Math.random().toString(36).substr(2, 5);
        const angle = Math.random() * Math.PI * 2;
        enemies[id] = {
            id,
            x: Math.cos(angle) * 60,
            z: Math.sin(angle) * 60,
            hp: 100
        };
        io.emit('spawnEnemy', enemies[id]);
    }
}, 4000);

io.on('connection', (socket) => {
    players[socket.id] = { x: 0, y: 0, z: 0, r: 0, hp: 100 };
    socket.emit('init', { id: socket.id, players, enemies });

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].z = data.z;
            players[socket.id].r = data.r;
        }
    });

    socket.on('shoot', (data) => {
        socket.broadcast.emit('playerShot', { id: socket.id, pos: data.pos, dir: data.dir });
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerLeave', socket.id);
    });
});

setInterval(() => { io.emit('state', { players }); }, 1000 / 60);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('Server running on ' + PORT));
