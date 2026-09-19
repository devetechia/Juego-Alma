import Phaser from 'phaser';

/**
 * Pantalla final. Se coloca segun el tamano vivo de la ventana y se recoloca al girar.
 */
export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.won = data.won || false;
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.82).setOrigin(0).setDepth(10);

        this.titulo = this.add.text(0, 0, this.won ? '¡FELICIDADES ALMA!' : 'GAME OVER', {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: this.won ? '36px' : '48px',
            color: this.won ? '#2ecc71' : '#e94560',
            stroke: '#000000',
            strokeThickness: 5,
        }).setOrigin(0.5).setDepth(20);

        this.subtitulo = this.add.text(0, 0, this.won ? 'Has completado la aventura' : 'Los familiares te atraparon...', {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5).setDepth(20);

        this.scoreText = this.add.text(0, 0, `ESTRELLAS: ${this.finalScore}`, {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '28px',
            color: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5).setDepth(20);

        this.restartBtn = this.add.text(0, 0, 'JUGAR DE NUEVO', {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#e94560',
            strokeThickness: 3,
            backgroundColor: '#e94560',
            padding: { x: 30, y: 15 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(20);
        this.restartBtn.on('pointerdown', () => this.scene.start('GameScene'));

        this.menuBtn = this.add.text(0, 0, 'MENÚ PRINCIPAL', {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '18px',
            color: '#e94560',
            stroke: '#ffffff',
            strokeThickness: 2,
            padding: { x: 20, y: 10 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(20);
        this.menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));

        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
        this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene'));
        this.input.keyboard.once('keydown-ESC', () => this.scene.start('MenuScene'));

        this.input.once('pointerdown', (pointer) => {
            if (!this.restartBtn.getBounds().contains(pointer.x, pointer.y) &&
                !this.menuBtn.getBounds().contains(pointer.x, pointer.y)) {
                this.scene.start('GameScene');
            }
        });

        if (this.won) this.createConfetti();

        this.layout();
        this.scale.on('resize', this.layout, this);
        this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
    }

    layout() {
        const w = this.scale.width;
        const h = this.scale.height;
        const s = Phaser.Math.Clamp(Math.min(w / 1280, h / 720), 0.5, 1.5);

        this.overlay.setSize(w, h);
        this.titulo.setPosition(w / 2, h * 0.22).setScale(s);
        this.subtitulo.setPosition(w / 2, h * 0.34).setScale(s);
        this.scoreText.setPosition(w / 2, h * 0.47).setScale(s);
        this.restartBtn.setPosition(w / 2, h * 0.63).setScale(s);
        this.menuBtn.setPosition(w / 2, h * 0.77).setScale(s);
    }

    createConfetti() {
        const w = this.scale.width;
        const h = this.scale.height;
        for (let i = 0; i < 60; i++) {
            const x = Phaser.Math.Between(0, w);
            const y = Phaser.Math.Between(-h * 0.3, 0);
            const color = Phaser.Math.RND.pick([0xe94560, 0xf1c40f, 0x3498db, 0x2ecc71, 0x9b59b6, 0xff6b81]);
            const particle = this.add.circle(x, y, Phaser.Math.Between(4, 10), color).setDepth(15);

            this.tweens.add({
                targets: particle,
                y: h + 80,
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
