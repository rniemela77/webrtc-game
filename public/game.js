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
let ball;
let isHost = false; // Tracks if this client is the host
let ballVelocity = { x: 200, y: 200 };

function preload() {
    // Load any assets if needed
}

function create() {
    const paddleWidth = window.innerWidth * 0.025;
    const paddleHeight = window.innerHeight * 0.15;
    const ballRadius = window.innerWidth * 0.02;

    // Create paddles and ball
    leftPaddle = this.add.rectangle(paddleWidth, window.innerHeight / 2, paddleWidth, paddleHeight, 0xff0000); // Left paddle
    this.physics.add.existing(leftPaddle);
    leftPaddle.body.setImmovable(true);

    rightPaddle = this.add.rectangle(window.innerWidth - paddleWidth, window.innerHeight / 2, paddleWidth, paddleHeight, 0x0000ff); // Right paddle
    this.physics.add.existing(rightPaddle);
    rightPaddle.body.setImmovable(true);

    ball = this.add.circle(window.innerWidth / 2, window.innerHeight / 2, ballRadius, 0xffff00); // Create the ball
    this.physics.add.existing(ball);

    // Set ball physics properties
    ball.body.setBounce(1);
    ball.body.setCollideWorldBounds(true);

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

    // Handle paddle and ball collisions
    this.physics.add.collider(ball, leftPaddle);
    this.physics.add.collider(ball, rightPaddle);

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

// this.physics.add.collider(ball, leftPaddle, onBallCollide);
// this.physics.add.collider(ball, rightPaddle, onBallCollide);