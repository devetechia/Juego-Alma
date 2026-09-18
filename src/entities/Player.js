import Phaser from 'phaser';

/**
 * Alma - jugadora.
 *
 * Diseño: separamos FÍSICA de VISUAL.
 *  - this.sprite : cuerpo físico invisible (colisión/cámara), tamaño estable.
 *  - this.visual : el dibujo de Alma (poses reales) con squash/stretch y balanceo.
 * Así el movimiento se siente natural sin que el hitbox oscile: importante para una niña de 6 años,
 * los golpes deben ser predecibles y justos.
 */
export class Player {
    constructor(scene, x, y) {
        this.scene = scene;

        // ---- Cuerpo físico (invisible) ----
        this.sprite = scene.physics.add.sprite(x, y, 'alma-poses', 0);
        this.sprite.setVisible(false);
        this.sprite.setSize(64, 150);      // caja generosa, a la altura de los pies
        this.sprite.setOffset(53, 54);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setMaxVelocity(420, 1100);
        this.sprite.body.setDragX(800);

        // ---- Visual ----
        this.BASE_SCALE = 0.8;
        this.FEET_FROM_CENTER = 99;        // px de textura del centro del frame a los pies
        this.visual = scene.add.sprite(x, y, 'alma-poses', 0);
        this.visual.setScale(this.BASE_SCALE);
        this.visual.setDepth(10);
        this.visual.play('alma-idle');

        // ---- Movimiento ----
        this.RUN_SPEED = 250;
        this.JUMP_FORCE = -520;
        this.COYOTE_TIME = 130;
        this.JUMP_BUFFER = 110;

        this.facingRight = true;
        this.isGrounded = false;
        this.wasGrounded = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.crouching = false;
        this.currentAnim = 'alma-idle';

        this.maxLives = 3;
        this.lives = 3;

        this.createParticles();
    }

    createParticles() {
        const cfg = (tint, lifespan) => ({
            lifespan,
            speed: { min: 20, max: 80 },
            scale: { start: 0.35, end: 0 },
            alpha: { start: 0.7, end: 0 },
            blendMode: 'ADD',
            emitting: false,
            depth: 9,
            tint,
        });

        this.dustParticles = this.scene.add.particles(0, 0, 'star', cfg(0xffffff, 300));
        this.jumpParticles = this.scene.add.particles(0, 0, 'star', cfg(0xffe066, 400));
        this.landParticles = this.scene.add.particles(0, 0, 'star', cfg(0xffffff, 300));
    }

    /** Posición de los pies en el mundo */
    feetY() {
        return this.sprite.body ? this.sprite.body.bottom : this.sprite.y + this.FEET_FROM_CENTER;
    }

    update(cursors, keyW, keyA, keyD, keySpace, keyShift, touchControls) {
        if (!this.sprite.active) return;
        const delta = this.scene.game.loop.delta;
        const tc = touchControls || {};

        // Invulnerabilidad parpadeante
        if (this.invulnerable) {
            this.invulnerableTimer -= delta;
            this.visual.setAlpha(Math.sin(this.scene.time.now * 0.02) * 0.5 + 0.5);
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
                this.visual.setAlpha(1);
            }
        }

        // Suelo
        this.wasGrounded = this.isGrounded;
        this.isGrounded = this.sprite.body.blocked.down || this.sprite.body.touching.down;

        // Coyote time
        if (this.isGrounded) this.coyoteTimer = this.COYOTE_TIME;
        else this.coyoteTimer -= delta;

        // Entradas
        const jumpPressed = Phaser.Input.Keyboard.JustDown(keySpace) ||
            Phaser.Input.Keyboard.JustDown(keyW) ||
            Phaser.Input.Keyboard.JustDown(cursors.up) ||
            tc.jumpPressed;

        if (jumpPressed) this.jumpBufferTimer = this.JUMP_BUFFER;
        else this.jumpBufferTimer -= delta;

        const leftPressed = cursors.left.isDown || keyA.isDown || tc.left;
        const rightPressed = cursors.right.isDown || keyD.isDown || tc.right;
        const crouchPressed = cursors.down.isDown || keyShift.isDown || tc.crouch;

        let moveX = 0;
        if (leftPressed && !rightPressed) moveX = -1;
        else if (rightPressed && !leftPressed) moveX = 1;

        this.crouching = crouchPressed && this.isGrounded;
        if (this.crouching) {
            moveX = 0;
            this.sprite.body.setDragX(2200);
        } else {
            this.sprite.body.setDragX(800);
        }

        // Aceleración progresiva (no arranca de golpe)
        if (moveX !== 0) {
            this.facingRight = moveX > 0;
            const target = moveX * this.RUN_SPEED;
            const current = this.sprite.body.velocity.x;
            if (Math.abs(target) > Math.abs(current)) {
                this.sprite.body.setAccelerationX((this.isGrounded ? 1600 : 550) * moveX);
            } else {
                this.sprite.body.setAccelerationX(0);
            }
        } else {
            this.sprite.body.setAccelerationX(0);
        }

