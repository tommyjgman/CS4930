document.addEventListener("DOMContentLoaded", () => {
  const $ = s => document.querySelector(s);
  const textEl = $("#policyText");
  const statusEl = $("#status");
  const resultCard = $("#resultCard");
  const summaryEl = $("#summary");
  const summarizeBtn = $("#summarizeBtn");
  const copyBtn = $("#copyBtn");
  const styleSel = $("#style");
  const scrapeBtn = document.getElementById("scrape");

  // Optional: receive text injected by teammate extractor
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "PIPE_TEXT_TO_POPUP" && msg.text) {
      textEl.value = msg.text;
    }
  });

  function setStatus(txt, loading=false, error=false) {
    statusEl.textContent = txt || "";
    statusEl.classList.toggle("loading", !!loading);
    statusEl.style.color = error ? "#b00020" : "#666";
  }

  function buildCustomPrompt(style) {
    switch (style) {
      case "risk":
        return "Highlight any sale/share of personal data, third-party trackers, location/biometric collection, data retention periods, and opt-out mechanisms. Flag unclear or broad consents.";
      case "child":
        return "Rewrite in simpler words suitable for ages 13–17. Keep bullets short and clear. Define jargon (e.g., 'third-party' = other companies).";
      case "exec":
        return "Produce a 100–140 word executive brief with a 1-sentence risk callout.";
      default:
        return "";
    }
  }

  async function summarize() {
    const source = document.getElementById("textSource").value;
    let raw = "";

    if (source === "manual") {
      raw = textEl.value || "";
    } 
  
    else if (source === "extracted") {
      raw = await extractText();
    }


    const customPrompt = buildCustomPrompt(styleSel.value);
    resultCard.classList.add("hidden");
    summaryEl.textContent = "";
    setStatus("Summarizing...", true, false);
    summarizeBtn.disabled = true;

    try {
      const { ok, summary, error } = await chrome.runtime.sendMessage({
        type: "SUMMARIZE_TEXT",
        text: raw,
        customPrompt
      });

      if (!ok) throw new Error(error || "Unknown error");

      summaryEl.textContent = summary;
      resultCard.classList.remove("hidden");
      setStatus("Done.");
    } catch (e) {
      setStatus(e.message || "Failed to summarize.", false, true);
    } finally {
      summarizeBtn.disabled = false;
      // Clear "Done." after a moment
      setTimeout(() => setStatus(""), 1500);
    }
  }

  // Function to extract text from the current page if desired
  async function extractText() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
       // Collect relevant privacy policy looking headings
        const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4")).filter(h => /privacy|policy/i.test(h.textContent));

        if (headings.length) {
          // Grab each heading and nearby text
          return headings.map(h => {
            let sectionText = h.textContent.trim();

            let el = h.nextElementSibling;
            while (el && !/^H[1-6]$/.test(el.tagName)) {
              sectionText += "\n" + el.innerText.trim();
              el = el.nextElementSibling;
            }
          return sectionText;
          }).join("\n\n");
        }

        // Else if no heading match
        return document.body.innerText;
      }
    });
    return result;  
  }

  summarizeBtn.addEventListener("click", summarize);
  copyBtn.addEventListener("click", async () => {
    const txt = summaryEl.textContent || "";
    if (!txt) return;
    try {
      await navigator.clipboard.writeText(txt);
      setStatus("Copied.");
      setTimeout(() => setStatus(""), 1200);
    } catch {
      setStatus("Copy failed.", false, true);
    }
  });

  scrapeBtn.addEventListener("click", async () => {
    setStatus("Scraping active tab...", true);
    try {
      const text = await extractText();
      textEl.value = text;
      setStatus("Scrape complete");
    } catch (err) {
      console.error(err);
      setStatus("Scrape failed", false, true);
    }
  });
});
