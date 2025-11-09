// src/lib/cookies.ts
export const isProd = process.env.NODE_ENV === "production";

export const cookieOpts = {
  httpOnly: true,
  sameSite: (isProd ? "none" : "lax") as "none" | "lax",
  secure: isProd,                   // must be true in prod for SameSite=None
  signed: true,
};
