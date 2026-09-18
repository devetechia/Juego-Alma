export class TouchControls {
    constructor(scene) {
        this.scene = scene;
        this.left = false;
        this.right = false;
        this.jumpPressed = false;
        this.jumpHeld = false;
        this.crouch = false;
        this.startPressed = false;

        this.createButtons();
        this.setupEvents();
    }

    createButtons() {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;
        const btnSize = Math.min(88, width / 7);
        const margin = 22;
        const bottomMargin = 34;
        const S = btnSize / 128; // los PNG de botón son 128x128

        // Izquierda
        this.btnLeft = this.scene.add.image(margin + btnSize / 2, height - bottomMargin - btnSize / 2, 'btn-left')
            .setScale(S).setScrollFactor(0).setDepth(100).setAlpha(0.75)
            .setInteractive({ useHandCursor: false });

        // Derecha
        this.btnRight = this.scene.add.image(margin * 2 + btnSize * 1.5, height - bottomMargin - btnSize / 2, 'btn-right')
            .setScale(S).setScrollFactor(0).setDepth(100).setAlpha(0.75)
            .setInteractive({ useHandCursor: false });

        // Salto (derecha)
        this.btnJump = this.scene.add.image(width - margin - btnSize / 2, height - bottomMargin - btnSize / 2, 'btn-jump')
            .setScale(S).setScrollFactor(0).setDepth(100).setAlpha(0.85)
            .setInteractive({ useHandCursor: false });

        // Agacharse (encima del salto)
        this.btnCrouch = this.scene.add.image(width - margin - btnSize / 2, height - bottomMargin * 2 - btnSize * 1.5, 'btn-crouch')
            .setScale(S).setScrollFactor(0).setDepth(100).setAlpha(0.7)
            .setInteractive({ useHandCursor: false });

        // Empezar ocultos (se muestran según el tamaño de pantalla)
        this.btnSize = btnSize;
        this.updateVisibility(this.scene.cameras.main);
    }

    setupEvents() {
        // Left button
        this.btnLeft.on('pointerdown', () => { this.left = true; });
        this.btnLeft.on('pointerup', () => { this.left = false; });
        this.btnLeft.on('pointerout', () => { this.left = false; });

        // Right button
        this.btnRight.on('pointerdown', () => { this.right = true; });
        this.btnRight.on('pointerup', () => { this.right = false; });
        this.btnRight.on('pointerout', () => { this.right = false; });

        // Jump button
        this.btnJump.on('pointerdown', () => {
            this.jumpPressed = true;
            this.jumpHeld = true;
            // Reset jumpPressed after one frame
            this.scene.time.delayedCall(16, () => { this.jumpPressed = false; });
        });
        this.btnJump.on('pointerup', () => { this.jumpHeld = false; });
        this.btnJump.on('pointerout', () => { this.jumpHeld = false; });

        // Crouch button
        this.btnCrouch.on('pointerdown', () => { this.crouch = true; });
        this.btnCrouch.on('pointerup', () => { this.crouch = false; });
        this.btnCrouch.on('pointerout', () => { this.crouch = false; });

        // Handle window resize
        this.scene.scale.on('resize', (gameSize) => {
            this.repositionButtons(gameSize);
        });
    }

    repositionButtons(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;
        const btnSize = Math.min(88, width / 7);
        const margin = 22;
        const bottomMargin = 34;
        const S = btnSize / 128;

        this.btnLeft.setPosition(margin + btnSize / 2, height - bottomMargin - btnSize / 2);
        this.btnRight.setPosition(margin * 2 + btnSize * 1.5, height - bottomMargin - btnSize / 2);
        this.btnJump.setPosition(width - margin - btnSize / 2, height - bottomMargin - btnSize / 2);
        this.btnCrouch.setPosition(width - margin - btnSize / 2, height - bottomMargin * 2 - btnSize * 1.5);

        [this.btnLeft, this.btnRight, this.btnJump, this.btnCrouch].forEach(btn => btn.setScale(S));
    }

    updateVisibility(camera) {
        // OJO: scale.width es la resolución interna del juego (1280), no el tamaño CSS.
        // Hay que mirar si el dispositivo tiene pantalla táctil (móvil/tablet).
        const isTouch = this.scene.sys.game.device.input.touch || window.innerWidth <= 1024;
        const visible = isTouch && this.scene.scene.key === 'GameScene';

        this.btnLeft.setVisible(visible);
        this.btnRight.setVisible(visible);
        this.btnJump.setVisible(visible);
        this.btnCrouch.setVisible(visible);

        if (!visible) {
            this.left = false;
            this.right = false;
            this.jumpPressed = false;
            this.jumpHeld = false;
            this.crouch = false;
        }
    }

    destroy() {
        [this.btnLeft, this.btnRight, this.btnJump, this.btnCrouch].forEach(btn => {
            if (btn) btn.destroy();
        });
    }
}