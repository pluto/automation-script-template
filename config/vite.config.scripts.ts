import { defineConfig } from "vite";
import path from "path";

// Config for building individual scripts
export default defineConfig(() => {
  const scriptName = process.env.SCRIPT_NAME || "united";
  const scriptDir = path.resolve(__dirname, "..", "scripts", scriptName);

  return {
    // Build configuration
    build: {
      target: "node18",
      outDir: path.resolve(__dirname, "..", "scripts", scriptName, "dist"),
      rollupOptions: {
        input: path.resolve(scriptDir, "main.ts"),
        output: {
          entryFileNames: "main.js",
          format: "es" as const,
        },
        external: [
          // External all node_modules
          /^@plutoxyz\/automation$/,
          /^playwright-core$/,
          // External all Node.js built-ins
          "fs",
          "path",
          "crypto",
          "os",
          "util",
          "events",
          "stream",
          "net",
          "tls",
          "http",
          "https",
          "child_process",
          "readline",
          "inspector",
          "async_hooks",
          "dns",
          "zlib",
          "buffer",
          "url",
          "constants",
          "assert",
          "tty",
        ],
      },
      // Enable top-level await
      minify: false,
    },
  };
});
