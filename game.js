/**
 * Super Hero Bros - Full Game Engine (Final Phase 3)
 */

// --- UTILS ---
class Utils {
    static rectIntersect(r1, r2) {
        // Robust check for both 'w' and 'width'
        const w1 = r1.w !== undefined ? r1.w : r1.width;
        const h1 = r1.h !== undefined ? r1.h : r1.height;
        const w2 = r2.w !== undefined ? r2.w : r2.width;
        const h2 = r2.h !== undefined ? r2.h : r2.height;

        return (r1.x < r2.x + w2 &&
            r1.x + w1 > r2.x &&
            r1.y < r2.y + h2 &&
            r1.y + h1 > r2.y);
    }
}

// --- INPUT HANDLER ---
class InputHandler {
    constructor() {
        this.keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false, Space: false, Enter: false };
        this.touchActive = { left: false, right: false, jump: false, crouch: false, start: false };

        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.code) || e.code === 'Space' || e.code === 'Enter') {
                const map = { 'Space': 'ArrowUp', 'Enter': 'Enter' };
                this.keys[map[e.code] || e.code] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.code) || e.code === 'Space' || e.code === 'Enter') {
                const map = { 'Space': 'ArrowUp', 'Enter': 'Enter' };
                this.keys[map[e.code] || e.code] = false;
            }
        });

        this.setupTouchControls();
    }

    setupTouchControls() {
        const bindTouch = (id, key) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const handler = (active) => (e) => {
                if (e.cancelable) e.preventDefault();
                this.touchActive[key] = active;
            };
            btn.addEventListener('touchstart', handler(true));
            btn.addEventListener('touchend', handler(false));
            btn.addEventListener('mousedown', handler(true));
            btn.addEventListener('mouseup', handler(false));
        };

        bindTouch('btn-left', 'left');
        bindTouch('btn-right', 'right');
        bindTouch('btn-jump', 'jump');

        window.addEventListener('touchstart', () => { this.touchActive.start = true; });
        window.addEventListener('touchend', () => { setTimeout(() => this.touchActive.start = false, 100); });
        window.addEventListener('click', () => {
            this.touchActive.start = true;
            setTimeout(() => this.touchActive.start = false, 100);
        });
    }

    isDown(action) {
        if (action === 'left') return this.keys.ArrowLeft || this.touchActive.left;
        if (action === 'right') return this.keys.ArrowRight || this.touchActive.right;
        if (action === 'jump') return this.keys.ArrowUp || this.touchActive.jump;
        if (action === 'crouch') return this.keys.ArrowDown || this.touchActive.crouch;
        if (action === 'start') return this.keys.Enter || this.touchActive.start;
        return false;
    }
}

// --- CAMERA ---
class Camera {
    constructor(width, height, mapWidth) {
        this.width = width;
        this.height = height;
        this.x = 0;
        this.y = 0;
        this.mapWidth = mapWidth;
    }

    update(player) {
        this.x = player.x - this.width / 2;
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.mapWidth) this.x = this.mapWidth - this.width;
    }
}

// --- LEVEL ---
class Level {
    constructor(game) {
        this.game = game;
        this.tileSize = 32;
        this.mapData = [
            "..........................................................................................",
            "..........................................................................................",
            "..........................................................................................",
            "..........................................................................................",
            ".......................111................................................................",
            "......................................111..................111............................",
            "..............111..................111....................................................",
            "...........................111......................111...................................",
            ".....111..................................................................................",
            "1111111111111.....111111111111111.............11111111111111111..........11111111111111111",
            "1111111111111.....111111111111111.............11111111111111111..........11111111111111111"
        ];
        this.tiles = [];
        this.width = 0;
        this.height = 0;
        this.init();
    }

    init() {
        this.tiles = [];
        this.mapData.forEach((row, r) => {
            for (let c = 0; c < row.length; c++) {
                const char = row[c];
                if (char !== '.') {
                    this.tiles.push({
                        x: c * this.tileSize, y: r * this.tileSize, w: this.tileSize, h: this.tileSize, type: 'solid'
                    });
                }
            }
        });
        this.width = this.mapData[0].length * this.tileSize;
        this.height = this.mapData.length * this.tileSize;
    }