        // Salto (buffer + coyote)
        if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && !this.crouching) {
            this.jump();
            this.jumpBufferTimer = 0;
            this.coyoteTimer = 0;
        }

        // Altura de salto variable
        const holdingJump = keySpace.isDown || keyW.isDown || cursors.up.isDown || tc.jumpHeld;
        if (!holdingJump && this.sprite.body.velocity.y < -150) {
            this.sprite.body.velocity.y *= 0.55;
        }

        this.updateAnimation();
        this.syncVisual();
    }

    jump() {
        this.sprite.body.velocity.y = this.JUMP_FORCE;
        this.isGrounded = false;
        this.coyoteTimer = 0;
        this.jumpParticles.explode(8, this.sprite.x, this.feetY());
        if (this.scene.sound.get('sfx-jump')) {
            this.scene.sound.play('sfx-jump', { volume: 0.25 });
        }
    }

    updateAnimation() {
        let newAnim = 'alma-idle';

        if (!this.isGrounded) {
            newAnim = this.sprite.body.velocity.y < 0 ? 'alma-jump' : 'alma-fall';
        } else if (this.crouching) {
            newAnim = 'alma-crouch';
        } else if (Math.abs(this.sprite.body.velocity.x) > 20) {
            newAnim = 'alma-run';
        }

        if (newAnim !== this.currentAnim && this.visual.anims.get(newAnim)) {
            this.visual.play(newAnim, true);
            this.currentAnim = newAnim;
        }

        // Aterrizaje
        if (!this.wasGrounded && this.isGrounded) {
            this.landParticles.explode(6, this.sprite.x, this.feetY());
            if (this.scene.sound.get('sfx-land')) {
                this.scene.sound.play('sfx-land', { volume: 0.15 });
            }
        }

        // Polvo al correr
        if (this.isGrounded && Math.abs(this.sprite.body.velocity.x) > 60 && Phaser.Math.Between(1, 4) === 1) {
            this.dustParticles.emitParticleAt(
                this.sprite.x + (this.facingRight ? -18 : 18),
                this.feetY() - 4,
                1
            );
        }
    }

    /** Squash/stretch + inclinación: da vida a una pose estática */
    syncVisual() {
        const t = this.scene.time.now;
        const speedRatio = Math.min(1, Math.abs(this.sprite.body.velocity.x) / this.RUN_SPEED);

        let sx = 1, sy = 1, rot = 0;

        switch (this.currentAnim) {
            case 'alma-idle': {
                const b = Math.sin(t * 0.004);        // respiración
                sy = 1 + b * 0.012;
                sx = 1 - b * 0.010;
                break;
            }
            case 'alma-run': {
                const b = Math.abs(Math.sin(t * 0.020)); // rebote de zancada
                sy = 1 + b * 0.05 * speedRatio;
                sx = 1 - b * 0.035 * speedRatio;
                rot = (this.facingRight ? 1 : -1) * 0.07 * speedRatio;
                break;
            }
            case 'alma-jump':
                sy = 1.07; sx = 0.96;
                rot = (this.facingRight ? 1 : -1) * 0.05;
                break;
            case 'alma-fall':
                sy = 0.96; sx = 1.04;
                rot = (this.facingRight ? 1 : -1) * -0.04;
                break;
            case 'alma-crouch':
                sy = 0.93; sx = 1.06;
                break;
        }

        const scaleY = this.BASE_SCALE * sy;
        this.visual.setScale(this.BASE_SCALE * sx, scaleY);
        this.visual.setRotation(rot);
        this.visual.setFlipX(!this.facingRight);

        // Pies anclados al suelo: el dibujo crece hacia arriba, nunca se hunde
        this.visual.setPosition(this.sprite.x, this.feetY() - this.FEET_FROM_CENTER * scaleY);
    }

    takeDamage() {
        if (this.invulnerable || this.lives <= 0) return;

        this.lives--;
        this.invulnerable = true;
        this.invulnerableTimer = 1500;

        const knockbackDir = this.facingRight ? -1 : 1;
        this.sprite.body.velocity.x = knockbackDir * 280;
        this.sprite.body.velocity.y = -220;

        if (this.scene.sound.get('sfx-hurt')) {
            this.scene.sound.play('sfx-hurt', { volume: 0.3 });
        }
    }

    die() {
        this.sprite.body.enable = false;
        this.sprite.setVelocity(0, 0);
        this.visual.setAlpha(0.5);
        this.visual.setRotation(1.4);
    }

    win() {
        this.sprite.body.velocity.x = 0;
        this.sprite.body.allowGravity = false;
        this.visual.play('alma-idle', true);
    }

    reset(x, y) {
        this.sprite.setPosition(x, y);
        this.sprite.body.enable = true;
        this.sprite.body.allowGravity = true;
        this.sprite.setVelocity(0, 0);
        this.visual.setAlpha(1);
        this.visual.setRotation(0);
        this.visual.setScale(this.BASE_SCALE);
        this.invulnerable = false;
        this.lives = this.maxLives;
        this.currentAnim = 'alma-idle';
        this.visual.play('alma-idle', true);
    }
}