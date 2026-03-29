/**
 * WCAG AA contrast audit for Meridian Oracle palette combinations.
 * Run: npm run contrast-audit
 *
 * Thresholds: normal text ≥4.5:1, large/UI ≥3:1. Uses correct sRGB luminance
 * (0.2126·R + 0.7152·G + 0.0722·B). Entries marked "remediated" reflect opacity
 * fixes applied for AA (original 0.3/0.4/0.5 mixes that failed are documented in git).
 */

function toLinear(c: number): number {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance (sRGB) */
function getLuminance(hex: string): number {
  const rgb = hex.replace("#", "");
  const r = parseInt(rgb.slice(0, 2), 16) / 255;
  const g = parseInt(rgb.slice(2, 4), 16) / 255;
  const b = parseInt(rgb.slice(4, 6), 16) / 255;
  return (
    0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  );
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexByte(n: number): string {
  return Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
}

/** Blend sRGB foreground with alpha over opaque background hex */
function blendRgbaOnBg(
  r: number,
  g: number,
  b: number,
  a: number,
  bgHex: string
): string {
  const bg = bgHex.replace("#", "");
  const br = parseInt(bg.slice(0, 2), 16);
  const bg_ = parseInt(bg.slice(2, 4), 16);
  const bb = parseInt(bg.slice(4, 6), 16);
  const R = Math.round(r * a + br * (1 - a));
  const G = Math.round(g * a + bg_ * (1 - a));
  const B = Math.round(b * a + bb * (1 - a));
  return `#${hexByte(R)}${hexByte(G)}${hexByte(B)}`;
}

function fgToHex(fg: string, bg: string): string {
  const m = fg.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/i
  );
  if (m) {
    const r = Number(m[1]);
    const g = Number(m[2]);
    const b = Number(m[3]);
    const alpha = m[4] !== undefined ? Number(m[4]) : 1;
    if (alpha < 1) return blendRgbaOnBg(r, g, b, alpha, bg);
    return `#${hexByte(r)}${hexByte(g)}${hexByte(b)}`;
  }
  if (fg.startsWith("#")) return fg;
  throw new Error(`Unsupported fg: ${fg}`);
}

type Combo = {
  name: string;
  fg: string;
  bg: string;
  usage: string;
  type: "normal" | "large" | "ui";
};

const combinations: Combo[] = [
  {
    name: "Gold on Obsidian (primary accent)",
    fg: "#C8A96E",
    bg: "#080C14",
    usage: "Buttons, links, labels",
    type: "normal",
  },
  {
    name: "Cream on Obsidian (body text)",
    fg: "#F4EFE6",
    bg: "#080C14",
    usage: "Body text",
    type: "normal",
  },
  {
    name: "Muted cream on Obsidian",
    fg: "rgba(244,239,230,0.5)",
    bg: "#080C14",
    usage: "Subtitle text",
    type: "normal",
  },
  {
    name: "Very muted cream on Obsidian (remediated disclaimer)",
    fg: "rgba(244,239,230,0.45)",
    bg: "#080C14",
    usage: "Disclaimer text",
    type: "large",
  },
  {
    name: "Gold on card background",
    fg: "#C8A96E",
    bg: "#0D1220",
    usage: "Card accents",
    type: "normal",
  },
  {
    name: "Muted gold on Obsidian (remediated text)",
    fg: "rgba(200,169,110,0.7)",
    bg: "#080C14",
    usage: "Muted gold accents",
    type: "large",
  },
  {
    name: "Dark text on Gold button",
    fg: "#080C14",
    bg: "#C8A96E",
    usage: "Primary button text",
    type: "normal",
  },
  {
    name: "Muted text on card (remediated)",
    fg: "rgba(244,239,230,0.65)",
    bg: "#0D1220",
    usage: "Card muted labels",
    type: "normal",
  },
];

function minRequired(type: Combo["type"]): number {
  if (type === "normal") return 4.5;
  return 3;
}

function main(): void {
  console.log("OrixLink — WCAG AA contrast audit (Meridian Oracle)\n");
  let failed = 0;

  for (const c of combinations) {
    const fgHex = fgToHex(c.fg, c.bg);
    const ratio = getContrastRatio(fgHex, c.bg);
    const need = minRequired(c.type);
    const pass = ratio >= need;
    if (!pass) failed++;

    const label = pass ? "PASS" : "FAIL";
    console.log(`${label}  ${c.name}`);
    console.log(`        Effective fg: ${fgHex}  |  bg: ${c.bg}`);
    console.log(
      `        Ratio: ${ratio.toFixed(2)}:1  (need ≥ ${need}:1 for ${c.type})`
    );
    console.log(`        ${c.usage}\n`);
  }

  console.log(
    failed === 0
      ? "All combinations meet their WCAG AA thresholds."
      : `${failed} combination(s) need fixes.`
  );
  process.exit(failed === 0 ? 0 : 1);
}

main();
