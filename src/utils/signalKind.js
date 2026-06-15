// Maps a node to a PATCHBAY "signal kind" that drives its grip and icon color.
//
// Rather than flattening every node in a category to one color, each node keeps
// the spirit of its original custom color: we match that original hex to the
// nearest color in the design-system signal palette. Matching is done in HSL so
// it follows the color family (hue) rather than raw RGB distance, with
// desaturated colors falling back to a neutral grip. Colors resolve to CSS
// variables so they still adapt to the active light/dark theme.
//
// Kinds: in, out, fn, ai, logic, net, audio, neutral

const CATEGORY_KIND = {
  input: 'in',
  output: 'out',
  ai: 'ai',
  networking: 'net',
  audio: 'audio',
  transforms: 'fn',
  logic: 'logic',
  hardware: 'in',
  storage: 'in',
  common: 'neutral',
  other: 'neutral',
  config: 'neutral',
};

const SIGNAL_VARS = {
  in: '--sig-in',
  out: '--sig-out',
  fn: '--sig-fn',
  ai: '--sig-ai',
  logic: '--sig-logic',
  net: '--sig-net',
  audio: '--sig-audio',
  neutral: '--smoke',
};

// Design-system anchor hues (degrees), from the light signal palette.
// in #0E9DB8, out #2E9E4F, fn #DC8638, ai #8257F0, logic #CC9A28,
// net #3B7DD8, audio #1FA0A0
const ANCHOR_HUES = {
  fn: 28.5,
  logic: 41.7,
  out: 137.7,
  audio: 180,
  in: 189.5,
  net: 214.8,
  ai: 256.9,
};

function expandHex(hex) {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return h;
}

function hexToHsl(hex) {
  const h = expandHex(hex);
  const num = parseInt(h, 16);
  if (Number.isNaN(num) || h.length !== 6) return null;
  const r = ((num >> 16) & 0xff) / 255;
  const g = ((num >> 8) & 0xff) / 255;
  const b = (num & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  let s = 0;
  if (delta !== 0) s = delta / (1 - Math.abs(2 * l - 1));
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return { h: hue, s, l };
}

function hueDistance(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

const kindCache = new Map();

// Nearest design-system kind for an arbitrary color.
export function nearestKind(color) {
  if (!color) return null;
  if (kindCache.has(color)) return kindCache.get(color);

  const hsl = hexToHsl(color);
  let kind = 'neutral';
  if (hsl) {
    // Desaturated or near black/white reads as a neutral grip.
    if (hsl.s >= 0.16 && hsl.l > 0.08 && hsl.l < 0.93) {
      let best = Infinity;
      for (const [k, anchorHue] of Object.entries(ANCHOR_HUES)) {
        const d = hueDistance(hsl.h, anchorHue);
        if (d < best) {
          best = d;
          kind = k;
        }
      }
    }
  }
  kindCache.set(color, kind);
  return kind;
}

export function getSignalKind(def) {
  if (!def) return 'neutral';
  // Match the node's own color to the nearest design-system color.
  if (def.color) {
    return nearestKind(def.color);
  }
  // Fall back to the category when a node has no color of its own.
  return CATEGORY_KIND[def.category] || 'neutral';
}

// CSS color expression for a node's grip/icon, theme-adaptive.
export function nodeSignalColor(def) {
  return `var(${SIGNAL_VARS[getSignalKind(def)]})`;
}

// Representative color for a palette category header dot (stays category-based).
export function categoryKindColor(category) {
  return `var(${SIGNAL_VARS[CATEGORY_KIND[category] || 'neutral']})`;
}

export { CATEGORY_KIND, SIGNAL_VARS };
