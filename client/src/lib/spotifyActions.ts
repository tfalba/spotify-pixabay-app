import { spotifyApiJson } from "./spotifyApi";

export async function moveTrackOnServer(
  trackId: string,
  sourcePlaylistId: string,
  targetPlaylistId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    return await spotifyApiJson<{ success: boolean; message?: string }>(
      "/api/spotify/move-track",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trackId,
          sourcePlaylistId,
          targetPlaylistId,
        }),
      }
    );
  } catch (err) {
    console.error("moveTrackOnServer error:", err);
    return {
      success: false,
      message: (err as Error).message,
    };
  }
}
