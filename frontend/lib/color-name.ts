interface NamedColor {
  name: string;
  hex: string;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const NAMED_COLORS: NamedColor[] = [
  { name: "Black", hex: "#000000" },
  { name: "Charcoal", hex: "#36454F" },
  { name: "Slate Gray", hex: "#708090" },
  { name: "Gray", hex: "#808080" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Ivory", hex: "#FFFFF0" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Cream", hex: "#FFFDD0" },
  { name: "Tan", hex: "#D2B48C" },
  { name: "Khaki", hex: "#C3B091" },
  { name: "Sand", hex: "#C2B280" },
  { name: "Brown", hex: "#8B4513" },
  { name: "Chocolate", hex: "#7B3F00" },
  { name: "Rust", hex: "#B7410E" },
  { name: "Maroon", hex: "#800000" },
  { name: "Red", hex: "#FF0000" },
  { name: "Coral", hex: "#FF7F50" },
  { name: "Salmon", hex: "#FA8072" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Amber", hex: "#FFBF00" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Mustard", hex: "#FFDB58" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Lime", hex: "#00FF00" },
  { name: "Olive", hex: "#808000" },
  { name: "Forest Green", hex: "#228B22" },
  { name: "Emerald", hex: "#50C878" },
  { name: "Mint", hex: "#98FF98" },
  { name: "Teal", hex: "#008080" },
  { name: "Cyan", hex: "#00FFFF" },
  { name: "Aqua", hex: "#7FDBFF" },
  { name: "Sky Blue", hex: "#87CEEB" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Royal Blue", hex: "#4169E1" },
  { name: "Navy", hex: "#000080" },
  { name: "Indigo", hex: "#4B0082" },
  { name: "Violet", hex: "#8F00FF" },
  { name: "Purple", hex: "#800080" },
  { name: "Magenta", hex: "#FF00FF" },
  { name: "Pink", hex: "#FFC0CB" },
  { name: "Rose", hex: "#FF66CC" }
];

function normalizeHex(hex: string): string | null {
  if (typeof hex !== "string") {
    return null;
  }

  const cleaned = hex.trim().replace("#", "");

  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const expanded = cleaned
      .split("")
      .map((char) => `${char}${char}`)
      .join("");
    return `#${expanded.toUpperCase()}`;
  }

  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned.toUpperCase()}`;
  }

  return null;
}

function hexToRgb(hex: string): RgbColor | null {
  const normalized = normalizeHex(hex);
  if (!normalized) {
    return null;
  }

  const value = normalized.slice(1);

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16)
  };
}

function distanceSquared(a: RgbColor, b: RgbColor): number {
  return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
}

export function getColorNameFromHex(hex: string): string {
  const input = hexToRgb(hex);
  if (!input) {
    return "Custom Tone";
  }

  let bestName = "Custom Tone";
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const color of NAMED_COLORS) {
    const candidate = hexToRgb(color.hex);
    if (!candidate) {
      continue;
    }

    const distance = distanceSquared(input, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestName = color.name;
    }
  }

  return bestName;
}
