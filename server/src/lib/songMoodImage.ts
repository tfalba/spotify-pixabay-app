import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export type HeroImage = {
  url: string;
  alt: string;
  width: number;
  height: number;
  attribution?: string | null;
};

type GenerateParams = {
  lyrics: string;
  songTitle?: string;
  artist?: string;
};

export async function generateSongMoodImage({
  lyrics,
  songTitle,
  artist,
}: GenerateParams): Promise<HeroImage | null> {
  const title = songTitle?.trim() || "Unknown Title";
  const artistName = artist?.trim() || "Unknown Artist";
  const excerpt = lyrics.split(/\r?\n/).slice(0, 12).join(" ").slice(0, 1200);

  const prompt =
    `Create a single cinematic concept art image that visually captures the mood and emotional essence of a song.\n` +
    `Title: "${title}"\n` +
    `Artist: ${artistName}\n` +
    `Key lyric excerpt: """${excerpt}"""\n\n` +
    `Style guidance:\n` +
    `- Blend surreal lyric-inspired storytelling with modern album-cover cinematography.\n` +
    `- Emphasize texture, lighting, and color grading that match the song's atmosphere.\n` +
    `- Avoid all text, logos, or typography.\n` +
    `- The composition should feel like bespoke cover art inspired by the song, never generic stock art.\n`;

  try {
    console.log("Generating hero image with prompt:", prompt);
    const res = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1536",
      quality: "low",
    });
    console.log("Received image generation response", res.data?.[0]?.url);

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
