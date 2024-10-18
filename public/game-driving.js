// Create a new Phaser Game instance
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
        },
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
};

const game = new Phaser.Game(config);

let car;
let camera;
let pathTiles = [];
let tileSize = 100;
let gridWidth = 8;
let gridHeight = 6;

function preload() {
    // Load car image and tiles for path
    this.load.image('car', 'assets/car.png'); // Add your car image to the assets folder
    this.load.image('pathTile', 'assets/pathTile.png'); // Add a simple path tile image to the assets folder
}

function create() {
    // Create grid-based path using tiles
    const pathPattern = [
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 1],
        [1, 1, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
    ];

    for (let row = 0; row < gridHeight; row++) {
        for (let col = 0; col < gridWidth; col++) {
            if (pathPattern[row][col] === 1) {
                let pathTile = this.physics.add.staticImage(col * tileSize, row * tileSize, 'pathTile');
                pathTile.setOrigin(0);
                pathTile.displayWidth = tileSize;
                pathTile.displayHeight = tileSize;
                pathTiles.push(pathTile);
            }
        }
    }

    // Add car sprite to the scene
    car = this.physics.add.sprite(400, 300, 'car');
    car.setCollideWorldBounds(true);
    car.setScale(0.3); // Make the car smaller

    // Set up camera to follow the car
    camera = this.cameras.main;
    camera.startFollow(car);
    camera.setFollowOffset(0, 0);
    camera.setLerp(1); // higher lerp value makes the camera follow smoother
    camera.setZoom(3); // Zoom closer on the car

    // Enable pointer events for steering
    this.input.on('pointerdown', (pointer) => {
        if (pointer.x < this.scale.width / 2) {
            // Pointer is on the left side of the screen, steer left
            car.setAngularVelocity(-100);
        } else {
            // Pointer is on the right side of the screen, steer right
            car.setAngularVelocity(100);
        }
    });

    this.input.on('pointerup', () => {
        // Stop steering when pointer is released
        car.setAngularVelocity(0);
    });
}

function update() {
    // Base speed
    let speed = 100; // Slow the car down

    // Check if the car overlaps with any path tile to increase speed
    let onPath = false;
    pathTiles.forEach(tile => {
        if (Phaser.Geom.Intersects.RectangleToRectangle(car.getBounds(), tile.getBounds())) {
            onPath = true;
        }
    });

    if (onPath) {
        speed = 150; // Increase speed if the car is on the path
    }

    // Constant forward movement
    this.physics.velocityFromRotation(car.rotation, speed, car.body.velocity);

    // Keep the camera fixed and adjust the world so the car appears to drive towards the top of the screen
    camera.setRotation(-car.rotation - Math.PI / 2);
    camera.scrollX = car.x - camera.width / 2;
    camera.scrollY = car.y - camera.height / 2;
}