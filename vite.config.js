import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import path from 'path';

export default defineConfig({
  plugins: [remix()],
  optimizeDeps: { exclude: ['*.pdf'] },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, './app'),
      "@images": path.resolve(__dirname, './app/assets/images'),
      "@styles": path.resolve(__dirname, './app/assets/styles'),
      "@components": path.resolve(__dirname, './app/components'),
    }
  }
});