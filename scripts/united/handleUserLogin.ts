import { Prompt, Session } from "@plutoxyz/automation";
import { PlutoPage } from "@plutoxyz/automation-utils";

export async function promptForCredentials(
  session: Session,
  usernameError?: string,
  passwordError?: string,
) {
  const userPrompt: Prompt = {
    label: "Email or MileagePlus® number",
    type: "text",
    attributes: {
      min_length: 3,
      placeholder: "Email or MileagePlus® number",
    },
    error: usernameError,
  };
  const passwordPrompt: Prompt = {
    label: "Password",
    type: "password",
    attributes: {},
    error: passwordError,
  };

  const prompts: Prompt[] = [];
  if (!usernameError && !passwordError) {
    prompts.push(userPrompt, passwordPrompt);
  } else if (usernameError) {
    prompts.push(userPrompt);
  } else if (passwordError) {
    prompts.push(passwordPrompt);
  }

  return await session.prompt({
    title: "Login to United",
    description: "Enter your United credentials to prove your data",
    prompts,
  });
}

export async function handleUserLogin(
  page: PlutoPage,
  session: Session,
  username: string,
  passwordInput: string, // Renamed to avoid conflict with Playwright's password(),
) {
  await page.goto("https://www.united.com/en/us/united-mileageplus-signin", {
    waitUntil: "domcontentloaded",
  });

  await handleUsername(page, session, username);

  await handlePassword(page, session, passwordInput);
}

async function handleUsername(
  page: PlutoPage,
  session: Session,
  username: string,
) {
  const usernameTextbox = page.getByRole("textbox", {
    name: "Email or MileagePlus® number",
  });
  await usernameTextbox.waitFor({ state: "visible" });
  await usernameTextbox.fill(username);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);
  const errorText = page.getByText(
    /Enter a valid MileagePlus number|No account found|Use your MileagePlus number|Enter letters A/,
  );
  const hasError = (await errorText.allTextContents())[0];
  if (hasError) {
    const [username] = await promptForCredentials(
      session,
      hasError.replaceAll("error", "").trim() ||
        "Enter a valid MileagePlus number.",
    );
    await handleUsername(page, session, username);
  }
}

async function handlePassword(
  page: PlutoPage,
  session: Session,
  password: string,
) {
  const passwordTextbox = page.getByRole("textbox", { name: "Password" });
  await passwordTextbox.waitFor({ state: "visible" });
  await passwordTextbox.fill(password);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);

  const errorText = page.getByText(
    /(The account information entered is invalid|Enter a valid password)/,
  );
  const hasError = (await errorText.allTextContents())[0];
  if (hasError) {
    const [password] = await promptForCredentials(
      session,
      undefined,
      hasError.replaceAll("error", "").trim() || "Enter a valid password.",
    );
    await handlePassword(page, session, password);
  }
}
