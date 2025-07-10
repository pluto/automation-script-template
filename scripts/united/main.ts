import { createSession } from "@plutoxyz/automation";
import { chromium } from "playwright-core";
import { handleUserLogin, promptForCredentials } from "./handleUserLogin";
import { createPlutoPage } from "@plutoxyz/automation-utils";

const session = await createSession();

const [username, password] = await promptForCredentials(session);
const browser = await chromium.connectOverCDP(await session.cdp());
const context = browser.contexts()[0];
const page = createPlutoPage(context);

await handleUserLogin(page, session, username, password);

// 2fa URL
// https://www.united.com/en/us/united-mileageplus-signin

// We can't use { exact: true } here because they have multiple sign in
// buttons on the page due to a side modal.

// await page.waitForURL()

const twofaLocator = page.getByText("Enter code");
await twofaLocator.waitFor({ state: "attached", timeout: 5000 });

console.log("Enter code:", twofaLocator);
if ((await twofaLocator.elementHandles()).length > 0) {
  console.log("Verification code is visible.");

  // Handle the verification code here
  const verificationCode = await page.getByRole("alert").innerText();

  const [otpCode] = await session.prompt({
    title: verificationCode,
    description: verificationCode,
    prompts: [
      {
        label: "Code",
        type: "number_code",
        attributes: {
          length: 6,
        },
      },
    ],
  });
  console.log("OTP Code:", otpCode);

  // await page.pause();
  // Get all OTP input fields
  const otpInputs = page.locator(".atm-c-otp-input");

  // Enter each digit into the corresponding input field
  for (let i = 0; i < 6; i++) {
    await otpInputs.nth(i).fill(otpCode[i]);
  }
  await page.keyboard.press("Enter");
}

await page.waitForURL("https://www.united.com/en/us");
const loginBtnLocator = page.locator("#loginButton");
await loginBtnLocator.waitFor({ state: "visible" });
await loginBtnLocator.click();

const signOut = page.getByRole("button", { name: "SIGN OUT" });
await signOut.waitFor({ state: "visible" });

const sidebarText = page.locator(".atm-c-drawer__body");
await sidebarText.waitFor({ state: "visible" });
const sidebarTextContent = await sidebarText.innerText();
const splitText = sidebarTextContent.split("\n\n");
const keys = [
  { key: "MILEAGEPLUS NUMBER", label: "MileagePlusNumber" },
  { key: "MILES", label: "Miles" },
  { key: "PQF", label: "premierQualifyingFlights" },
  { key: "PQP", label: "premierQualifyingPoints" },
];
const data: Record<string, string>[] = [];
splitText.forEach((text, i) => {
  const key = keys.find((k) => text.includes(k.key));
  if (key) {
    if (key.label === "MileagePlusNumber") {
      data.push({ [key.label]: text.split(":")[1].trim() });
    } else {
      const val = splitText[i + 1];
      if (val) {
        data.push({ [key.label]: val });
      }
    }
  }
});

await session.prove("UnitedMileagePlusNumber", data);

await page.close();
await context.close();
await browser.close();
