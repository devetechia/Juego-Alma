import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Loading progress bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(440, 330, 400, 50);

        const loadingText = this.add.text(640, 300, 'CARGANDO ASSETS', {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '20px',
            color: '#ffffff',
        }).setOrigin(0.5);

        const percentText = this.add.text(640, 380, '0%', {
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '18px',
            color: '#e94560',
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xe94560, 1);
            progressBar.fillRect(450, 340, 380 * value, 30);
            percentText.setText(`${Math.round(value * 100)}%`);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        // ==================== ALMA (poses sheet) ====================
        // 9 poses extraídas de sprites.png: celda 170x210
        // 0=cadera 1=brazos abajo 2=corriendo 3=patada 4=brazos abajo
        // 5=saltando 6=brazos abajo 7=señalando 8=aterrizaje
        this.load.spritesheet('alma-poses', 'assets/sprites/alma-poses.png', {
            frameWidth: 170,
            frameHeight: 210,
        });

        // Enemies (family members)
        this.load.spritesheet('enemy-tio', 'assets/sprites/enemy-tio.png', {
            frameWidth: 100,
            frameHeight: 120,
        });
        this.load.spritesheet('enemy-abuelo', 'assets/sprites/enemy-abuelo.png', {
            frameWidth: 100,
            frameHeight: 120,
        });
        this.load.spritesheet('enemy-primo', 'assets/sprites/enemy-primo.png', {
            frameWidth: 100,
            frameHeight: 120,
        });
        this.load.spritesheet('enemy-mama', 'assets/sprites/enemy-mama.png', {
            frameWidth: 100,
            frameHeight: 120,
        });

        // Level tiles and backgrounds
        this.load.image('tile-ground', 'assets/sprites/tile-ground.png');
        this.load.image('tile-platform', 'assets/sprites/tile-platform.png');
        this.load.image('bg-layer-1', 'assets/sprites/bg-layer-1.png');
        this.load.image('bg-layer-2', 'assets/sprites/bg-layer-2.png');
        this.load.image('bg-layer-3', 'assets/sprites/bg-layer-3.png');

        // UI elements
        this.load.image('btn-left', 'assets/sprites/btn-left.png');
        this.load.image('btn-right', 'assets/sprites/btn-right.png');
        this.load.image('btn-jump', 'assets/sprites/btn-jump.png');
        this.load.image('btn-crouch', 'assets/sprites/btn-crouch.png');
        this.load.image('heart-full', 'assets/sprites/heart-full.png');
        this.load.image('heart-empty', 'assets/sprites/heart-empty.png');
        this.load.image('star', 'assets/sprites/star.png');
        this.load.image('cloud', 'assets/sprites/cloud.png');

        // Audio: aún no hay ficheros, se cargan si existen (no bloquean el arranque)
        // Cuando Jorge aporte los sonidos, basta con dejarlos en public/assets/audio/
    }

    create() {
        // Create animations from sprite sheets
        this.createAnimations();

        // Generate placeholder assets if missing (for development)
        this.generatePlaceholders();

        this.scene.start('MenuScene');
    }

    createAnimations() {
        // === Alma: animaciones basadas en poses (1 frame) ===
        // El movimiento "natural" se añade por código en Player.js (squash/stretch, balanceo)
        if (this.textures.exists('alma-poses')) {
            const poseAnim = (key, frame) => {
                this.anims.create({
                    key,
                    frames: this.anims.generateFrameNumbers('alma-poses', { frames: [frame] }),
                    frameRate: 1,
                    repeat: -1,
                });
            };
            poseAnim('alma-idle', 0);    // manos en caderas
            poseAnim('alma-run', 2);     // corriendo
            poseAnim('alma-jump', 5);    // saltando (en el aire)
            poseAnim('alma-fall', 5);    // cayendo (misma pose, inclinada por código)
            poseAnim('alma-crouch', 8);  // aterrizaje agachada
            poseAnim('alma-fight', 3);   // patada/puño
            poseAnim('alma-walk', 1);    // bravos abajo (andar suave)
            poseAnim('alma-point', 7);   // señalando
        }

        // Enemy animations (generic walk cycle)
        ['enemy-tio', 'enemy-abuelo', 'enemy-primo', 'enemy-mama'].forEach(key => {
            if (this.textures.exists(key)) {
                this.anims.create({
                    key: `${key}-walk`,
                    frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
                    frameRate: 8,
                    repeat: -1,
                });
            }
        });
    }

    generatePlaceholders() {
        // Generate placeholder graphics for missing assets
        const createPlaceholder = (key, width, height, color, label) => {
            if (!this.textures.exists(key)) {
                const graphics = this.add.graphics();
                graphics.fillStyle(color, 1);
                graphics.fillRoundedRect(0, 0, width, height, 8);
                graphics.fillStyle(0xffffff, 0.3);
                graphics.fillRect(0, height - 20, width, 20);
                graphics.generateTexture(key, width, height);
                graphics.destroy();
            }
        };

        // Player placeholders
        createPlaceholder('alma-idle', 120, 160, 0xe94560, 'Alma Idle');
        createPlaceholder('alma-run', 120, 160, 0xe94560, 'Alma Run');
        createPlaceholder('alma-jump', 120, 160, 0xff6b81, 'Alma Jump');
        createPlaceholder('alma-fall', 120, 160, 0xff6b81, 'Alma Fall');
        createPlaceholder('alma-crouch', 120, 160, 0xc0392b, 'Alma Crouch');

        // Enemy placeholders (different colors per family member)
        createPlaceholder('enemy-tio', 100, 120, 0x3498db, 'Tío');
        createPlaceholder('enemy-abuelo', 100, 120, 0x9b59b6, 'Abuelo');
        createPlaceholder('enemy-primo', 100, 120, 0xf39c12, 'Primo');
        createPlaceholder('enemy-mama', 100, 120, 0x2ecc71, 'Mamá');

        // Tile placeholders
        createPlaceholder('tile-ground', 64, 64, 0x495057, 'Ground');
        createPlaceholder('tile-platform', 64, 32, 0x6c757d, 'Platform');

        // Background layers
        const createBg = (key, color) => {
            if (!this.textures.exists(key)) {
                const graphics = this.add.graphics();
                graphics.fillGradientStyle(color, color, color, color, 1);
                graphics.fillRect(0, 0, 2560, 720);
                graphics.generateTexture(key, 2560, 720);
                graphics.destroy();
            }
        };
        createBg('bg-layer-1', 0x0d0d1a);
        createBg('bg-layer-2', 0x1a1a2e);
        createBg('bg-layer-3', 0x2d2d44);

        // UI placeholders
        createPlaceholder('btn-left', 80, 80, 0x333333, '←');
        createPlaceholder('btn-right', 80, 80, 0x333333, '→');
        createPlaceholder('btn-jump', 80, 80, 0xe94560, 'A');
        createPlaceholder('heart-full', 32, 32, 0xe94560, '♥');
        createPlaceholder('heart-empty', 32, 32, 0x333333, '♡');
        createPlaceholder('star', 32, 32, 0xf1c40f, '★');
    }
}