export type Track = {
  id: string;
  name: string;
  artists: { name: string }[];
  image: string | null;
  preview_url: string | null;
  external_url: string;
  uri: string | null;
  album?: {
    images?: { url: string }[];
  };
};

export type StyleCategory =
  | "cinematic"
  | "painterly"
  | "surreal"
  | "retro"
  | "graphic"
  | "romantic"
  | "modern";
