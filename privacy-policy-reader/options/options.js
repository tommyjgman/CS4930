const $ = (s) => document.querySelector(s);
const apiKeyEl = $("#apiKey");
const modelEl  = $("#model");
const statusEl = $("#status");
const saveBtn  = $("#save");

(async function init() {
  const { apiKey, model } = await chrome.storage.sync.get({
    apiKey: "",
    model: "gpt-4o-mini"
  });
  apiKeyEl.value = apiKey || "";
  modelEl.value = model || "gpt-4o-mini";
})();

saveBtn.addEventListener("click", async () => {
  await chrome.storage.sync.set({
    apiKey: apiKeyEl.value.trim(),
    model: modelEl.value
  });
  statusEl.textContent = "Saved.";
  statusEl.classList.add("ok");
  setTimeout(() => { statusEl.textContent = ""; statusEl.classList.remove("ok"); }, 1500);
});
