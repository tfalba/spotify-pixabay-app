// keywordExtractor.ts
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const MIN_OPENAI_DELAY_MS = 500;
let throttleChain: Promise<void> = Promise.resolve();
let lastCallTime = 0;

function scheduleOpenAI<T>(task: () => Promise<T>): Promise<T> {
  const run = async () => {
    const now = Date.now();
    const wait = Math.max(0, lastCallTime + MIN_OPENAI_DELAY_MS - now);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    lastCallTime = Date.now();
    return task();
  };

  const result = throttleChain.then(run, run);
  throttleChain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export type KeywordPlan = {
  baseKeywords: string[];          // 6–8 solid single-word visual keywords
  pairQueries: [string, string][]; // exactly 3 keyword pairs
  topSingles: string[];            // exactly 4 strongest singles
};

export async function extractDescriptiveKeywords(
  lyrics: string,
  songTitle?: string,
): Promise<KeywordPlan> {
  const lines = lyrics.split(/\r?\n/);
  const fourFifths = Math.max(1, Math.ceil((lines.length * 4) / 5));
  const truncatedLyrics = lines.slice(0, fourFifths).join("\n");

  const schema = {
    type: "object",
    properties: {
      baseKeywords: {
        type: "array",
        description:
          "6–8 distinct, single-word visual keywords (nouns or adjectives) describing concrete imagery from the lyrics.",
        minItems: 6,
        maxItems: 8,
        items: {
          type: "string",
          description:
            "One concise, descriptive keyword (adjective or concrete noun) suitable for an image search. No punctuation, no spaces.",
          minLength: 2,
          maxLength: 20,
        },
      },
      pairQueries: {
        type: "array",
        description:
          "Exactly 3 keyword pairs. Each pair should combine two baseKeywords into a vivid image concept based on the mood and concept of the lyrics.",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "array",
          minItems: 2,
          maxItems: 2,
          items: {
            type: "string",
            minLength: 2,
            maxLength: 20,
          },
        },
      },
      topSingles: {
        type: "array",
        description:
          "Exactly 4 of the strongest baseKeywords that work well as standalone image searches.",
        minItems: 4,
        maxItems: 4,
        items: {
          type: "string",
          minLength: 2,
          maxLength: 20,
        },
      },
    },
    required: ["baseKeywords", "pairQueries", "topSingles"],
    additionalProperties: false,
  } as const;

  const titleContext = songTitle
    ? `Song title: "${songTitle}". Use the title as additional context to inspire visually specific imagery, but only reuse words from the title if they describe something tangible.\n\n`
    : "";

  const prompt =
    `You are helping choose stock image search keywords based on song lyrics.\n\n` +
    titleContext +
    `Return a JSON object with:\n` +
    `- "baseKeywords": 6–8 distinct single words that describe concrete, visual elements from the lyrics.\n` +
    `  • Use nouns or adjectives for things that can be seen (e.g. 'neon', 'skyline', 'ocean', 'desert').\n` +
    `  • Use emotions, abstractions, and vague terms like 'love', 'sadness', 'freedom', 'music', 'art'.\n` +
    `  • No multi-word phrases, no punctuation, no colors that don't appear or fit strongly.\n` +
    `- "pairQueries": exactly 3 keyword pairs, each an array of two strings.\n` +
    `  • Each keyword in the pairs MUST come from baseKeywords.\n` +
    `  • Combine words to suggest a vivid, photographable scene (e.g. 'neon' + 'city', 'golden' + 'forest').\n` +
    `  • Avoid near-duplicate pairs.\n` +
    `- "topSingles": exactly 4 of the strongest baseKeywords that should work well as standalone searches.\n` +
    `  • Each item MUST be one of the baseKeywords.\n\n` +
    `Focus on visually rich, concrete imagery that a photographer could actually capture. Let the song title subtly guide the mood if it adds clarity.\n\n` +
    `Lyrics:\n"""${truncatedLyrics}"""`;

  const res = await scheduleOpenAI(() =>
    openai.responses.create({
      model: "gpt-5-mini",
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "KeywordPlan",
          schema,
          strict: true,
        },
      },
    }),
  );

  const json = JSON.parse(res.output_text!) as KeywordPlan;

  return {
    baseKeywords: json.baseKeywords,
    pairQueries: json.pairQueries,
    topSingles: json.topSingles,
  };
}
