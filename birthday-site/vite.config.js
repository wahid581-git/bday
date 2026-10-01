import { existsSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Music is optional: if public/music.mp3 isn't there, the app never requests it
// (no 404s, no console errors). Restart `npm run dev` after adding the file.
const hasMusic = existsSync(new URL("./public/music.mp3", import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __HAS_MUSIC__: JSON.stringify(hasMusic),
  },
});
