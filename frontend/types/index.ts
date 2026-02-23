export const OCCASIONS = [
  "College",
  "Interview",
  "Date",
  "Party",
  "Wedding",
  "Casual Hangout",
  "Travel"
] as const;

export const STYLE_VIBES = ["Minimal", "Streetwear", "Classy", "Ethnic", "Sporty"] as const;

export type Occasion = (typeof OCCASIONS)[number];
export type StyleVibe = (typeof STYLE_VIBES)[number];

export interface LookResult {
  topWear: string;
  bottomWear: string;
  footwear: string;
  accessories: string;
  hairstyle: string;
  colorPalette: string[];
  confidenceTip: string;
}

export interface StoredLookResult extends LookResult {
  occasion: string;
  styleVibe: string;
  previewUrl?: string;
}
