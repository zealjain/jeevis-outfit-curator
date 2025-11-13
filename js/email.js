// Silent email via EmailJS or a Formspree fallback.
// UI must never mention email or addresses.

export async function sendSelections({ toEmail, subject, text, json }){
    // Try EmailJS if available
    if (window.emailjs) {
      try{
        const res = await emailjs.send('YOUR_SERVICE_ID','YOUR_TEMPLATE_ID',{
          to_email: toEmail, subject, selections_text: text, selections_json: json
        });
        if (res && res.status === 200) return true;
      }catch(e){ /* fall through */ }
    }
    // Fallback to Formspree hidden POST (replace with your form ID)
    try{
      const formId = "YOUR_FORM_ID";
      const resp = await fetch(`https://formspree.io/f/${formId}`, {
        method: "POST",
        headers: { "Accept":"application/json","Content-Type":"application/json" },
        body: JSON.stringify({ subject, selections_text: text, selections_json: json })
      });
      return resp.ok;
    }catch(e){ return false; }
  }
  export function formatSelectionsText(selections, data){
    const lines = [];
    for (const step of data.steps){
      const pickId = selections[step.id];
      const item = step.options.find(o => o.id === pickId);
      lines.push(`${step.title}: ${item ? item.name : "(none)"}`);
    }
    return lines.join("\n");
  }
  