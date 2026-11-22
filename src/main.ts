// Placeholder entry. Owned by the shell implementer (see AGENTS.md).
const canvas = document.getElementById('game') as HTMLCanvasElement;
const g = canvas.getContext('2d')!;
canvas.width = 540;
canvas.height = 960;
g.fillStyle = '#7CFFCB';
g.font = '32px sans-serif';
g.fillText('Night Shift — booting…', 80, 480);
