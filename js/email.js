// Silent email via EmailJS, with a Formspree fallback.
// UI must never mention email or addresses.

const EMAIL_TO = "zeal.jain110@gmail.com";
const EMAILJS_SERVICE_ID = "service_zp1nkp9";
const EMAILJS_TEMPLATE_ID = "template_2v8rq75";

let inFlight = false;

export async function sendSelections({ toEmail, subject, text, json }) {
  if (inFlight) return { ok: false, error: "busy" };
  inFlight = true;

  try {
    if (!window.emailjs) {
      inFlight = false;
      return { ok: false, error: "emailjs_sdk_missing" };
    }
    if (
      EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID" ||
      EMAILJS_TEMPLATE_ID === "YOUR_TEMPLATE_ID"
    ) {
      inFlight = false;
      return { ok: false, error: "ids_not_configured" };
    }

    const payload = {
      to_email: toEmail || EMAIL_TO,
      subject: subject || "Outfit Selections",
      selections_text: text || "",
      selections_json: json || "{}",
    };

    const res = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      payload
    );

    inFlight = false;
    const ok = res && (res.status === 200 || res.text === "OK");
    return { ok, error: ok ? null : "emailjs_unknown_response" };
  } catch (err) {
    console.error("[EmailJS] send failed:", err);
    inFlight = false;

    // Try to surface a helpful message
    let code = "emailjs_send_error";
    if (err && typeof err === "object") {
      if (err.status === 401 || err.text?.includes("User ID")) code = "auth_or_key_invalid";
      else if (err.status === 404) code = "service_or_template_not_found";
      else if (err.status === 422) code = "template_vars_invalid";
      else if (err.status === 403) code = "origin_not_allowed";
    }
    return { ok: false, error: code };
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