    draw(ctx, camera) {
        ctx.fillStyle = '#6c757d';
        const viewRect = { x: camera.x, y: camera.y, w: camera.width, h: camera.height };
        this.tiles.forEach(tile => {
            if (Utils.rectIntersect(tile, viewRect)) {
                ctx.fillStyle = '#495057';
                ctx.fillRect(tile.x - camera.x, tile.y - camera.y, tile.w, tile.h);
                ctx.fillStyle = '#adb5bd';
                ctx.fillRect(tile.x - camera.x, tile.y - camera.y, tile.w, 4);
                ctx.strokeStyle = '#212529';
                ctx.strokeRect(tile.x - camera.x, tile.y - camera.y, tile.w, tile.h);
            }
        });
    }
}

// --- PLAYER ---
class Player {
    constructor(game) {
        this.game = game;
        this.width = 45;
        this.height = 70;
        this.w = this.width; // Alias for collisions
        this.h = this.height; // Alias for collisions
        this.visualHeight = 96;
        this.reset();

        this.speed = 4;
        this.jumpForce = -13;
        this.gravity = 0.5;
        this.friction = 0.8;

        this.spriteMap = {
            'IDLE': 'quiet',
            'RUN': 'run',
            'JUMP': 'jump',
            'CROUCH': 'crouch'
        };
    }

    reset() {
        this.x = 50;
        this.y = 200;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.facingRight = true;
        this.state = 'IDLE';
    }

    update() {
        if (this.game.gameState !== 'PLAYING') return;

        if (this.game.input.isDown('left')) {
            this.vx = -this.speed;
            this.facingRight = false;
        } else if (this.game.input.isDown('right')) {
            this.vx = this.speed;
            this.facingRight = true;
        } else {
            this.vx *= this.friction;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }

        // Prevent movement if crouching
        if (this.game.input.isDown('crouch') && this.isGrounded) {
            this.vx = 0;
        }

        if (this.game.input.isDown('jump') && this.isGrounded) {
            this.vy = this.jumpForce;
            this.isGrounded = false;
        }

        this.vy += this.gravity;
        this.x += this.vx;
        this.checkCollision('x');
        this.y += this.vy;
        this.isGrounded = false;
        this.checkCollision('y');

        if (this.y > this.game.level.height + 100) this.game.setGameOver();

        if (!this.isGrounded) this.state = 'JUMP';
        else if (this.game.input.isDown('crouch')) this.state = 'CROUCH';
        else if (Math.abs(this.vx) > 0.1) this.state = 'RUN';
        else this.state = 'IDLE';
    }

    checkCollision(axis) {
        const tiles = this.game.level.tiles;
        for (let tile of tiles) {
            if (Utils.rectIntersect({ x: this.x, y: this.y, w: this.width, h: this.height }, tile)) {
                if (axis === 'x') {
                    if (this.vx > 0) this.x = tile.x - this.width;
                    if (this.vx < 0) this.x = tile.x + tile.w;
                    this.vx = 0;
                } else {
                    if (this.vy > 0) {
                        this.y = tile.y - this.height;
                        this.isGrounded = true;
                        this.vy = 0;
                    } else if (this.vy < 0) {
                        this.y = tile.y + tile.h;
                        this.vy = 0;
                    }
                }
            }
        }
    }

    draw(ctx, camera) {
        const spriteName = this.spriteMap[this.state] || 'quiet';
        const sprite = this.game.assets[spriteName];
        const screenX = Math.floor(this.x - camera.x);
        const screenY = Math.floor(this.y - camera.y);

        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            ctx.save();
            ctx.translate(screenX + this.width / 2, screenY + this.height);
            if (!this.facingRight) ctx.scale(-1, 1);
            ctx.drawImage(sprite, -this.width / 2, -this.visualHeight + 12, this.width, this.visualHeight);
            ctx.restore();
        } else {
            ctx.fillStyle = '#e94560';
            ctx.fillRect(screenX, screenY, this.width, this.height);
        }
    }
}

