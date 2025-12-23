// server/src/itunes.ts
import { ensureOk, parseJson } from "./lib/http";

type ITunesSong = {
  artistName?: string;
  trackName?: string;
  previewUrl?: string;
  trackViewUrl?: string;
  collectionName?: string;
  trackTimeMillis?: number;
};

type ITunesSearchResponse = {
  resultCount: number;
  results: ITunesSong[];
};

function norm(s: string) {
  return (s ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// very simple scoring: prefer exact-ish artist + title containment
function scoreCandidate(
  cand: ITunesSong,
  wantArtist: string,
  wantTitle: string
) {
  const a = norm(cand.artistName ?? "");
  const t = norm(cand.trackName ?? "");
  const wa = norm(wantArtist);
  const wt = norm(wantTitle);

  let score = 0;

  // title match
  if (t === wt) score += 100;
  else if (t.includes(wt) || wt.includes(t)) score += 70;

  // artist match
  if (a === wa) score += 80;
  else if (a.includes(wa) || wa.includes(a)) score += 55;

  // prefer those that actually have a preview
  if (cand.previewUrl) score += 20;

  return score;
}

export async function itunesPreviewLookup(opts: {
  artist: string;
  title: string;
  country?: string; // default US
  limit?: number; // default 8
}) {
  const artist = (opts.artist ?? "").trim();
  const title = (opts.title ?? "").trim();
  if (!artist || !title) {
    return { preview_url: null as string | null };
  }

  const term = `${artist} ${title}`;
  const params = new URLSearchParams({
    term,
    media: "music",
    entity: "song",
    limit: String(opts.limit ?? 8),
    country: opts.country ?? "US",
  });

  const url = `https://itunes.apple.com/search?${params.toString()}`;
  const r = await fetch(url, {
    headers: { "Accept": "application/json" },
  });

  ensureOk(r, "itunes search");
  const data = await parseJson<ITunesSearchResponse>(r);

  const candidates = (data.results ?? []).filter((x) => !!x.previewUrl);
  if (!candidates.length) return { preview_url: null as string | null };

  // choose best match
  let best = candidates[0];
  let bestScore = -Infinity;
  for (const c of candidates) {
    const s = scoreCandidate(c, artist, title);
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  }

  return { preview_url: best.previewUrl ?? null };
}
