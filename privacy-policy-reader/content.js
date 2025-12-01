// content.js
let privacyPolicyDetected = false;

function getVisibleText() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const parts = [];
  while (walker.nextNode()) {
    const t = walker.currentNode.nodeValue;
    if (t && t.trim().length > 0) parts.push(t.trim());
  }
  return parts.join(" ");
}

function findPolicyCandidate() {
  const headings = [...document.querySelectorAll("h1,h2,h3")];
  const hit = headings.find(h => /privacy\s+policy|privacy/i.test(h.textContent || ""));
  if (hit) {
    const sectionTexts = [];
    let node = hit;
    while (node && !(node !== hit && /H[1-3]/.test(node.tagName))) {
      if (node.innerText && node.innerText.trim()) sectionTexts.push(node.innerText.trim());
      node = node.nextElementSibling;
    }
    return sectionTexts.join("\n\n");
  }
  return null;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "EXTRACT_POLICY") {
    const policy = findPolicyCandidate() || getVisibleText();
    sendResponse({ text: policy.slice(0, 200000) });
  }
});

function isPrivacyPolicyPage() {
  console.log("Running privacy policy detection");
  const title = document.title.toLowerCase();
  const text = document.body.innerText.toLowerCase();

  const keywords = [
    "privacy policy",
    "privacy statement",
    "your privacy",
    "data protection",
    "information we collect",
    "data privacy"
  ];

  const detected = keywords.some(k =>
    title.includes(k) && text.includes(k)
  );

  console.log("Detection result", detected);
  return detected;
}

function detectPrivacyPolicy(){
  if (privacyPolicyDetected) return;

  if (isPrivacyPolicyPage()){
    privacyPolicyDetected = true;
    console.log("Privacy policy detected");
    chrome.runtime.sendMessage({action: "privacyPolicyDetected"});
  }
}

window.addEventListener("load", () => {
  setTimeout(detectPrivacyPolicy, 2000);
});

const observer = new MutationObserver(detectPrivacyPolicy);
observer.observe(document.body, {childList: true, subtree: true});