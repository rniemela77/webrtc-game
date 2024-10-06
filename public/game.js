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
    default: "arcade",
    arcade: {
      gravity: { y: 2000 }, // Increased gravity to make paddles feel heavier
      debug: false,
      // Enable world bounds
      setBounds: true,
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
  leftPaddle = this.add.rectangle(
    paddleWidth,
    window.innerHeight / 2,
    paddleWidth,
    paddleHeight,
    0xff0000
  ); // Left paddle
  this.physics.add.existing(leftPaddle);
  leftPaddle.body.setImmovable(true);
  leftPaddle.body.collideWorldBounds = true; // Enable collision with world bounds

  rightPaddle = this.add.rectangle(
    window.innerWidth - paddleWidth,
    window.innerHeight / 2,
    paddleWidth,
    paddleHeight,
    0x0000ff
  ); // Right paddle
  this.physics.add.existing(rightPaddle);
  rightPaddle.body.setImmovable(true);
  rightPaddle.body.collideWorldBounds = true; // Enable collision with world bounds

  // on pointer click
  this.input.on("pointerdown", (pointer) => {
    if (isHost) {
      if (leftPaddle.body.y > window.innerHeight - paddleHeight * 1.5) {
        // make left paddle jump
        leftPaddle.body.setVelocityY(-1500); // Adjusted jump velocity
      } else {
        // make left paddle dive to the right
        leftPaddle.body.setVelocityX(500); // Adjusted dive velocity
      }
    } else {
      if (rightPaddle.body.y > window.innerHeight - paddleHeight * 1.5) {
        // make right paddle jump
        rightPaddle.body.setVelocityY(-1500); // Adjusted jump velocity
      }
    }
  });

  // Listen for player assignments and updates
  socket.on("currentPlayers", (players) => {
    // Check if this player is the host
    if (players[socket.id] && players[socket.id].isHost) {
      isHost = true;
      console.log("You are the host");
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
  socket.on("paddleMove", (data) => {
    if (isHost) {
      rightPaddle.setY(data.y);
    } else {
      leftPaddle.setY(data.y);
    }
  });
}

function update() {
  // No ball-related updates needed
  if (isHost) {
    socket.emit("paddleMove", { y: leftPaddle.y });
  } else {
    socket.emit("paddleMove", { y: rightPaddle.y });
  }

  // if a paddle hits the ground, stop it
  if (leftPaddle.y > window.innerHeight - leftPaddle.height) {
    leftPaddle.body.setVelocityX(0);
  } else if (rightPaddle.y > window.innerHeight - rightPaddle.height) {
    rightPaddle.body.setVelocityX(0);
  }
}
