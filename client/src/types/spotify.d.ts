/// <reference types="spotify-web-playback-sdk" />

declare global {
  interface Window {
    Spotify: Spotify.SpotifyNamespace; // Player constructor lives here
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

export {};
