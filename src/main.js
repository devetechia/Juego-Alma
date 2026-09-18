import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false,
        },
    },
    input: {
        activePointers: 3,
        touch: true,
        gamepad: false,
    },
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false,
    },
    scene: [BootScene, PreloadScene, MenuScene, GameScene, GameOverScene],
};

const game = new Phaser.Game(config);

// Expose for debugging
window.game = game;

export { game };