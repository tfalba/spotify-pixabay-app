import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function extractDescriptiveKeywords(lyrics: string): Promise<string[]> {
  const lines = lyrics.split(/\r?\n/);
  const half = Math.max(1, Math.ceil(lines.length / 2));
  const truncatedLyrics = lines.slice(0, half).join("\n");

  const schema = {
    type: "object",
    properties: {
      keywords: {
        type: "array",
        minItems: 4,      // ⬅️ was 3
        maxItems: 4,      // ⬅️ was 3
        items: {
          type: "string",
          description:
            "One concise, descriptive keyword (adjective or concrete noun) suitable for an image search. No punctuation.",
          minLength: 2,
          maxLength: 20,
        },
      },
    },
    required: ["keywords"],
    additionalProperties: false,
  } as const;

  const prompt = `Return exactly four single-word visual keywords (nouns or adjectives) for stock image searches based on these lyrics. ` +
    `Use concrete imagery, avoid emotions, duplicates, punctuation, or multi-word phrases.\n\nLyrics:\n"""${truncatedLyrics}"""`;

  const res = await openai.responses.create({
    model: "gpt-4o-mini",
    input: prompt,
    text: {
      format: {
        type: "json_schema",
        name: "Keywords",
        schema,
        strict: true,
      },
    },
  });

  const json = JSON.parse(res.output_text!);
  return json.keywords as string[]; // exactly 4
}
