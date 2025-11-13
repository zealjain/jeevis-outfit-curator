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
    // Prefer EmailJS if SDK is loaded and IDs are present
    if (
      window.emailjs &&
      EMAILJS_SERVICE_ID !== "service_zp1nkp9" &&
      EMAILJS_TEMPLATE_ID !== "template_2v8rq75"
    ) {
      const payload = {
        to_email: toEmail || EMAIL_TO,
        selections_text: text || ""
      };

      const res = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        payload
      );

      if (res && (res.status === 200 || res.text === "OK")) {
        inFlight = false;
        return true;
      }
    }

    // Fallback: Formspree (optional)
    // To use: create a Formspree form and replace YOUR_FORM_ID below.
    const FORMSPREE_FORM_ID = "YOUR_FORM_ID";
    if (FORMSPREE_FORM_ID !== "YOUR_FORM_ID") {
      const resp = await fetch(`https://formspree.io/f/${FORMSPREE_FORM_ID}`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          selections_text: text || ""
        }),
      });
      inFlight = false;
      return resp.ok;
    }

    inFlight = false;
    return false;
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
