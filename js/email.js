// Silent email via EmailJS, with a Formspree fallback.
// UI must never mention email or addresses.

const EMAIL_TO = "zeal.jain110@gmail.com";
// Replace with your real IDs from EmailJS
const EMAILJS_SERVICE_ID = "service_zp1nkp9";
const EMAILJS_TEMPLATE_ID = "template_2v8rq75";

// Small guard to avoid rapid double-submits
let inFlight = false;

export async function sendSelections({ toEmail, text }) {
  if (inFlight) return false;
  inFlight = true;

  try {
      const res = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        payload
      );

      inFlight = false;
      return res && (res.status === 200 || res.text === "OK");
  } catch (e) {
    inFlight = false;
    return false;
  }
}

export function formatSelectionsText(selections, data) {
  const lines = [];
  for (const step of data.steps) {
    const pickId = selections[step.id];
    const item = step.options.find((o) => o.id === pickId);
    lines.push(`${step.title}: ${item ? item.name : "(none)"}`);
  }
  return lines.join("\n");
}
