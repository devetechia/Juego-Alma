import Phaser from 'phaser';

export class Enemy {
    constructor(scene, x, y, range, speed, textureKey, name) {
        this.scene = scene;
        this.range = range;
        this.speed = speed;
        this.startX = x;
        this.name = name;
        this.textureKey = textureKey;
        this.defeated = false;

        // Create sprite
        this.sprite = scene.physics.add.sprite(x, y, textureKey);
        this.sprite.setScale(1);
        this.sprite.setDepth(10);
        this.sprite.setSize(70, 100);
        this.sprite.setOffset(15, 20);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setImmovable(false);
        this.sprite.body.setMaxVelocity(speed * 2, 1000);
        this.sprite.body.setDragX(500);

        // Store reference for collision callbacks
        this.sprite.enemyRef = this;

        // Direction
        this.direction = 1; // 1 = right, -1 = left
        this.sprite.setFlipX(this.direction === -1);

        // Patrol bounds
        this.leftBound = x - range;
        this.rightBound = x + range;

        // State
        this.stunned = false;
        this.stunTimer = 0;

        // Animation
        this.currentAnim = 'walk';
        if (this.sprite.anims.get(`${textureKey}-walk`)) {
            this.sprite.play(`${textureKey}-walk`, true);
        }
    }

    update(player) {
        if (this.defeated || this.stunned) {
            if (this.stunned) {
                this.stunTimer -= this.scene.game.loop.delta;
                if (this.stunTimer <= 0) {
                    this.stunned = false;
                    this.sprite.body.setVelocityX(0);
                }
            }
            return;
        }

        // Patrol behavior
        this.sprite.body.velocity.x = this.direction * this.speed;

        // Check bounds and flip
        if (this.sprite.x <= this.leftBound) {
            this.direction = 1;
            this.sprite.setFlipX(false);
        } else if (this.sprite.x >= this.rightBound) {
            this.direction = -1;
            this.sprite.setFlipX(true);
        }

        // Face player when close (aggro)
        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            player.x, player.y
        );

        if (distanceToPlayer < 300 && !this.stunned) {
            // Turn towards player
            const shouldFaceRight = player.x > this.sprite.x;
            this.sprite.setFlipX(!shouldFaceRight);
        }

        // Animation is handled by the walk animation playing continuously
    }

    stomp() {
        if (this.defeated) return;

        this.defeated = true;
        this.sprite.body.enable = false;
        this.sprite.body.velocity.x = 0;

        // Squish animation
        this.scene.tweens.add({
            targets: this.sprite,
            scaleY: 0.2,
            scaleX: 1.3,
            y: this.sprite.y + 30,
            duration: 150,
            ease: 'Power2',
            yoyo: true,
            onComplete: () => {
                this.scene.tweens.add({
                    targets: this.sprite,
                    alpha: 0,
                    scaleY: 0.1,
                    y: this.sprite.y + 40,
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => this.sprite.destroy(),
                });
            },
        });
    }

    stun(duration = 1000) {
        if (this.defeated) return;
        this.stunned = true;
        this.stunTimer = duration;
        this.sprite.body.velocity.x = 0;
        this.sprite.setTint(0xffffff);
        this.scene.tweens.add({
            targets: this.sprite,
            tint: 0x888888,
            duration: 100,
            yoyo: true,
            repeat: duration / 200,
        });
    }
}