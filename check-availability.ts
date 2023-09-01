import { Page, chromium } from "playwright";
import Twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.PHONE_NUMBER;

if (!accountSid || !authToken || !phoneNumber) {
  throw new Error("Missing configuration");
}

const sendSMS = async (message: string) => {
  const client = Twilio(accountSid, authToken);

  await client.messages.create({
    from: "+16562188024",
    to: phoneNumber,
    body: message,
  });
};

const checkHasAvailability = async (page: Page, planningId: string) => {
  await page.goto("https://pprdv.interieur.gouv.fr/booking/create/989/");

  await page.click("[name=condition]");

  await page.click("[name=nextButton]");

  await page.click(`[id=${planningId}]`);

  await page.click("[name=nextButton]");

  const noAvailabilityElement = await page.getByText(
    "Il n'existe plus de plage horaire libre pour votre demande de rendez-vous"
  );

  return !noAvailabilityElement;
};

const plannings = [
  {
    label: "Guichets 1, 2, 3 et 4",
    id: "planning1075",
  },
  {
    label: "Guichets 5, 6, 7 et 8",
    id: "planning1076",
  },
  {
    label: "Guichets 9, 10, 11 et 12",
    id: "planning1077",
  },
];

(async () => {
  // Setup
  const browser = await chromium.launch({
    headless: false,
  });
  const page = await browser.newPage();

  for (const planning of plannings) {
    console.log("Checking", planning.label);
    const hasAvailability = await checkHasAvailability(page, planning.id);

    if (hasAvailability) {
      console.log("Availability found for", planning.label);
      await sendSMS(`Availability found for ${planning.label}`);
      console.log("SMS sent");
      break;
    }

    console.log("No availability for", planning.label);
  }

  console.log("No availability on any planning");

  // Teardown
  await browser.close();
})();
