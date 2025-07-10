import { chromium } from "playwright-core";
import { createSession } from "@plutoxyz/automation";

const session = await createSession();
const browser = await chromium.connectOverCDP(await session.cdp());
const [page] = browser.contexts()[0].pages();

// 1) Go to the page that contains the HTML (example.com for demo)
//    If you already have the HTML in memory you can instead do
//    page.setContent(htmlSnippet);
await page.goto("https://example.com");

/* 2) Grab the <p> that is immediately below the <h1> “Example Domain”.
   CSS adjacent-sibling selector h1 + p matches “the first <p> that
   directly follows the <h1>”.
*/
const paragraphLocator = page.locator('h1:has-text("Example Domain") + p');
await paragraphLocator.waitFor({ state: "visible" });

const paragraphText = await paragraphLocator.innerText();
console.log("Extracted text:", paragraphText);

// (optional) prove it to Pluto’s attestation log
await session.prove("example_domain_paragraph", paragraphText.trim());

// cleanup
await browser.close();
await session.close();
