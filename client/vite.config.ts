import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
      interval: 150,
    },
    hmr: {
      host: "localhost",
      protocol: "ws",
      clientPort: 5173,
    },
    proxy: {
      "/api": "http://127.0.0.1:5174",
      "/auth": "http://127.0.0.1:5174",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
