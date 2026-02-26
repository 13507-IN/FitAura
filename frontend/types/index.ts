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
  analysis?: AIAnalysis;
}

export interface AnalyzerSignal {
  status: string;
  reason: string | null;
}

export interface AIAnalysis {
  face: {
    shape: string;
    confidence: number;
  } & AnalyzerSignal;
  body: {
    silhouette: string;
    confidence: number;
  } & AnalyzerSignal;
  color: {
    skinTone: string;
    undertone: string;
    palette: string[];
    confidence: number;
  } & AnalyzerSignal;
  demographic: {
    gender: string;
    age: number | null;
    confidence: number;
  } & AnalyzerSignal;
  geminiSummary: string;
  overallConfidence: number;
}

export interface StoredLookResult extends LookResult {
  occasion: string;
  styleVibe: string;
  previewUrl?: string;
  createdAt?: string;
}
