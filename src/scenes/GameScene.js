import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { TouchControls } from '../utils/TouchControls.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Initialize game state
        this.lives = 3;
        this.score = 0;
        this.levelWidth = 5000;
        this.gameOver = false;

        // Create background layers (parallax)
        this.createBackgrounds();

        // Create level geometry
        this.createLevel();

        // Create player
        this.player = new Player(this, 100, 500);
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, this.levelWidth, 720);
        this.cameras.main.setDeadzone(300, 200);

        // Create enemies
        this.createEnemies();

        // Create collectibles
        this.createCollectibles();

        // Setup collisions
        this.setupCollisions();

        // Setup input
        this.setupInput();

        // Create mobile touch controls
        this.touchControls = new TouchControls(this);

        // Create UI
        this.createUI();

        // Chispas al recoger estrellas
        this.sparkParticles = this.add.particles(0, 0, 'star', {
            lifespan: 500,
            speed: { min: 40, max: 140 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            blendMode: 'ADD',
            emitting: false,
            depth: 12,
            tint: 0xffe066,
        });

        // Camera shake on hit
        this.cameras.main.on('camerashake', () => {
            this.time.delayedCall(200, () => this.cameras.main.shake(100, 0.01));
        });
    }

    createBackgrounds() {
        // Paralaje de 3 capas + nubes a la deriva
        this.bgLayers = [
            this.add.tileSprite(640, 360, 2560, 720, 'bg-layer-1').setScrollFactor(0).setDepth(-20),
            this.add.tileSprite(640, 360, 2560, 720, 'bg-layer-2').setScrollFactor(0.15).setDepth(-19),
            this.add.tileSprite(640, 360, 2560, 720, 'bg-layer-3').setScrollFactor(0.35).setDepth(-18),
        ];

        // Nubes: se mueven solas y además tienen paralaje
        this.clouds = [];
        for (let i = 0; i < 8; i++) {
            const c = this.add.image(Phaser.Math.Between(0, this.levelWidth), Phaser.Math.Between(60, 260), 'cloud')
                .setScrollFactor(0.25)
                .setDepth(-19)
                .setAlpha(Phaser.Math.FloatBetween(0.55, 0.9))
                .setScale(Phaser.Math.FloatBetween(0.6, 1.2));
            this.clouds.push(c);
        }
    }

    createLevel() {
        // Ground tiles
        this.groundGroup = this.physics.add.staticGroup();

        // Main ground
        for (let x = 0; x < this.levelWidth; x += 64) {
            const ground = this.groundGroup.create(x + 32, 688, 'tile-ground').setScale(1).refreshBody();
            ground.setImmovable(true);
        }

        // Platforms - create interesting platform layout
        const platforms = [
            // Format: [x, y, count, gap]
            [300, 550, 3, 64],
            [600, 450, 2, 64],
            [900, 400, 4, 64],
            [1300, 500, 3, 64],
            [1600, 350, 2, 64],
            [1900, 450, 3, 64],
            [2300, 400, 2, 64],
            [2600, 300, 3, 64],
            [3000, 500, 4, 64],
            [3400, 400, 3, 64],
            [3800, 350, 2, 64],
            [4200, 450, 3, 64],
            [4600, 300, 2, 64],
        ];

        this.platformGroup = this.physics.add.staticGroup();

        platforms.forEach(([x, y, count, gap]) => {
            for (let i = 0; i < count; i++) {
                const platform = this.platformGroup.create(x + i * gap, y, 'tile-platform').setScale(1).refreshBody();
                platform.setImmovable(true);
            }
        });

        // Add some decorative elements
        this.decorGroup = this.add.group();
    }

    createEnemies() {
        this.enemies = this.physics.add.group();

        // Family members as enemies with different behaviors
        const enemyData = [
            { x: 500, y: 510, range: 150, speed: 60, type: 'enemy-tio', name: 'Tío Carlos' },
            { x: 1000, y: 360, range: 200, speed: 80, type: 'enemy-primo', name: 'Primo Lucas' },
            { x: 1400, y: 460, range: 100, speed: 50, type: 'enemy-abuelo', name: 'Abuelo José' },
            { x: 2000, y: 310, range: 180, speed: 90, type: 'enemy-primo', name: 'Primo Mateo' },
            { x: 2400, y: 460, range: 120, speed: 55, type: 'enemy-tio', name: 'Tío Miguel' },
            { x: 2800, y: 260, range: 150, speed: 70, type: 'enemy-mama', name: 'Mamá (boss)' },
            { x: 3200, y: 460, range: 100, speed: 60, type: 'enemy-abuelo', name: 'Abuelo Pedro' },
            { x: 3600, y: 360, range: 200, speed: 85, type: 'enemy-primo', name: 'Primo Diego' },
            { x: 4000, y: 410, range: 150, speed: 65, type: 'enemy-tio', name: 'Tío Andrés' },
            { x: 4400, y: 260, range: 180, speed: 95, type: 'enemy-mama', name: 'Mamá (final)' },
        ];

        enemyData.forEach(data => {
            const enemy = new Enemy(this, data.x, data.y, data.range, data.speed, data.type, data.name);
            this.enemies.add(enemy.sprite);
        });
    }

    createCollectibles() {
        this.stars = this.physics.add.group();

        const starPositions = [
            400, 700, 1100, 1500, 1800, 2200, 2700, 3100, 3500, 3900, 4300, 4700
        ];

        starPositions.forEach(x => {
            const star = this.stars.create(x, 200, 'star').setScale(0.8);
            star.setBounceY(Phaser.Math.FloatBetween(0.2, 0.4));
            star.setCollideWorldBounds(true);
            star.body.allowGravity = true;
        });
    }

    setupCollisions() {
        // Player vs ground/platforms
        this.physics.add.collider(this.player.sprite, this.groundGroup);
        this.physics.add.collider(this.player.sprite, this.platformGroup);

        // Enemies vs ground/platforms
        this.physics.add.collider(this.enemies, this.groundGroup);
        this.physics.add.collider(this.enemies, this.platformGroup);

        // Player vs enemies (hurt)
        this.physics.add.overlap(this.player.sprite, this.enemies, this.hitEnemy, null, this);

        // Player vs stars (collect)
        this.physics.add.overlap(this.player.sprite, this.stars, this.collectStar, null, this);

        // Stars vs ground
        this.physics.add.collider(this.stars, this.groundGroup);
        this.physics.add.collider(this.stars, this.platformGroup);
    }

    setupInput() {
        // Keyboard
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        // Prevent space from scrolling page
        this.input.keyboard.addCapture(['SPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT']);
    }

    createUI() {
        // Lives (hearts)
        this.heartIcons = [];
        for (let i = 0; i < 3; i++) {
            const heart = this.add.image(50 + i * 40, 50, 'heart-full').setScrollFactor(0).setDepth(100).setScale(1.2);
            this.heartIcons.push(heart);
        }

        // Score
        this.scoreText = this.add.text(1150, 30, 'ESTRELLAS: 0', {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '16px',
            color: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 3,
        }).setScrollFactor(0).setDepth(100).setOrigin(1, 0);

        // Level progress
        this.progressText = this.add.text(640, 30, 'PROGRESO: 0%', {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
        }).setScrollFactor(0).setDepth(100).setOrigin(0.5, 0);
    }

    hitEnemy(player, enemy) {
        if (this.player.invulnerable || this.gameOver) return;

        // ¿Le está cayendo encima? (pisar al familiar)
        const playerBottom = player.body.bottom;
        const enemyTop = enemy.body.top;

        if (player.body.velocity.y > 0 && playerBottom < enemyTop + 26) {
            this.stompEnemy(enemy);
            return;
        }

        // Si es invulnerable, no vuelve a recibir daño
        if (this.player.invulnerable) return;

        // Alma recibe daño
        this.player.takeDamage();
        this.cameras.main.shake(150, 0.02);
        this.updateHearts();

        if (this.player.lives <= 0) {
            this.gameOver = true;
            this.player.die();
            this.time.delayedCall(1500, () => {
                this.scene.start('GameOverScene', { score: this.score, won: false });
            });
        }
    }

    stompEnemy(enemy) {
        // Rebote al pisar
        this.player.sprite.body.velocity.y = -380;

        // El familiar se aplasta y desaparece
        const key = enemy.texture.key;
        if (enemy.anims.get(`${key}-walk`)) enemy.play(`${key}-walk`, true);
        this.tweens.add({
            targets: enemy,
            alpha: 0,
            scaleY: 0.15,
            y: enemy.y + 18,
            duration: 320,
            ease: 'Power2',
            onComplete: () => enemy.destroy(),
        });

        this.score += 100;
        this.scoreText.setText(`ESTRELLAS: ${this.score}`);

        if (this.sound.get('sfx-coin')) {
            this.sound.play('sfx-coin', { volume: 0.3 });
        }
    }

    collectStar(player, star) {
        const sx = star.x, sy = star.y;
        star.destroy();
        this.score += 50;
        this.scoreText.setText(`ESTRELLAS: ${this.score}`);

        // Chispas al recoger
        this.sparkParticles.explode(10, sx, sy);

        if (this.sound.get('sfx-coin')) {
            this.sound.play('sfx-coin', { volume: 0.2 });
        }
    }

    updateHearts() {
        const lives = this.player ? this.player.lives : 0;
        this.heartIcons.forEach((heart, index) => {
            heart.setTexture(index < lives ? 'heart-full' : 'heart-empty');
        });
    }

    update(time, delta) {
        if (this.gameOver) return;

        // Update player
        this.player.update(this.cursors, this.keyW, this.keyA, this.keyD, this.keySpace, this.keyShift, this.touchControls);

        // Update enemies
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active && enemy.update) {
                enemy.update(this.player.sprite);
            }
        });

        // Update parallax backgrounds
        const camX = this.cameras.main.scrollX;
        this.bgLayers[0].tilePositionX = camX * 0.05;
        this.bgLayers[1].tilePositionX = camX * 0.15;
        this.bgLayers[2].tilePositionX = camX * 0.35;

        // Nubes a la deriva
        this.clouds.forEach(c => {
            c.x -= 0.12 * (delta / 16.67);
            if (c.x < -250) c.x = this.levelWidth + Phaser.Math.Between(0, 400);
        });

        // Update progress
        const progress = Math.min(100, Math.round((this.player.sprite.x / this.levelWidth) * 100));
        this.progressText.setText(`PROGRESO: ${progress}%`);

        // Check win condition
        if (this.player.sprite.x >= this.levelWidth - 200) {
            this.winGame();
        }

        // Update touch controls visibility
        this.touchControls.updateVisibility(this.cameras.main);
    }

    winGame() {
        this.gameOver = true;
        this.player.win();
        this.score += 1000; // Bonus for completing
        this.time.delayedCall(2000, () => {
            this.scene.start('GameOverScene', { score: this.score, won: true });
        });
    }
}