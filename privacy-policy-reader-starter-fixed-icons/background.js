// background.js
async function summarize(text) {
  const { apiKey, model } = await chrome.storage.sync.get({ apiKey: "", model: "gpt-4o-mini" });
  if (!apiKey) throw new Error("Missing API key in Options.");
  const resp = await fetch("https://api.exampleai.com/v1/summarize", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: text,
      instructions: "Summarize the privacy policy for a non-technical user."
    })
  });
  if (!resp.ok) throw new Error(`AI error ${resp.status}`);
  const data = await resp.json();
  return data.summary || data.output || JSON.stringify(data);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SUMMARIZE_ACTIVE_TAB") {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tabId = tabs[0]?.id;
      if (!tabId) return sendResponse({ error: "No active tab." });
      chrome.tabs.sendMessage(tabId, { type: "EXTRACT_POLICY" }, async (res) => {
        try {
          const text = res?.text || "";
          const summary = await summarize(text);
          sendResponse({ summary });
        } catch (e) {
          sendResponse({ error: e.message });
        }
      });
    });
    return true;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background:", message);

  if (message.action === "privacyPolicyDetected") {
    console.log("Sending notification");
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/48.png",
      title: "Privacy Policy Detected",
      message: "Would you like to summarize this policy?",
      buttons: [{ title: "Open Extension" }],
      priority: 2
    });
  }
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonId) => {
  if (buttonId === 0) {
    console.log("Notification button clicked, opening window");

    setTimeout(() => {
      chrome.windows.create({
        url: chrome.runtime.getURL("popup.html"),
        type: "popup",
        width: 400,
        height: 600
      }, (win) => {
        if (chrome.runtime.lastError) {
          console.error("Error creating popup:", chrome.runtime.lastError);
        } else {
          console.log("Popup window created:", win);
        }
      });
    }, 100);
  }
});