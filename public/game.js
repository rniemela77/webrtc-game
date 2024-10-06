const socket = io();

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false,
        },
    },
};

const game = new Phaser.Game(config);

let leftPaddle;
let rightPaddle;
let isHost = false; // Tracks if this client is the host

function preload() {
    // Load any assets if needed
}

function create() {
    const paddleWidth = window.innerWidth * 0.025;
    const paddleHeight = window.innerHeight * 0.15;

    // Create paddles
    leftPaddle = this.add.rectangle(paddleWidth, window.innerHeight / 2, paddleWidth, paddleHeight, 0xff0000); // Left paddle
    this.physics.add.existing(leftPaddle);
    leftPaddle.body.setImmovable(true);

    rightPaddle = this.add.rectangle(window.innerWidth - paddleWidth, window.innerHeight / 2, paddleWidth, paddleHeight, 0x0000ff); // Right paddle
    this.physics.add.existing(rightPaddle);
    rightPaddle.body.setImmovable(true);

    // Handle paddle controls
    this.input.on('pointermove', (pointer) => {
        const y = Phaser.Math.Clamp(pointer.y, paddleHeight / 2, window.innerHeight - paddleHeight / 2);
        if (isHost) {
            leftPaddle.setY(y);
            socket.emit('paddleMove', { y });
        } else {
            rightPaddle.setY(y);
            socket.emit('paddleMove', { y });
        }
    });

    // Listen for player assignments and updates
    socket.on('currentPlayers', (players) => {
        // Check if this player is the host
        if (players[socket.id] && players[socket.id].isHost) {
            isHost = true;
            console.log('You are the host');
        }

        // Update paddles' positions
        for (const id in players) {
            if (id === socket.id) {
                if (isHost) {
                    leftPaddle.setY(players[id].paddleY);
                } else {
                    rightPaddle.setY(players[id].paddleY);
                }
            } else {
                if (isHost) {
                    rightPaddle.setY(players[id].paddleY);
                } else {
                    leftPaddle.setY(players[id].paddleY);
                }
            }
        }
    });

    // Listen for opponent paddle movement
    socket.on('paddleMove', (data) => {
        if (isHost) {
            rightPaddle.setY(data.y);
        } else {
            leftPaddle.setY(data.y);
        }
    });
}

function update() {
    // No ball-related updates needed
}