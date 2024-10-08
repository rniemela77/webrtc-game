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
      gravity: { y: 2500 }, // Increased gravity to make paddles feel heavier
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
    window.innerWidth / 4,
    window.innerHeight / 2,
    paddleWidth,
    paddleHeight,
    0xff0000
  ); // Left paddle
  this.physics.add.existing(leftPaddle);
  leftPaddle.body.setImmovable(true);
  leftPaddle.body.collideWorldBounds = true; // Enable collision with world bounds

  rightPaddle = this.add.rectangle(
    window.innerWidth / 4 * 3,
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
        // JUMP
        leftPaddle.body.setVelocityY(-2000); // Adjusted jump velocity
      } else if (leftPaddle.body.velocity.x === 0) {
        // DIVE
        leftPaddle.body.setVelocityX(800); // Adjusted dive velocity
        leftPaddle.body.setVelocityY(
            leftPaddle.body.velocity.y + 1500
        );
      }
    } else {
      if (rightPaddle.body.y > window.innerHeight - paddleHeight * 1.5) {
        // JUMP
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
      rightPaddle.setX(data.x);
    } else {
      leftPaddle.setY(data.y);
      leftPaddle.setX(data.x);
    }
  });
}

function update() {
  // No ball-related updates needed
  if (isHost) {
    socket.emit("paddleMove", { x: leftPaddle.x, y: leftPaddle.y });
  } else {
    socket.emit("paddleMove", { x: rightPaddle.x, y: rightPaddle.y });
  }

  // if a paddle hits the ground, stop it
  if (leftPaddle.y > window.innerHeight - leftPaddle.height) {
    leftPaddle.body.setVelocityX(0);
  } else if (rightPaddle.y > window.innerHeight - rightPaddle.height) {
    rightPaddle.body.setVelocityX(0);
  }

  // if leftPaddle collides with rightPaddle, destroy the lower one
  if (
    Phaser.Geom.Intersects.RectangleToRectangle(
      leftPaddle.getBounds(),
      rightPaddle.getBounds()
    )
  ) {
    if (leftPaddle.y > rightPaddle.y) {
      // reset positions
      leftPaddle.y = window.innerHeight / 2;
      rightPaddle.y = window.innerHeight / 2;
      leftPaddle.x = leftPaddle.width;
      rightPaddle.x = window.innerWidth - rightPaddle.width;
    } else {
      // reset positions
      leftPaddle.y = window.innerHeight / 2;
      rightPaddle.y = window.innerHeight / 2;
      leftPaddle.x = leftPaddle.width;
      rightPaddle.x = window.innerWidth - rightPaddle.width;
    }
  }
}
