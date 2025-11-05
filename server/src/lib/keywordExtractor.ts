import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function extractDescriptiveKeywords(lyrics: string): Promise<string[]> {
  const schema = {
    type: "object",
    properties: {
      keywords: {
        type: "array",
        minItems: 5,      // ⬅️ was 3
        maxItems: 5,      // ⬅️ was 3
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

  const prompt = `
You are a music-to-image tagger.
Given song lyrics, return exactly FIVE concise, descriptive keywords that would produce evocative, literal imagery on stock photo sites.
Prefer concrete, visual terms over abstract emotions.
No multi-word phrases; no punctuation; no duplicates.

Lyrics:
"""${lyrics}"""
`;

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
  return json.keywords as string[]; // exactly 5
}
