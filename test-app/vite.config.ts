import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Config for the React test app (dev server)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Root relative to this config file
  root: path.resolve(__dirname, ".."), // Root is the parent 'template' dir where index.html is
  // Base URL for development
  base: "/",
  server: {
    // Configure server options if needed (e.g., port)
    port: 3000,
    open: true, // Open browser automatically
  },
  // Explicitly define build options for the app if needed for preview,
  // though primary build is handled by script/vite.config.ts
  build: {
    outDir: path.resolve(__dirname, "dist"), // App-specific build output if `vite build` is run here
    rollupOptions: {
      input: path.resolve(__dirname, "../index.html"), // Ensure index.html is correctly referenced
    },
  },
  define: {
    // Pass environment variables to the client
    __SCRIPT_NAME__: JSON.stringify(process.env.SCRIPT_NAME || "united"),
  },
  resolve: {
    alias: {
      // Alias to easily import the script source code (if needed by app for other reasons)
      "@scripts": path.resolve(__dirname, "../scripts"),
    },
  },
});
