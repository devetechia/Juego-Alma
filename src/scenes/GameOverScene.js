import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.won = data.won || false;
    }

    create() {
        // Dark overlay
        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.8).setDepth(10);

        if (this.won) {
            // Victory
            this.add.text(640, 200, '¡FELICIDADES ALMA!', {
                fontFamily: 'Press Start 2P, cursive',
                fontSize: '36px',
                color: '#2ecc71',
                stroke: '#000000',
                strokeThickness: 5,
            }).setOrigin(0.5).setDepth(20);

            this.add.text(640, 270, 'Has completado la aventura', {
                fontFamily: 'Press Start 2P, cursive',
                fontSize: '18px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
            }).setOrigin(0.5).setDepth(20);

            // Celebration animation
            this.createConfetti();
        } else {
            // Game Over
            this.add.text(640, 200, 'GAME OVER', {
                fontFamily: 'Press Start 2P, cursive',
                fontSize: '48px',
                color: '#e94560',
                stroke: '#000000',
                strokeThickness: 6,
            }).setOrigin(0.5).setDepth(20);

            this.add.text(640, 270, 'Los familiares te atraparon...', {
                fontFamily: 'Press Start 2P, cursive',
                fontSize: '16px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
            }).setOrigin(0.5).setDepth(20);
        }

        // Score
        this.add.text(640, 350, `ESTRELLAS: ${this.finalScore}`, {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '28px',
            color: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5).setDepth(20);

        // Restart button
        const restartBtn = this.add.text(640, 450, 'JUGAR DE NUEVO', {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#e94560',
            strokeThickness: 3,
            backgroundColor: '#e94560',
            padding: { x: 30, y: 15 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(20);

        restartBtn.on('pointerover', () => {
            restartBtn.setStyle({ backgroundColor: '#ff6b81', color: '#fff' });
        });
        restartBtn.on('pointerout', () => {
            restartBtn.setStyle({ backgroundColor: '#e94560', color: '#fff' });
        });
        restartBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // Menu button
        const menuBtn = this.add.text(640, 530, 'MENÚ PRINCIPAL', {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '18px',
            color: '#e94560',
            stroke: '#ffffff',
            strokeThickness: 2,
            backgroundColor: 'transparent',
            padding: { x: 20, y: 10 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(20);

        menuBtn.on('pointerover', () => {
            menuBtn.setStyle({ color: '#ff6b81', stroke: '#fff' });
        });
        menuBtn.on('pointerout', () => {
            menuBtn.setStyle({ color: '#e94560', stroke: '#fff' });
        });
        menuBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        // Keyboard shortcuts
        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
        this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene'));
        this.input.keyboard.once('keydown-ESC', () => this.scene.start('MenuScene'));

        // Touch to restart
        this.input.once('pointerdown', (pointer) => {
            if (!restartBtn.getBounds().contains(pointer.x, pointer.y) &&
                !menuBtn.getBounds().contains(pointer.x, pointer.y)) {
                this.scene.start('GameScene');
            }
        });
    }

    createConfetti() {
        // Simple particle burst for celebration
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(100, 1180);
            const y = Phaser.Math.Between(-100, 0);
            const color = Phaser.Math.RND.pick([0xe94560, 0xf1c40f, 0x3498db, 0x2ecc71, 0x9b59b6, 0xff6b81]);

            const particle = this.add.circle(x, y, Phaser.Math.Between(4, 10), color).setDepth(15);

            this.tweens.add({
                targets: particle,
                y: 800,
                x: particle.x + Phaser.Math.Between(-200, 200),
                rotation: Phaser.Math.FloatBetween(-4, 4),
                alpha: 0,
                duration: Phaser.Math.Between(2000, 4000),
                ease: 'Power1',
                delay: Phaser.Math.Between(0, 500),
                onComplete: () => particle.destroy(),
            });
        }
    }
}