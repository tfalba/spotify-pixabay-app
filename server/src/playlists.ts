// server/src/playlists.ts
import express, { Request, Response } from "express";
import { spotifyUserFetch } from "./lib/spotifyUser";

export const playlistsRouter = express.Router();

/**
 * POST /api/spotify/move-track
 * Body: { trackId, sourcePlaylistId?, targetPlaylistId }
 */
playlistsRouter.post(
  "/move-track",
  async (req: Request, res: Response): Promise<void> => {
    const { trackId, sourcePlaylistId, targetPlaylistId } = req.body || {};

    if (!trackId || !targetPlaylistId) {
      res.status(400).json({
        success: false,
        message:
          "trackId and targetPlaylistId are required. sourcePlaylistId is optional.",
      });
      return;
    }

    const trackUri = `spotify:track:${trackId}`;

    try {
      //
      // 1️⃣ REMOVE FROM SOURCE (if provided)
      //
      if (sourcePlaylistId) {
        const removeResp = await spotifyUserFetch(
          req,
          res,
          `https://api.spotify.com/v1/playlists/${sourcePlaylistId}/tracks`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tracks: [{ uri: trackUri }],
            }),
          }
        );

        const removeText = await removeResp.text().catch(() => "");

        if (!removeResp.ok) {
          console.error(
            "Spotify REMOVE error:",
            removeResp.status,
            removeText
          );
          res.status(removeResp.status).json({
            success: false,
            message: "Spotify failed to remove track from source playlist.",
            spotifyStatus: removeResp.status,
            spotifyBody: removeText,
          });
          return;
        }
      }

      //
      // 2️⃣ ADD TO TARGET
      //
      const addResp = await spotifyUserFetch(
        req,
        res,
        `https://api.spotify.com/v1/playlists/${targetPlaylistId}/tracks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [trackUri],
          }),
        }
      );

      const addText = await addResp.text().catch(() => "");

      if (!addResp.ok) {
        console.error("Spotify ADD error:", addResp.status, addText);
        res.status(addResp.status).json({
          success: false,
          message: "Spotify failed to add track to target playlist.",
          spotifyStatus: addResp.status,
          spotifyBody: addText,
        });
        return;
      }

      res.json({ success: true });
    } catch (err) {
      console.error("move-track route error:", err);
      res.status(500).json({
        success: false,
        message: "Unexpected server error while moving track.",
      });
    }
  }
);
