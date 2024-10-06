const socket = io();

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
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

let playerPaddle;
let opponentPaddle;
let ball;
let isHost = false; // Tracks if this client is the host
let ballVelocity = { x: 200, y: 200 };

function preload() {
    // Load any assets if needed
}

function create() {
    // Create paddles and ball
    playerPaddle = this.add.rectangle(50, 300, 20, 100, 0xff0000); // Left paddle
    this.physics.add.existing(playerPaddle);
    playerPaddle.body.setImmovable(true);

    opponentPaddle = this.add.rectangle(750, 300, 20, 100, 0x0000ff); // Right paddle
    this.physics.add.existing(opponentPaddle);
    opponentPaddle.body.setImmovable(true);

    ball = this.add.circle(400, 300, 15, 0xffff00); // Create the ball
    this.physics.add.existing(ball);

    // Set ball physics properties
    ball.body.setBounce(1);
    ball.body.setCollideWorldBounds(true);

    // Handle paddle controls
    this.input.on('pointermove', (pointer) => {
        const y = Phaser.Math.Clamp(pointer.y, 50, 550);
        playerPaddle.setY(y);
        socket.emit('paddleMove', { y });
    });

    // Handle paddle and ball collisions
    this.physics.add.collider(ball, playerPaddle);
    this.physics.add.collider(ball, opponentPaddle);

    // Listen for player assignments and updates
    socket.on('currentPlayers', (players) => {
        // Check if this player is the host
        if (players[socket.id] && players[socket.id].isHost) {
            isHost = true;
            console.log('You are the host');
            startBallMovement(); // Start ball movement when this client is the host
        }

        // Update paddles' positions
        for (const id in players) {
            if (id === socket.id) {
                // This player's paddle
                playerPaddle.setY(players[id].paddleY);
            } else {
                // Opponent's paddle
                opponentPaddle.setY(players[id].paddleY);
            }
        }
    });

    // Listen for opponent paddle movement
    socket.on('paddleMove', (data) => {
        opponentPaddle.setY(data.y);
    });

    // Listen for ball updates from the host
    socket.on('ballUpdate', (data) => {
        if (!isHost) {
            ball.setPosition(data.x, data.y);
        }
    });
}

function update() {
    // If the client is the host, it updates the ball
    if (isHost) {
        // Emit the ball's position to the other player
        socket.emit('ballUpdate', { x: ball.x, y: ball.y });
    }
}

// Function to start the ball's movement
function startBallMovement() {
    ball.body.setVelocity(ballVelocity.x, ballVelocity.y);
}

// This will handle bouncing the ball off the paddles
function onBallCollide() {
    ballVelocity.x = -ballVelocity.x; // Reverse direction on paddle hit
}

// this.physics.add.collider(ball, playerPaddle, onBallCollide);
// this.physics.add.collider(ball, opponentPaddle, onBallCollide);
