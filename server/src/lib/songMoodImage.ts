import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export type HeroImage = {
  url: string;
  alt: string;
  width: number;
  height: number;
  attribution?: string | null;
};

export type StyleCategory =
  | "cinematic"
  | "painterly"
  | "surreal"
  | "retro"
  | "graphic"
  | "romantic"
  | "modern";

type GenerateParams = {
  lyrics: string;
  songTitle?: string;
  artist?: string;
  styleCategory?: StyleCategory;
};

const STYLE_MAP: Record<StyleCategory, string[]> = {
  cinematic: [
    "neo-noir lighting",
    "moody atmospheric cinematography",
    "dramatic shadow and contrast",
    "filmic color grading"
  ],
  painterly: [
    "impressionist brushwork",
    "post-impressionist color palettes",
    "expressionist texture and emotion"
  ],
  surreal: [
    "dreamlike surrealism",
    "symbolic visual metaphors",
    "Dali-like warped perspectives"
  ],
  retro: [
    "1970s analog album-cover aesthetic",
    "psychedelic shapes and gradients",
    "vintage lens haze and muted tones"
  ],
  graphic: [
    "bold pop-art color blocking",
    "modern minimalist layout",
    "high-contrast stylized shapes"
  ],
  romantic: [
    "soft chiaroscuro lighting",
    "baroque-inspired ornamentation",
    "emotion-forward classical composition"
  ],
  modern: [
    "sleek digital painting",
    "ultra-clean contemporary design",
    "abstract atmospheric geometry"
  ],
};

export async function generateSongMoodImage({
  lyrics,
  songTitle,
  artist,
  styleCategory,
}: GenerateParams): Promise<HeroImage | null> {
  const title = songTitle?.trim() || "Unknown Title";
  const artistName = artist?.trim() || "Unknown Artist";
  const excerpt = lyrics.split(/\r?\n/).slice(0, 12).join(" ").slice(0, 1200);

  const chosenStyles = styleCategory
  ? STYLE_MAP[styleCategory].join(", ")
  : Object.values(STYLE_MAP).flat().join(", ");

const prompt =
  `Create a single cinematic concept art image that visually captures the mood and emotional essence of a song.\n` +
  `Title: "${title}"\n` +
  `Artist: ${artistName}\n` +
  `Key lyric excerpt: """${excerpt}"""\n\n` +
  `Style guidance:\n` +
  `- Draw inspiration from the following style categories and techniques: ${chosenStyles}.\n` +
  `- Select or blend styles that best amplify the emotional tone and atmosphere of the lyrics.\n` +
  `- Use expressive lighting, strong mood, and visually intentional color palettes.\n` +
  `- Avoid all text, logos, or typography.\n` +
  `- The artwork must feel bespoke—more like a unique album cover than generic stock art.\n`;

  try {
    const res = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1536",
      quality: "low",
    });

    const b64 = res.data?.[0]?.b64_json;
    const imageUrl = b64
      ? `data:image/png;base64,${b64}`
      : res.data?.[0]?.url;
    if (!imageUrl) return null;

    return {
      url: imageUrl,
      alt: `AI artwork inspired by "${title}" by ${artistName}`,
      width: 1024,
      height: 1536,
      attribution: "OpenAI gpt-image-1",
    };
  } catch (err) {
    console.error("Failed to generate hero image", err);
    return null;
  }
}
