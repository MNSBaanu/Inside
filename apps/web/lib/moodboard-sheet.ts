export type SheetInput = {
  name: string;
  moodWords: string[];
  palette: { name: string; hex: string }[];
  images: string[];
  clientName?: string;
};

export const SHEET_WIDTH = 3508;
export const SHEET_HEIGHT = 2480;
export const SHEET_MAX_IMAGES = 6;

const MARGIN = 150;
const GAP = 40;
const RADIUS = 18;
const COLORS = {
  paper: '#F4EFE7',
  ink: '#1B2422',
  muted: '#6C7471',
  brand: '#064530',
  frame: '#E4DCCF',
};

type Rect = { x: number; y: number; w: number; h: number };

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function roundedClip(ctx: CanvasRenderingContext2D, { x, y, w, h }: Rect) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, RADIUS);
  ctx.clip();
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement | null, rect: Rect) {
  ctx.save();
  roundedClip(ctx, rect);
  ctx.fillStyle = COLORS.frame;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  if (image) {
    const scale = Math.max(rect.w / image.naturalWidth, rect.h / image.naturalHeight);
    const sw = rect.w / scale;
    const sh = rect.h / scale;
    ctx.drawImage(
      image,
      (image.naturalWidth - sw) / 2,
      (image.naturalHeight - sh) / 2,
      sw,
      sh,
      rect.x,
      rect.y,
      rect.w,
      rect.h,
    );
  }
  ctx.restore();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, width: number, maxLines: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s+\S*$/, '')}…`;
  }
  return lines;
}

function split(rect: Rect, weights: number[], gap: number): Rect[] {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const free = rect.w - gap * (weights.length - 1);
  let x = rect.x;
  return weights.map((weight) => {
    const w = (free * weight) / total;
    const slot = { x, y: rect.y, w, h: rect.h };
    x += w + gap;
    return slot;
  });
}

function imageSlots(count: number, right: Rect, bottom: Rect, rightFull: Rect): Rect[] {
  if (count === 0) return [];
  if (count === 1) return [rightFull];
  const top = count >= 5 ? 2 : 1;
  const below = Math.min(count - top, 4);
  return [
    ...split(right, [1.6, 1].slice(0, top), GAP),
    ...split(bottom, [1.2, 0.85, 1.05, 1.3].slice(0, below), GAP),
  ];
}

/** Draws a print-ready A4 landscape moodboard sheet and returns it as a PNG. */
export async function renderMoodboardSheet(input: SheetInput): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = SHEET_WIDTH;
  canvas.height = SHEET_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser cannot draw the moodboard.');

  await document.fonts.ready;
  const sans =
    getComputedStyle(document.documentElement).getPropertyValue('--font-brand').trim() ||
    'system-ui, sans-serif';
  const images = await Promise.all(input.images.slice(0, SHEET_MAX_IMAGES).map(loadImage));

  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, SHEET_WIDTH, SHEET_HEIGHT);

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = COLORS.brand;
  ctx.font = `600 40px ${sans}`;
  ctx.letterSpacing = '8px';
  ctx.fillText('INSIDE', MARGIN, 110);
  ctx.fillStyle = COLORS.muted;
  ctx.textAlign = 'right';
  ctx.fillText('MOODBOARD', SHEET_WIDTH - MARGIN, 110);

  const content: Rect = {
    x: MARGIN,
    y: 200,
    w: SHEET_WIDTH - MARGIN * 2,
    h: SHEET_HEIGHT - 400,
  };
  const panelWidth = content.w * 0.34;
  const panelHeight = content.h * 0.46;
  const rightX = content.x + panelWidth + GAP;
  const right = { x: rightX, y: content.y, w: content.x + content.w - rightX, h: panelHeight };
  const rightFull = { ...right, h: content.h };
  const bottom = {
    x: content.x,
    y: content.y + panelHeight + GAP,
    w: content.w,
    h: content.h - panelHeight - GAP,
  };

  ctx.textAlign = 'left';
  ctx.letterSpacing = '0px';
  ctx.fillStyle = COLORS.brand;
  ctx.font = `600 64px ${sans}`;
  let y = content.y - 20;
  for (const line of wrapLines(ctx, input.name, panelWidth, 2)) {
    y += 80;
    ctx.fillText(line, content.x, y);
  }

  if (input.moodWords.length > 0) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = `400 52px ${sans}`;
    y += 90;
    ctx.fillText(input.moodWords.join('  ·  '), content.x, y);
  }

  if (input.clientName) {
    y += 110;
    ctx.fillStyle = COLORS.muted;
    ctx.font = `600 30px ${sans}`;
    ctx.letterSpacing = '6px';
    ctx.fillText('CLIENT', content.x, y);
    ctx.letterSpacing = '0px';
    ctx.fillStyle = COLORS.ink;
    ctx.font = `500 52px ${sans}`;
    y += 70;
    ctx.fillText(wrapLines(ctx, input.clientName, panelWidth, 1)[0], content.x, y);
  }

  if (input.palette.length > 0) {
    const radius = 52;
    const spacing = 170;
    const cy = y + 80 + radius;
    ctx.font = `400 30px ${sans}`;
    ctx.textAlign = 'center';
    input.palette.forEach((swatch, index) => {
      const cx = content.x + radius + index * spacing;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = swatch.hex;
      ctx.fill();
      ctx.strokeStyle = 'rgba(27, 36, 34, 0.12)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = COLORS.muted;
      ctx.fillText(swatch.name, cx, cy + radius + 50);
    });
    ctx.textAlign = 'left';
  }

  const slots = imageSlots(images.length, right, bottom, rightFull);
  slots.forEach((slot, index) => drawCover(ctx, images[index], slot));
  if (slots.length === 0) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = `400 56px ${sans}`;
    ctx.textAlign = 'center';
    ctx.fillText('No images on this board yet', rightX + right.w / 2, content.y + content.h / 2);
    ctx.textAlign = 'left';
  }

  ctx.font = `400 34px ${sans}`;
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(input.name, MARGIN, SHEET_HEIGHT - 90);
  ctx.textAlign = 'right';
  ctx.fillText('insidesign.me', SHEET_WIDTH - MARGIN, SHEET_HEIGHT - 90);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image.'))),
      'image/png',
    ),
  );
}
