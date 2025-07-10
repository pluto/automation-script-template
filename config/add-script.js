#!/usr/bin/env node

/**
 * Helper script to add a new script entry to package.json
 * Usage: node scripts/add-script.js <script-name>
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scriptName = process.argv[2];

if (!scriptName) {
  console.error("Usage: node scripts/add-script.js <script-name>");
  process.exit(1);
}

// Validate script name
if (!/^[a-z0-9-]+$/.test(scriptName)) {
  console.error(
    "Script name must contain only lowercase letters, numbers, and hyphens",
  );
  process.exit(1);
}

const packageJsonPath = path.resolve(__dirname, "..", "package.json");
const mainTemplatePath = path.resolve(__dirname, "main.template.ts");
const scriptDirPath = path.resolve(__dirname, "..", "scripts", scriptName);
const scriptMainPath = path.join(scriptDirPath, "main.ts");

try {
  // Check if script already exists
  if (fs.existsSync(scriptDirPath)) {
    console.error(
      `❌ Script "${scriptName}" already exists at ${scriptDirPath}`,
    );
    process.exit(1);
  }

  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  // Add new scripts if they don't exist
  const devScript = `dev:${scriptName}`;
  const buildScript = `build:${scriptName}`;

  if (packageJson.scripts[devScript]) {
    console.error(`❌ Script "${devScript}" already exists in package.json`);
    process.exit(1);
  }

  packageJson.scripts[devScript] =
    `concurrently "SCRIPT_NAME=${scriptName} vite build --watch --config config/vite.config.scripts.ts" "SCRIPT_NAME=${scriptName} npm run dev:app"`;
  packageJson.scripts[buildScript] =
    `SCRIPT_NAME=${scriptName} vite build --config config/vite.config.scripts.ts`;

  // Write back to package.json
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + "\n",
  );

  // Create script directory
  fs.mkdirSync(scriptDirPath, { recursive: true });

  // Copy main.ts template
  if (fs.existsSync(mainTemplatePath)) {
    fs.copyFileSync(mainTemplatePath, scriptMainPath);
  } else {
    // Fallback template if main.ts doesn't exist
    const fallbackTemplate = `import { createSession } from "@plutoxyz/automation";
import { chromium } from "playwright-core";
import { createPlutoPage } from "@plutoxyz/automation-utils";

const session = await createSession();

const browser = await chromium.connectOverCDP(await session.cdp());
const context = browser.contexts()[0];
const page = createPlutoPage(context);

const locator = await page.loadAndGet(
  "https://example.com",
  page.getByText("Example Domain"),
);

await session.prove("${scriptName}", {
  title: (await locator?.textContent()) || "Title not found",
  timestamp: new Date().toISOString(),
});

await page.close();
await context.close();
await browser.close();
`;
    fs.writeFileSync(scriptMainPath, fallbackTemplate);
  }

  console.log(`✅ Successfully created script "${scriptName}"`);
  console.log(`📁 Directory: ${scriptDirPath}`);
  console.log(`📄 Main file: ${scriptMainPath}`);
  console.log(`\n🚀 Run your script:`);
  console.log(`   npm run ${devScript}`);
  console.log(`\n🔨 Build your script:`);
  console.log(`   npm run ${buildScript}`);
} catch (error) {
  console.error("❌ Error creating script:", error.message);

  // Clean up on error
  if (fs.existsSync(scriptDirPath)) {
    fs.rmSync(scriptDirPath, { recursive: true, force: true });
  }

  process.exit(1);
}
