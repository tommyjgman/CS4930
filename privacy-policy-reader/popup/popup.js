// --- Theme toggle (persisted) ---
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
const ta = document.getElementById("ppr-input");
const summarizeBtn = document.getElementById("summarizeBtn");
const clearBtn = document.getElementById("clearBtn");
const styleSelect = document.getElementById("styleSelect");

const errorBox = document.getElementById("errorBox");
const loadingBox = document.getElementById("loadingBox");
const summaryBox = document.getElementById("summaryBox");
const placeholderBox = document.getElementById("placeholderBox");

const copyBtn = document.getElementById("copyBtn");
const exportTxt = document.getElementById("exportTxt");
const exportHtml = document.getElementById("exportHtml");

// --- Helpers ---
function setLoading(on) {
  loadingBox.hidden = !on; // show spinner only when loading
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

// --- Summarize (calls background.js SUMMARIZE_TEXT) ---
function summarize(text, style) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "SUMMARIZE_TEXT", text, customPrompt: style }, // background.js expects {text, customPrompt}
      (resp) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!resp) {
          reject(new Error("No response from background"));
          return;
        }
        if (resp.ok && typeof resp.summary === "string") {
          resolve(resp.summary);
        } else {
          reject(new Error(resp.error || "Unknown error"));
        }
      }
    );
  });
}

// --- Summarize handler ---
async function handleSummarize() {
  const input = ta.value.trim();
  if (!input) return;
  setError("");
  setSummary("");
  setLoading(true); // show spinner here
  try {
    const style = styleSelect.value;
    const result = await summarize(input, style);
    setSummary(result || "");
  } catch (e) {
    console.error(e);
    setError(e.message || "Sorry—something went wrong generating the summary.");
  } finally {
    setLoading(false); // hide spinner when complete
  }
}

summarizeBtn.addEventListener("click", handleSummarize);

// --- Clear ---
clearBtn.addEventListener("click", () => {
  ta.value = "";
  setError("");
  setSummary("");
  ta.focus();
});

// --- Copy ---
copyBtn.addEventListener("click", async () => {
  if (summaryBox.hidden) return;
  try {
    await navigator.clipboard.writeText(summaryBox.textContent);
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
  } catch (_) {}
});

// --- Export .txt ---
exportTxt.addEventListener("click", () => {
  if (summaryBox.hidden) return;
  const blob = new Blob([summaryBox.textContent], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "summary.txt";
  a.click();
  URL.revokeObjectURL(url);
});

// --- Export .html ---
exportHtml.addEventListener("click", () => {
  if (summaryBox.hidden) return;
  const html = `<!doctype html><meta charset="utf-8"><title>Summary</title><pre>${escapeHtml(
    summaryBox.textContent
  )}</pre>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "summary.html";
  a.click();
  URL.revokeObjectURL(url);
});

// --- Enable/disable summarize button live ---
function updateSummarizeState() {
  summarizeBtn.disabled = !ta.value.trim();
}
ta.addEventListener("input", updateSummarizeState);
updateSummarizeState();

// --- Optional shortcuts: Ctrl+Enter to summarize, Esc to clear ---
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSummarize();
  if (e.key === "Escape") clearBtn.click();
});

// --- Listen for background "PIPE_TEXT_TO_POPUP" (optional feature you added) ---
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "PIPE_TEXT_TO_POPUP" && typeof msg.text === "string") {
    ta.value = msg.text;
    updateSummarizeState();
  }
});

// --- Initial UI state ---
loadingBox.hidden = true; // ensure spinner hidden at load
setLoading(false);
updateSummarizeState();
