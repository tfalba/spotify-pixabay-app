export async function moveTrackOnServer(
  trackId: string,
  sourcePlaylistId: string,
  targetPlaylistId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch("/api/spotify/move-track", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        trackId,
        sourcePlaylistId,
        targetPlaylistId,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to move track");
    }

    return await res.json();
  } catch (err) {
    console.error("moveTrackOnServer error:", err);
    return {
      success: false,
      message: (err as Error).message,
    };
  }
}
