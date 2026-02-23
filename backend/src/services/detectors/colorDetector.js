import { toRawPixels } from "../ml/imagePreprocess.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function rgbToYcbcr(r, g, b) {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return { y, cb, cr };
}

function isLikelySkin(r, g, b) {
  const { y, cb, cr } = rgbToYcbcr(r, g, b);
  const skinRange = cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173;
  const rgbRule = r > 92 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 12;
  const luminanceRule = y > 35 && y < 240;

  return skinRange && rgbRule && luminanceRule;
}

function rgbToHex(r, g, b) {
  const channelToHex = (channel) => channel.toString(16).padStart(2, "0");
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`.toUpperCase();
}

function rgbToHsl(r, g, b) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === red) {
      hue = ((green - blue) / delta) % 6;
    } else if (max === green) {
      hue = (blue - red) / delta + 2;
    } else {
      hue = (red - green) / delta + 4;
    }
  }

  hue = Math.round(hue * 60);
  if (hue < 0) {
    hue += 360;
  }

  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

  return {
    h: hue,
    s: saturation * 100,
    l: lightness * 100
  };
}

function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;

  const chroma = (1 - Math.abs(2 * light - 1)) * sat;
  const secondary = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const match = light - chroma / 2;

  let redPrime = 0;
  let greenPrime = 0;
  let bluePrime = 0;

  if (hue < 60) {
    redPrime = chroma;
    greenPrime = secondary;
  } else if (hue < 120) {
    redPrime = secondary;
    greenPrime = chroma;
  } else if (hue < 180) {
    greenPrime = chroma;
    bluePrime = secondary;
  } else if (hue < 240) {
    greenPrime = secondary;
    bluePrime = chroma;
  } else if (hue < 300) {
    redPrime = secondary;
    bluePrime = chroma;
  } else {
    redPrime = chroma;
    bluePrime = secondary;
  }

  return {
    r: Math.round((redPrime + match) * 255),
    g: Math.round((greenPrime + match) * 255),
    b: Math.round((bluePrime + match) * 255)
  };
}

function classifySkinTone(luminance) {
  if (luminance >= 190) {
    return "fair";
  }
  if (luminance >= 160) {
    return "light-medium";
  }
  if (luminance >= 125) {
    return "medium";
  }
  if (luminance >= 95) {
    return "tan";
  }
  return "deep";
}

function classifyUndertone(averageR, averageG, averageB) {
  const redBlueDelta = averageR - averageB;
  const redGreenDelta = averageR - averageG;
  const greenLead = averageG - averageR;

  if (greenLead > 10 && averageG > averageB) {
    return "golden";
  }

  if (redBlueDelta > 18 && redGreenDelta > 8) {
    return "warm";
  }

  if (redBlueDelta < -6) {
    return "cool";
  }

  return "neutral";
}

function buildPalette(baseR, baseG, baseB) {
  const baseHsl = rgbToHsl(baseR, baseG, baseB);

  const p1 = hslToRgb(baseHsl.h, Math.max(baseHsl.s - 14, 18), Math.min(baseHsl.l + 21, 88));
  const p2 = hslToRgb(baseHsl.h + 18, Math.max(baseHsl.s - 8, 22), clamp(baseHsl.l - 4, 28, 78));
  const p3 = hslToRgb(baseHsl.h - 20, Math.max(baseHsl.s + 5, 24), clamp(baseHsl.l - 23, 16, 58));
  const p4 = hslToRgb(baseHsl.h + 210, Math.max(baseHsl.s - 28, 14), 20);

  const rawPalette = [
    rgbToHex(p1.r, p1.g, p1.b),
    rgbToHex(p2.r, p2.g, p2.b),
    rgbToHex(p3.r, p3.g, p3.b),
    rgbToHex(p4.r, p4.g, p4.b)
  ];

  return [...new Set(rawPalette)].slice(0, 4);
}

function fallbackColorProfile() {
  return {
    skinTone: "medium",
    undertone: "neutral",
    palette: ["#D6A67A", "#AA6A47", "#6D422C", "#1F2A33"],
    colorConfidence: 0.54
  };
}

export async function detectSkinTonePalette(imageBuffer) {
  const { data, width, height, channels } = await toRawPixels(imageBuffer, 340);

  const skinPixels = [];
  const centerXMin = Math.floor(width * 0.2);
  const centerXMax = Math.floor(width * 0.8);
  const centerYMin = Math.floor(height * 0.1);
  const centerYMax = Math.floor(height * 0.8);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      if (x < centerXMin || x > centerXMax || y < centerYMin || y > centerYMax) {
        continue;
      }

      if (isLikelySkin(r, g, b)) {
        skinPixels.push({ r, g, b });
      }
    }
  }

  if (skinPixels.length < 120) {
    return fallbackColorProfile();
  }

  const sums = skinPixels.reduce(
    (acc, pixel) => {
      acc.r += pixel.r;
      acc.g += pixel.g;
      acc.b += pixel.b;
      return acc;
    },
    { r: 0, g: 0, b: 0 }
  );

  const averageR = sums.r / skinPixels.length;
  const averageG = sums.g / skinPixels.length;
  const averageB = sums.b / skinPixels.length;
  const luminance = 0.2126 * averageR + 0.7152 * averageG + 0.0722 * averageB;

  const skinTone = classifySkinTone(luminance);
  const undertone = classifyUndertone(averageR, averageG, averageB);
  const palette = buildPalette(
    Math.round(averageR),
    Math.round(averageG),
    Math.round(averageB)
  );

  const skinCoverage = skinPixels.length / Math.max((centerXMax - centerXMin) * (centerYMax - centerYMin), 1);
  const colorConfidence = Number(clamp(0.5 + skinCoverage * 3.2, 0.5, 0.93).toFixed(2));

  return {
    skinTone,
    undertone,
    palette,
    colorConfidence
  };
}
