import { setupCanvas } from './core/canvas';
import { Game } from './core/game';

const canvas = document.getElementById('game');
if (!(canvas instanceof HTMLCanvasElement)) throw new Error('#game canvas missing');
const game = new Game(setupCanvas(canvas));
game.boot();
