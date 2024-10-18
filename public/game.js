// Phaser configuration and main scene
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#000000',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Game configuration values
const spawnRate = 1000; // spawn rate in ms
const movementDuration = 3000; // duration for circle to reach target point in ms
const nearTargetDistance = 50; // distance from target point to change color
const normalColor = 0xff0000; // initial color of circle
const nearTargetColor = 0x00ff00; // color when near target point
const circleSize = 10; // size of all circles

let circles = [];
let spawnTimer;
let targetPoint = { x: window.innerWidth / 2, y: window.innerHeight / 2 }; // Default target point, can be changed as needed

function preload() {
    this.load.image('particle', 'https://labs.phaser.io/assets/particles/white.png');
}

function create() {
    // Resize game if window size changes
    this.scale.on('resize', resize, this);
    resize.call(this, { width: window.innerWidth, height: window.innerHeight });
    // Draw target point as an outlined circle
    this.add.circle(targetPoint.x, targetPoint.y, circleSize).setStrokeStyle(2, 0xffffff);

    // Spawns a new circle every interval
    spawnTimer = this.time.addEvent({
        delay: spawnRate,
        callback: () => {
            const x = Phaser.Math.Between(0, this.cameras.main.width);
            const y = Phaser.Math.Between(0, this.cameras.main.height);
            const circle = this.add.circle(x, y, circleSize, normalColor);
            circle.alpha = 0;
            circle.targetX = 2 * targetPoint.x - x;
            circle.targetY = 2 * targetPoint.y - y;
            this.tweens.add({
                targets: circle,
                x: circle.targetX,
                y: circle.targetY,
                duration: movementDuration,
                ease: 'Linear',
                onUpdate: function () {
                    const distanceToTarget = Phaser.Math.Distance.Between(circle.x, circle.y, targetPoint.x, targetPoint.y);
                    // Adjust alpha based on distance to target
                    if (distanceToTarget < nearTargetDistance) {
                        circle.setFillStyle(nearTargetColor);
                        circle.alpha = 1;
                    } else {
                        const totalDistance = Phaser.Math.Distance.Between(x, y, circle.targetX, circle.targetY);
                        circle.alpha = 1 - (distanceToTarget / totalDistance);
                    }
                },
                onComplete: () => {
                    circle.alpha = 0;
                }
            });
            circles.push(circle);
        },
        loop: true
    });

    // Expanding and fading out near-target circles on click
    this.input.on('pointerdown', () => {
        circles.forEach((circle) => {
            const distanceToTarget = Phaser.Math.Distance.Between(circle.x, circle.y, targetPoint.x, targetPoint.y);
            if (distanceToTarget < nearTargetDistance) {
                const previousX = circle.x;
                const previousY = circle.y;
                
                // Create a temporary dot where the green circle was
                const tempDot = this.add.circle(previousX, previousY, circleSize / 2, 0xffffff);
                this.tweens.add({
                    targets: tempDot,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        tempDot.destroy();
                    }
                });
                
                // Animate and destroy the circle
                this.tweens.add({
                    targets: circle,
                    scaleX: 2,
                    scaleY: 2,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        circle.destroy();
                    }
                });

                // Add particle explosion effect with rainbow colors and a smoother fade out
                const particles = this.add.particles('particle');
                const emitter = particles.createEmitter({
                    x: previousX,
                    y: previousY,
                    speed: { min: 20, max: 50 },
                    lifespan: { min: 1000, max: 1500 },
                    quantity: 5,
                    scale: { start: 0.5, end: 0 },
                    alpha: { start: 1, end: 0 },
                    tint: [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0x8f00ff], // Rainbow colors
                    blendMode: 'ADD',
                    frequency: -1
                });
                emitter.explode(5, previousX, previousY); // Trigger immediate emission for smoother fading
                this.time.delayedCall(1500, () => {
                    particles.destroy();
                });
            }
        });
        circles = circles.filter(circle => circle.active);
    });
}

function resize(gameSize) {
    if (gameSize.width && gameSize.height) {
        this.cameras.resize(gameSize.width, gameSize.height);
    }
}

function update() {}
