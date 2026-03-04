import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Avoid CORS in dev: browser calls same origin, Vite forwards to Spritz
      "/api": {
        target: "https://app.spritz.chat",
        changeOrigin: true,
      },
    },
  },
});
