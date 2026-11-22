import { ART } from '../art-manifest';
import { VIEW_H, VIEW_W, type GameContext, type RoomId } from '../contracts';
import { createAbductScene } from './index';

export function mountAbductDev(canvas: HTMLCanvasElement, roomId: RoomId): () => void {
  const g = canvas.getContext('2d');
  if (!g) throw new Error('Night Shift needs a Canvas 2D context');

  const images = new Map<string, HTMLImageElement>();
  for (const key of Object.keys(ART)) {
    if (!key.startsWith('room/') && !key.startsWith('human/') && !key.startsWith('ui/dream_') && key !== 'ui/zzz') continue;
    const image = new Image();
    image.onload = () => images.set(key, image);
    image.src = import.meta.env.BASE_URL + 'art/' + key + '.svg';
  }

  const ctx: GameContext = {
    pointer: { x: 0, y: 0, down: false, pressed: false, released: false },
    assets: images,
    audio: { sfx() {} },
    upgrades: new Set(),
    tutorial: roomId.startsWith('farm'),
    time: 0,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
  const start = { levelId: 'dev', roomId };
  let scene = createAbductScene(ctx, start, reset);
  let pointerId: number | undefined;
  let frame = 0;
  let lastTime = performance.now();
  const touchAction = canvas.style.touchAction;
  canvas.style.touchAction = 'none';

  function reset(): void {
    scene.dispose?.();
    scene = createAbductScene(ctx, start, reset);
  }

  function move(event: PointerEvent): void {
    if (pointerId !== event.pointerId) return;
    const rect = canvas.getBoundingClientRect();
    ctx.pointer.x = (event.clientX - rect.left) * VIEW_W / rect.width;
    ctx.pointer.y = (event.clientY - rect.top) * VIEW_H / rect.height;
  }

  function press(event: PointerEvent): void {
    if (pointerId !== undefined || event.button !== 0) return;
    pointerId = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
    move(event);
    ctx.pointer.pressed = true;
    ctx.pointer.down = true;
  }

  function release(event: PointerEvent): void {
    if (pointerId !== event.pointerId) return;
    pointerId = undefined;
    ctx.pointer.down = false;
    ctx.pointer.released = true;
  }

  function tick(now: number): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(VIEW_W * dpr);
    const height = Math.round(VIEW_H * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    g!.setTransform(width / VIEW_W, 0, 0, height / VIEW_H, 0, 0);
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    ctx.time += dt;
    scene.update(dt);
    ctx.pointer.pressed = false;
    ctx.pointer.released = false;
    scene.render(g!);
    frame = requestAnimationFrame(tick);
  }

  canvas.addEventListener('pointerdown', press);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('lostpointercapture', release);
  frame = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(frame);
    canvas.removeEventListener('pointerdown', press);
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', release);
    canvas.removeEventListener('pointercancel', release);
    canvas.removeEventListener('lostpointercapture', release);
    if (pointerId !== undefined && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    canvas.style.touchAction = touchAction;
    scene.dispose?.();
  };
}
