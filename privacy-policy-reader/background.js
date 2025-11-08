// background.js

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_INPUT_CHARS = 20000; // guardrail

async function summarizeText(rawText, customPrompt) {
  const { apiKey, model } = await chrome.storage.sync.get({
    apiKey: "",
    model: DEFAULT_MODEL
  });
  if (!apiKey) throw new Error("Missing API key. Set it in Options.");

  const input = (rawText || "").slice(0, MAX_INPUT_CHARS);
  if (!input.trim()) throw new Error("No input text provided.");

  const systemPrompt = [
    "You are a helpful assistant that summarizes website privacy policies.",
    "Audience: non-technical users.",
    "Length: ~150–250 words.",
    "Return a short intro + bullet points for:",
    "- Data collected",
    "- How it's used",
    "- Third-party sharing",
    "- Retention",
    "- User rights/opt-out",
    "- Contact info",
    "Be clear and neutral, avoid legalese; preserve critical caveats."
  ].join("\n");

  const body = {
    model: model || DEFAULT_MODEL,
    temperature: 0.3,
    max_tokens: 500,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: (customPrompt ? customPrompt + "\n\n" : "") + input }
    ]
  };

  const resp = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`API error ${resp.status}: ${txt || resp.statusText}`);
  }

  const json = await resp.json();
  const summary = json?.choices?.[0]?.message?.content?.trim();
  if (!summary) throw new Error("No summary returned from model.");
  return summary;
}

// Router: popup asks us to summarize text it provides
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "SUMMARIZE_TEXT") {
    (async () => {
      try {
        const out = await summarizeText(msg.text || "", msg.customPrompt || "");
        sendResponse({ ok: true, summary: out });
      } catch (e) {
        sendResponse({ ok: false, error: e?.message || "Unknown error" });
      }
    })();
    return true; // keep channel open
  }

  // Optional: teammate extractor can push text into popup
  if (msg?.type === "EXTRACTION_RESULT") {
    chrome.runtime.sendMessage({ type: "PIPE_TEXT_TO_POPUP", text: msg.text || "" });
    sendResponse({ ok: true });
  }
});
<<<<<<< HEAD

//Notification sent when privacy policy detected
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background:", message);

  if (message.action === "privacyPolicyDetected") {
    console.log("Sending notification");
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/48.png",
      title: "Privacy Policy Detected",
      message: "Click the extension icon in the toolbar to summarize this privacy policy.",
      priority: 2
    });
  }
});

chrome.notifications.onClicked.addListener((notifId) => {
  chrome.notifications.clear(notifId);
  alert("Click the extension icon in the toolbar to summarize the privacy policy.");
});
=======
>>>>>>> main
