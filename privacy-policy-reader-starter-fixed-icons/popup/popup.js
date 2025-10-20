const out = document.getElementById("output");
const err = document.getElementById("error");

document.getElementById("summarize").addEventListener("click", () => {
  out.value = ""; err.textContent = "";
  chrome.runtime.sendMessage({ type: "SUMMARIZE_ACTIVE_TAB" }, (res) => {
    if (res?.error) err.textContent = res.error;
    else out.value = res?.summary || "(No summary returned)";
  });
});

document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById("scrape").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target : {tabId : tab.id},
    func : extractPolicy,
  },
  async (results) => {
    const text = results[0].result;
    document.getElementById("output").value = "Web Scraping Results: \n" + text.slice(0, 1000) + "...";
  });
});

function extractPolicy() {
  return document.body.innerText;
}