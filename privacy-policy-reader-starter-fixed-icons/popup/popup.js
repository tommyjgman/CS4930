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

