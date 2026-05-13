import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// Environment-based configuration
// VITE_API_URL is automatically loaded from .env / .env.local
export default defineConfig({
  plugins: [tailwindcss()],
  
  // Server configuration for development
  server: {
    port: 5173,
    strictPort: false,
    open: true,
  },
  
  // Build configuration for optimized production builds
  build: {
    sourcemap: false,
    minify: "terser",
    target: "es2020",
    outDir: "dist",
  },
});
