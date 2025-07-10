# Pluto Script Project

This project allows you to create and test multiple automation scripts using Pluto.

## 🚀 Quick Start

### Create a new script

```bash
npm run add-script my-script-name
```

This will:

- Create a `scripts/my-script-name/` directory
- Generate a `main.ts` file with a basic template
- Add npm commands to your `package.json`

### Run your script

```bash
# Development mode (builds + watches your script, runs test app)
npm run dev:my-script-name

# Build only
npm run build:my-script-name
```

## 📁 Project Structure

```
├── scripts/           # Your automation scripts
│   ├── my-script/
│   │   ├── main.ts    # Your script code
│   │   └── dist/      # Built output
├── test-app/          # React app for testing scripts
├── config/            # Build configuration & tools
│   ├── vite.config.scripts.ts # Vite build config
│   ├── tsconfig.json  # TypeScript config
│   ├── add-script.js  # Helper to create new scripts
│   └── main.template.ts # Template for new scripts
└── package.json       # Project configuration
```

## ✨ Available Scripts

- `npm run add-script <name>` - Create a new script
- `npm run dev:<script-name>` - Develop a specific script
- `npm run build:<script-name>` - Build a specific script

## 📝 Writing Scripts

Your scripts should be written in TypeScript and export automation logic using Pluto's APIs. See `main.ts` for a basic template.

Example:

```typescript
import { createSession } from "@plutoxyz/automation";
import { chromium } from "playwright-core";
import { createPlutoPage } from "@plutoxyz/automation-utils";

const session = await createSession();
const browser = await chromium.connectOverCDP(await session.cdp());
const context = browser.contexts()[0];
const page = createPlutoPage(context);

// Your automation logic here...

await session.prove("my-data", [{ result: "success" }]);
await browser.close();
```
