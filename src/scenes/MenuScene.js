import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Background layers with parallax
        this.bg1 = this.add.tileSprite(640, 360, 2560, 720, 'bg-layer-1').setScrollFactor(0);
        this.bg2 = this.add.tileSprite(640, 360, 2560, 720, 'bg-layer-2').setScrollFactor(0);
        this.bg3 = this.add.tileSprite(640, 360, 2560, 720, 'bg-layer-3').setScrollFactor(0);

        // Title
        this.add.text(640, 180, 'ALMA', {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '64px',
            color: '#e94560',
            stroke: '#000000',
            strokeThickness: 6,
        }).setOrigin(0.5);

        this.add.text(640, 250, 'AVENTURA FAMILIAR', {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '24px',
            color: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);

        // Alma character preview (poses sheet, fotograma de pie)
        this.almaPreview = this.add.sprite(640, 420, 'alma-poses', 0).setScale(1.2);
        this.almaPreview.play('alma-idle');
        // respiración suave
        this.tweens.add({
            targets: this.almaPreview,
            scaleY: 1.2 * 1.02,
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Start button
        const startBtn = this.add.text(640, 520, 'TAP PARA JUGAR', {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#e94560',
            strokeThickness: 3,
            backgroundColor: '#e94560',
            padding: { x: 30, y: 15 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        startBtn.on('pointerover', () => {
            startBtn.setStyle({ backgroundColor: '#ff6b81', color: '#fff' });
        });
        startBtn.on('pointerout', () => {
            startBtn.setStyle({ backgroundColor: '#e94560', color: '#fff' });
        });
        startBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // Keyboard start
        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
        this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene'));

        // Touch start
        this.input.once('pointerdown', (pointer) => {
            if (!startBtn.getBounds().contains(pointer.x, pointer.y)) {
                this.scene.start('GameScene');
            }
        });

        // Credits
        this.add.text(640, 650, 'Hecho con ❤️ para Alma (6 años)', {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '12px',
            color: '#888888',
        }).setOrigin(0.5);

        // Animate background
        this.tweens.add({
            targets: [this.bg2, this.bg3],
            tilePositionX: 2560,
            duration: 60000,
            repeat: -1,
            ease: 'Linear',
        });
    }

    update() {
        this.bg1.tilePositionX += 0.1;
        this.bg2.tilePositionX += 0.2;
        this.bg3.tilePositionX += 0.3;
    }
}