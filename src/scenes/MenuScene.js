import Phaser from 'phaser';

/**
 * Menu inicial. Todo se coloca segun el tamano real de la ventana y se recoloca al girar
 * el dispositivo, para que no queden franjas negras ni elementos fuera de pantalla.
 */
export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        this.bg1 = this.add.tileSprite(0, 0, 100, 100, 'bg-layer-1').setOrigin(0).setScrollFactor(0);
        this.bg2 = this.add.tileSprite(0, 0, 100, 100, 'bg-layer-2').setOrigin(0).setScrollFactor(0);
        this.bg3 = this.add.tileSprite(0, 0, 100, 100, 'bg-layer-3').setOrigin(0).setScrollFactor(0);

        this.title = this.add.text(0, 0, 'ALMA', {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '64px',
            color: '#e94560',
            stroke: '#000000',
            strokeThickness: 6,
        }).setOrigin(0.5);

        this.subtitle = this.add.text(0, 0, 'AVENTURA FAMILIAR', {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '24px',
            color: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);

        this.almaPreview = this.add.sprite(0, 0, 'alma-poses', 0).setScale(1.2);
        if (this.anims.exists('alma-idle')) this.almaPreview.play('alma-idle');
        this.previewScale = 1.2;

        this.startBtn = this.add.text(0, 0, 'TAP PARA JUGAR', {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#e94560',
            strokeThickness: 3,
            backgroundColor: '#e94560',
            padding: { x: 30, y: 15 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.startBtn.on('pointerdown', () => this.empezar());

        this.credits = this.add.text(0, 0, 'Hecho con ❤️ para Alma', {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '12px',
            color: '#888888',
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => this.empezar());
        this.input.keyboard.once('keydown-ENTER', () => this.empezar());

        this.input.once('pointerdown', (pointer) => {
            if (!this.startBtn.getBounds().contains(pointer.x, pointer.y)) this.empezar();
        });

        this.tweens.add({
            targets: [this.bg2, this.bg3],
            tilePositionX: 2560,
            duration: 60000,
            repeat: -1,
            ease: 'Linear',
        });

        this.layout();
        this.scale.on('resize', this.layout, this);
        this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
    }

    /** Coloca todo en funcion del tamano vivo de la ventana. */
    layout() {
        const w = this.scale.width;
        const h = this.scale.height;
        const base = Math.min(w / 1280, h / 720);           // escala relativa al diseno original
        const s = Phaser.Math.Clamp(base, 0.55, 1.6);

        const cx = w / 2;
        const top = h * 0.12;
        const paso = h * 0.075;

        [this.bg1, this.bg2, this.bg3].forEach(bg => {
            bg.setPosition(0, 0).setSize(w + 8, h + 8);
        });

        this.title.setPosition(cx, top + 40 * s).setScale(s);
        this.subtitle.setPosition(cx, top + 100 * s).setScale(s * 0.9);
        this.previewScale = 1.2 * s;
        this.almaPreview.setPosition(cx, top + 260 * s).setScale(this.previewScale);
        this.startBtn.setPosition(cx, h - Math.max(150, paso * 3.2)).setScale(s);
        this.credits.setPosition(cx, h - Math.max(40, paso * 0.7)).setScale(s);
    }

    empezar() {
        if (this.yaEmpezado) return;
        this.yaEmpezado = true;
        this.scene.start('GameScene');
    }

    update() {
        this.bg1.tilePositionX += 0.1;
        this.bg2.tilePositionX += 0.2;
        this.bg3.tilePositionX += 0.3;

        // respiracion suave del personaje
        const t = this.time.now * 0.006;
        this.almaPreview.scaleY = this.previewScale * (1 + 0.02 * Math.sin(t));
        this.almaPreview.scaleX = this.previewScale * (1 - 0.012 * Math.sin(t));
    }
}
