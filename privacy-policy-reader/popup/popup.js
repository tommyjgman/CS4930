// --- Theme toggle ---
const rootEl = document.documentElement;
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  rootEl.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "light" ? "🌙 Dark" : "☀️ Light";
  localStorage.setItem("ppr-theme", theme);
}

(function initTheme() {
  const saved = localStorage.getItem("ppr-theme") || "light";
  applyTheme(saved);
})();
themeToggle.addEventListener("click", () => {
  const next = rootEl.getAttribute("data-theme") === "light" ? "dark" : "light";
  applyTheme(next);
});

// --- Elements ---
const ta = document.getElementById("ppr-input");     // main text area
const summarizeBtn = document.getElementById("summarizeBtn");
const clearBtn = document.getElementById("clearBtn");
const styleSelect = document.getElementById("styleSelect");
const scrapeBtn = document.getElementById("scrape"); // <-- from your branch

const errorBox = document.getElementById("errorBox");
const loadingBox = document.getElementById("loadingBox");
const summaryBox = document.getElementById("summaryBox");
const placeholderBox = document.getElementById("placeholderBox");
const copyBtn = document.getElementById("copyBtn");
const exportTxt = document.getElementById("exportTxt");
const exportHtml = document.getElementById("exportHtml");

// --- Helpers ---
function setLoading(on) {
  loadingBox.hidden = !on;
  summarizeBtn.disabled = on || !ta.value.trim();
}
function setSummary(text) {
  const has = !!(text && text.trim());
  summaryBox.hidden = !has;
  placeholderBox.hidden = has;
  if (has) summaryBox.textContent = text;
  copyBtn.disabled = !has;
  exportTxt.disabled = !has;
  exportHtml.disabled = !has;
}
function setError(msg) {
  if (msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
  } else {
    errorBox.hidden = true;
    errorBox.textContent = "";
  }
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// --- Your custom prompt builder ---
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

// --- Background summarize call ---
function summarize(text, style) {
  const customPrompt = buildCustomPrompt(style);
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "SUMMARIZE_TEXT", text, customPrompt },
      (resp) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        if (!resp) return reject(new Error("No response from background"));
        if (resp.ok && typeof resp.summary === "string") return resolve(resp.summary);
        reject(new Error(resp.error || "Unknown error"));
      }
    );
  });
}

// --- Text extraction feature ---
async function extractText() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4")).filter(h => /privacy|policy/i.test(h.textContent));
      if (headings.length) {
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
      return document.body.innerText;
    }
  });
  return result;
}

// --- Summarize handler ---
async function handleSummarize() {
  const input = ta.value.trim();
  if (!input) return;
  setError("");
  setSummary("");
  setLoading(true);
  try {
    const style = styleSelect.value;
    const result = await summarize(input, style);
    setSummary(result || "");
  } catch (e) {
    console.error(e);
    setError(e.message || "Sorry—something went wrong generating the summary.");
  } finally {
    setLoading(false);
  }
}

// --- Scrape handler ---
scrapeBtn.addEventListener("click", async () => {
  setError("");
  setLoading(true);
  try {
    const text = await extractText();
    ta.value = text;
    setLoading(false);
  } catch (err) {
    console.error(err);
    setError("Scrape failed");
    setLoading(false);
  }
});

// --- Other UI listeners ---
summarizeBtn.addEventListener("click", handleSummarize);
clearBtn.addEventListener("click", () => { ta.value = ""; setError(""); setSummary(""); ta.focus(); });
copyBtn.addEventListener("click", async () => {
  if (summaryBox.hidden) return;
  try {
    await navigator.clipboard.writeText(summaryBox.textContent);
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
  } catch (_) {}
});
exportTxt.addEventListener("click", () => {
  if (summaryBox.hidden) return;
  const blob = new Blob([summaryBox.textContent], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "summary.txt";
  a.click();
});
exportHtml.addEventListener("click", () => {
  if (summaryBox.hidden) return;
  const html = `<!doctype html><meta charset="utf-8"><title>Summary</title><pre>${escapeHtml(summaryBox.textContent)}</pre>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "summary.html";
  a.click();
});
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSummarize();
  if (e.key === "Escape") clearBtn.click();
});

// --- Receive piped text ---
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "PIPE_TEXT_TO_POPUP" && msg.text) {
    ta.value = msg.text;
  }
});
