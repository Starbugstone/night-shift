import { Game } from './core/game';
import { createRenderHost } from './core/gfx/host';
import { watchViewport } from './core/viewport';

const canvas = document.getElementById('game');
if (!(canvas instanceof HTMLCanvasElement)) throw new Error('#game canvas missing');

let onResize: () => void = () => {};
const viewport = watchViewport(() => onResize());
const gfx = await createRenderHost(canvas, viewport);
onResize = () => gfx.resize(viewport);
const game = new Game(gfx, viewport);
game.boot();
