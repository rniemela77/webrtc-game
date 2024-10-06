const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let players = {}; // To store player data
let hostId = null; // The player who will control the ball

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Assign paddles based on whether they are the first or second player
    players[socket.id] = { id: socket.id, paddleY: 300, isHost: false };

    // Check if there is a current host, if not, assign this player as host
    if (Object.keys(players).length === 1) {
        hostId = socket.id; // First player becomes the host
        players[socket.id].isHost = true; // Mark as host
    }

    // Send the current player data to all clients
    io.emit('currentPlayers', players);

    // Listen for paddle movement
    socket.on('paddleMove', (data) => {
        if (players[socket.id]) {
            players[socket.id].paddleY = data.y; // Update paddle position
            // Broadcast the updated position to other players
            socket.broadcast.emit('paddleMove', { id: socket.id, y: data.y });
        }
    });

    // Only the host updates the ball
    socket.on('ballUpdate', (data) => {
        if (socket.id === hostId) {
            io.emit('ballUpdate', data); // Broadcast ball position to all players
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        delete players[socket.id]; // Remove player from list

        if (socket.id === hostId) {
            hostId = null; // Reset host when the host disconnects
            // Reassign host if there are remaining players
            if (Object.keys(players).length > 0) {
                const remainingPlayers = Object.keys(players);
                hostId = remainingPlayers[0]; // Assign the first remaining player as host
                players[hostId].isHost = true; // Mark new host
            }
        }

        io.emit('currentPlayers', players); // Update all clients
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
