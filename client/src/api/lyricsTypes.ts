// client/src/api/lyricsTypes.ts

// Keep this in sync with server's KeywordPlan
export type KeywordPlan = {
  baseKeywords: string[];
  pairQueries: [string, string][];
  topSingles: string[];
};

export type ImageCard = {
  id: number;
  thumb: string;
  url: string;
  alt: string;
  author: string;
  authorAvatar: string;
  pageURL: string;
};

export type HeroImage = {
  url: string;
  alt: string;
  width: number;
  height: number;
  attribution?: string | null;
};

// New shape (v2) from server
export type LyricsImagesResponseV2 = {
  keywords: KeywordPlan;
  images: ImageCard[];
  heroImage?: HeroImage | null;
  cached?: boolean;
  debug?: DebugInfo;
};

// Old shape (v1) that used to come from server
export type LyricsImagesResponseV1 = {
  keywords: string[];     // old style: flat string[]
  images: ImageCard[];
  cached?: boolean;
  debug?: DebugInfo;      // if you ever ask debug from an old server client
};

export type DebugInfo = {
  baseKeywords: string[];
  pairQueries: [string, string][];
  topSingles: string[];
  searchQueries: {
    pairs: string[];
    singles: string[];
  };
};

export type NormalizedLyricsImagesResult = {
  keywords: KeywordPlan;
  images: ImageCard[];
  cached: boolean;
  debug?: DebugInfo;
  heroImage?: HeroImage | null;
};
