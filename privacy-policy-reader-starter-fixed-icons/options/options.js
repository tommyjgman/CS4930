const apiKeyEl = document.getElementById("apiKey");
const modelEl = document.getElementById("model");
const statusEl = document.getElementById("status");

(async () => {
  const { apiKey, model } = await chrome.storage.sync.get({ apiKey: "", model: "gpt-4o-mini" });
  apiKeyEl.value = apiKey;
  modelEl.value = model;
})();

document.getElementById("save").addEventListener("click", async () => {
  await chrome.storage.sync.set({ apiKey: apiKeyEl.value, model: modelEl.value });
  statusEl.textContent = "Saved!";
  setTimeout(() => statusEl.textContent = "", 1200);
});