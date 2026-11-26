/** Scaled silhouettes used by the rooms and Evidence Locker if a 2199 SVG is unavailable. */
const silhouettes: Readonly<Record<string, readonly [string, string, string, string]>> = {
  'room/petunias2199': ['#b18d75', 'M12 63H88L72 94H30Z', '#ca8cbe', 'M29 63Q7 48 19 34Q30 22 41 40Q35 10 52 11Q69 14 59 39Q78 15 88 35Q96 51 66 63Z'],
  'room/spare_robe2199': ['#bd8697', 'M34 6L16 18L5 51L21 61L29 43L22 94H79L72 44L82 60L96 49L83 17L64 6Z', '#edd1bb', 'M36 7L50 33L62 7H68L52 41L43 55L69 53L72 61L34 64L31 57L44 35L30 9Z'],
  'room/ear_fish2199': ['#a3c5c4', 'M23 12H77V23Q89 29 88 42V78Q88 92 72 93H28Q13 92 13 77V43Q13 32 23 25Z', '#e6bb70', 'M23 58L34 47Q59 30 68 49L82 43V68L68 61Q52 78 27 64Z'],
  'room/electronic_guide2199': ['#715868', 'M8 8Q8 3 17 3H85Q92 3 92 11V90Q92 97 85 97H15Q8 97 8 88Z', '#b9c6a8', 'M17 13H82V58H17ZM19 74H37V84H19ZM47 74H65V84H47Z'],
  'room/complaint_stamp2199': ['#b78b74', 'M29 9Q49 -2 71 10L66 40L58 44V57L85 67V80H14V67L42 57V44L32 40Z', '#695467', 'M9 78H91V94H9Z'],
  'room/answer_display2199': ['#706276', 'M4 8H96V88H81V95H65V88H30V95H15V88H4Z', '#393a4c', 'M14 19H86V75H14Z'],
  'room/demolition_blade2199': ['#ac947d', 'M4 17L93 6L98 85L12 94Z', '#ded1a7', 'M11 78L97 70L98 85L12 94Z'],
  'room/charge_cradle2199': ['#758396', 'M4 12H96V91H4Z', '#9ac3b9', 'M2 5H98V28H2ZM16 52H47V64H16Z'],
  'room/robe_sofa2199': ['#875870', 'M6 14H94V89H88V96H80V89H22V96H14V89H6Z', '#c68b92', 'M2 4H98V33H2Z'],
  'room/voice_cabinet2199': ['#707789', 'M5 2H95V98H5Z', '#a6a6ad', 'M15 13H85V44H15ZM19 62H78V68H19ZM19 76H78V82H19Z'],
  'room/luggage_shutter2199': ['#918b87', 'M1 4H99V96H1Z', '#dbbb83', 'M4 20H96V36H4ZM4 62H96V78H4Z'],
  'flight/pickup_bypass_towel': ['#eed18a', 'M4 22L76 5L97 71L24 94Z', '#99769d', 'M17 72L88 52L91 60L20 81ZM21 82L93 62L95 67L23 89Z'],
};

export function paintDispatchProp(g: CanvasRenderingContext2D, key: string, w: number, h: number): boolean {
  const parts = silhouettes[key];
  if (!parts) return false;
  const [body, outline, accent, detail] = parts;
  g.save();
  g.scale(w / 100, h / 100);
  g.lineWidth = 3;
  g.lineJoin = 'round';
  g.strokeStyle = '#29223a';
  const shape = new Path2D(outline);
  g.fillStyle = body;
  g.fill(shape);
  g.stroke(shape);
  g.fillStyle = accent;
  g.fill(new Path2D(detail));
  g.restore();
  return true;
}
