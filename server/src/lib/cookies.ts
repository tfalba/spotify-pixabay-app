// src/lib/cookies.ts
const truthy = new Set(["true", "1", "yes"]);
const falsy = new Set(["false", "0", "no"]);

function inferIsLocalClient() {
  if (typeof window !== "undefined") {
    return /localhost|127\.0\.0\.1/i.test(window.location.origin);
  }
  const origin = process.env.CLIENT_ORIGIN ?? "";
  return /localhost|127\.0\.0\.1/i.test(origin);
}

function pickSameSite(isLocal: boolean) {
  const raw = (process.env.COOKIE_SAMESITE ?? "").toLowerCase();
  if (raw === "none" || raw === "lax") return raw;
  return isLocal ? "lax" : "none";
}

function pickSecure(isLocal: boolean) {
  const raw = (process.env.COOKIE_SECURE ?? "").toLowerCase();
  if (truthy.has(raw)) return true;
  if (falsy.has(raw)) return false;
  return !isLocal;
}

const isLocalClient = inferIsLocalClient();
const sameSite = pickSameSite(isLocalClient);
const secure = pickSecure(isLocalClient);
const domain = (process.env.COOKIE_DOMAIN ?? "").trim() || undefined;

export const cookieOpts = {
  httpOnly: true,
  sameSite: sameSite as "none" | "lax",
  secure,
  signed: true,
  domain,
};
