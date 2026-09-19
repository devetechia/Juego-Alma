import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

/**
 * Pantalla completa de verdad: el juego se dimensiona al tamaño real del navegador
 * (modo RESIZE) en lugar de mantener 1280x720 con franjas negras. Cada escena coloca
 * sus elementos en función del tamaño vivo de la ventana, y se recoloca al girar
 * el dispositivo.
 */
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth,
        height: window.innerHeight,
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