// --- ENEMY ---
class Enemy {
    constructor(game, x, y, range, speed = 2) {
        this.game = game;
        this.startX = x;
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.w = this.width; // Alias for collisions
        this.h = this.height; // Alias for collisions
        this.range = range;
        this.speed = speed;
        this.v = speed;
        this.facingRight = true;
    }

    update() {
        this.x += this.v;
        if (Math.abs(this.x - this.startX) > this.range) {
            this.v = -this.v;
            this.facingRight = this.v > 0;
        }
    }

    draw(ctx, camera) {
        const screenX = Math.floor(this.x - camera.x);
        const screenY = Math.floor(this.y - camera.y);
        const sprite = this.game.assets.villain;

        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            ctx.save();
            ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
            if (!this.facingRight) ctx.scale(-1, 1);
            ctx.drawImage(sprite, -this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
        } else {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(screenX, screenY, this.width, this.height);
        }
    }
}

// --- GAME CORE ---
class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = 640;
        this.height = 360;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx.imageSmoothingEnabled = true; // Enable smoothing for high-res images
        this.ctx.imageSmoothingQuality = 'high'; // Best quality scaling

        this.input = new InputHandler();

        this.assets = {
            quiet: new Image(),
            run: new Image(),
            jump: new Image(),
            crouch: new Image(),
            fight: new Image(),
            villain: new Image()
        };

        this.gameState = 'MENU';
        this.enemies = [];
        this.init();
    }

    init() {
        this.level = new Level(this);
        this.player = new Player(this);
        this.camera = new Camera(this.width, this.height, this.level.width);

        // Define enemies
        this.enemies = [
            new Enemy(this, 600, 300 - 40, 100),
            new Enemy(this, 1200, 300 - 40, 150),
            new Enemy(this, 2000, 300 - 40, 80)
        ];

        let loadedCount = 0;
        const keys = Object.keys(this.assets);
        const onAssetLoad = () => {
            loadedCount++;
            if (loadedCount === keys.length) {
                document.getElementById('loading-screen').style.display = 'none';
                this.loop(0);
            }
        };

        this.assets.quiet.src = 'personaje/quiet.png';
        this.assets.run.src = 'personaje/run.png';
        this.assets.jump.src = 'personaje/jump.png';
        this.assets.crouch.src = 'personaje/crouch.png';
        this.assets.fight.src = 'personaje/fight.png';
        this.assets.villain.src = 'personaje/villain.png'; // Handled by copying generated image

        keys.forEach(key => {
            this.assets[key].onload = onAssetLoad;
            this.assets[key].onerror = () => {
                console.warn("Skipping asset: " + this.assets[key].src);
                onAssetLoad();
            };
        });
    }

    setGameOver() {
        this.gameState = 'GAMEOVER';
        document.getElementById('game-over-screen').style.display = 'flex';
        document.getElementById('mobile-controls').style.display = 'none';
    }

    resetGame() {
        this.player.reset();
        this.gameState = 'PLAYING';
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'none';

        if (window.innerWidth <= 1024) {
            document.getElementById('mobile-controls').style.display = 'flex';
        }
    }

    update(deltaTime) {
        if (this.gameState === 'MENU' || this.gameState === 'GAMEOVER') {
            if (this.input.isDown('start') || this.input.isDown('jump')) {
                this.resetGame();
            }
        } else if (this.gameState === 'PLAYING') {
            this.player.update(deltaTime);
            this.camera.update(this.player);

            this.enemies.forEach(enemy => {
                enemy.update();
                if (Utils.rectIntersect(this.player, enemy)) {
                    this.setGameOver();
                }
            });
        }
    }

    draw() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.gameState === 'PLAYING' || this.gameState === 'GAMEOVER') {
            this.level.draw(this.ctx, this.camera);
            this.enemies.forEach(enemy => enemy.draw(this.ctx, this.camera));
            this.player.draw(this.ctx, this.camera);
        }
    }

    loop(timestamp) {
        const deltaTime = timestamp - (this.lastTime || timestamp);
        this.lastTime = timestamp;
        this.update(deltaTime);
        this.draw();
        requestAnimationFrame((ts) => this.loop(ts));
    }
}

window.onload = () => { window.game = new Game('gameCanvas'); };
