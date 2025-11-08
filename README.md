# Privacy Policy Reader

**Authors:** Nathan Schluessler, Thomas Gherna, and Evan Futey  
**Course:** CS 4930 — Privacy and Censorship  
**Instructor:** Dr. Serena Sullivan  
**University of Colorado Colorado Springs**  
**Date:** Fall 2025  

---

## Project Overview

Modern privacy policies are lengthy, full of legal and technical jargon, and often ignored by users. The **Privacy Policy Reader** is a Chrome browser extension designed to automatically **summarize and simplify** these policies using OpenAI’s language model (GPT-4o-Mini).  
The extension enables users to understand what data is collected, how it is used, and whether it is shared — empowering them to make informed decisions about their privacy.

---

## Features

- **AI Summarization** — Uses OpenAI’s GPT-4o-Mini API to generate a concise 150-250 word summary of any pasted privacy policy.  
- **Text Input Interface** — Users can paste policy text directly into the popup interface.  
- **Readable Bullet-Point Output** — Summaries highlight key categories:
  - Data collected  
  - How data is used  
  - Third-party sharing  
  - Retention policies  
  - User rights and opt-out options  
  - Contact information  
- **Clean UI** — Simple, mobile-responsive popup design with options for summary tone (Standard, Risk-focused, Child-friendly, Executive).  
- **Secure Key Storage** — OpenAI API key is entered by the user and securely stored locally using Chrome’s encrypted `storage.sync` API.  

---

## Architecture

| Component | Description |
|------------|-------------|
| **popup.html / popup.js / popup.css** | User interface for pasting text, selecting summary style, and displaying the output summary. |
| **background.js** | Main service worker that retrieves the stored API key, communicates with OpenAI API, and returns summaries to the popup. |
| **options.html / options.js** | Page where the user securely enters their OpenAI API key and selects the preferred model (default: `gpt-4o-mini`). |
| **manifest.json** | Defines Chrome Extension metadata and permissions (MV3). |
| **icons/** | Set of extension icons (16×, 48×, 128×). |

---

## How It Works

1. **User Input**  
   - The user pastes privacy policy text into the popup interface.

2. **Message Routing**  
   - The popup sends the text to `background.js` via a Chrome message.

3. **AI Summarization**  
   - `background.js` retrieves the user’s API key from `chrome.storage.sync` and calls OpenAI’s GPT-4o-Mini model to summarize the text.

4. **Output Display**  
   - The summary is returned to the popup and rendered in a clear, structured format with bullet points.

---

## Installation & Usage

1. **Load the Extension**
   - Open `chrome://extensions`
   - Enable **Developer Mode**
   - Click **Load Unpacked**
   - Select the folder containing `manifest.json`

2. **Set Your API Key**
   - Click the extension’s puzzle-piece icon → Manage Extensions → **Options**
   - Paste your **OpenAI API key** (e.g., `sk-...`)  
   - Click **Save**

3. **Use the Extension**
   - Open the popup
   - Paste a privacy policy or section of one
   - Select summary style (Standard, Risk, Child, Executive)
   - Click **Summarize**
   - Copy the generated summary if desired

---

## Security Note

Your **OpenAI API key** is:
- **Entered manually** in the Options page (never hard-coded or included in source code).  
- **Stored locally** using Chrome’s built-in `chrome.storage.sync` API, which encrypts data tied to your browser profile.  
- **Accessible only** to the extension’s background and popup scripts — not to web pages or other extensions.  
- **Never transmitted or committed** to GitHub or external servers except directly to OpenAI’s API over HTTPS.

**Important:**  
- Never commit your key or share screenshots containing it.  
- If your key is ever exposed, revoke it in the [OpenAI Dashboard](https://platform.openai.com/account/api-keys).  
- Teammates should enter the key individually for testing.  
- The repo should remain **private** to avoid scraping by bots.

---

## Technologies Used

| Category | Tools / Libraries |
|-----------|-------------------|
| **Languages** | JavaScript, HTML5, CSS3 |
| **Frameworks** | Chromium Extension (Manifest V3), OpenAI SDK (Node.js) |
| **Version Control** | GitHub (private repository) |
| **Testing** | Manual browser testing on Chrome v116+ |

---

## Deliverables (per proposal)

| Task | Owner | Status |
|------|--------|--------|
| Framework for Browser Extension | Nathan | Complete |
| Text Extraction Process | Evan | Complete |
| Text Highlight Function | Evan | Complete |
| Text Processing API (OpenAI Integration) | Thomas | In Progress |
| Browser Extension UI | Thomas |  In Progress |
| Ethical & Legal Considerations | Team | Ongoing |
| Final Testing | Team | Dec 2025 |
| Final Presentation | Team | Dec 2025 |

---

## References

- Harkous, H., et al. (2018). *Polisis: Automated analysis and presentation of privacy policies using deep learning.* USENIX Security Symposium.  
- Kelley, P. G., et al. (2009). *A “Nutrition Label” for Privacy.* Proceedings of SOUPS ’09.  
- Wagner, I. (2023). *Privacy Policies Across the Ages.* ACM Transactions on Privacy and Security.  
- Obar, J. A., & Oeldorf-Hirsch, A. (2018). *The Biggest Lie on the Internet.* *Information, Communication & Society.*  
- McDonald, A. M., et al. (2009). *A Comparative Study of Online Privacy Policies and Formats.* PETS.  
- Reidenberg, J. R., et al. (2014). *Disagreeable Privacy Policies.* SSRN Electronic Journal.  

---

## Disclaimer

This tool provides **AI-generated summaries** of privacy policies.  
Summaries may omit legal nuances. Users should refer to the **official policy** for complete and authoritative information.

---

**© 2025 — UCCS CS 4930 Privacy & Censorship Project**
