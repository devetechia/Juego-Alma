import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Nada que precargar: el fondo de carga se genera por código
    }

    create() {
        // Create a simple loading background if it doesn't exist
        if (!this.textures.exists('loading-bg')) {
            const graphics = this.add.graphics();
            graphics.fillStyle(0x1a1a2e, 1);
            graphics.fillRect(0, 0, 1280, 720);
            graphics.generateTexture('loading-bg', 1280, 720);
            graphics.destroy();
        }

        // Add loading text
        this.add.text(640, 360, 'CARGANDO...', {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '32px',
            color: '#e94560',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);

        // Start preload scene
        this.scene.start('PreloadScene');
    }
}