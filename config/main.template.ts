import { createSession } from "@plutoxyz/automation";
import { chromium } from "playwright-core";
import { createPlutoPage } from "@plutoxyz/automation-utils";

const session = await createSession();

/**
 * Setup browser
 */
const browser = await chromium.connectOverCDP(await session.cdp());
const context = browser.contexts()[0];
const page = createPlutoPage(context);

console.log("Running your custom script!");

// Navigate to a simple page
const locator = await page.loadAndGet(
  "https://example.com",
  page.getByText("Example Domain"),
);

if (locator) {
  console.log("Found the Example Domain text!");

  // Get the page title
  const title = await page.title();
  console.log(`Page title: ${title}`);

  // Prove some simple data
  const data = [{ title: title }, { timestamp: new Date().toISOString() }];

  await session.prove("YourCustomScript", data);
} else {
  console.log("Could not find the expected text on the page");
}

await browser.close();
await session.close();
