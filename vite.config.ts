import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Forwards /api/* to your live Vercel deployment during local dev
      // This means views, IndexNow, and any other API routes work on localhost
      '/api': {
        target: 'https://zandani.co.ke',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  assetsInclude: ['**/*.md'],
}));
