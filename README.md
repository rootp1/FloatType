# Smart Input Assistant

Smart Input Assistant is a browser extension that enhances your typing experience with AI-powered assistance and custom input modes. It brings input boxes to eye level, syncs your text, and provides advanced features like AI-driven suggestions and CSS generation using Google Gemini.

## Features
- **Habit Mode:** Floating input box synced with any focused input or contenteditable field.
- **AI Mode:** Use Google Gemini to summarize, generate CSS, or get smart suggestions directly in your browser.
- **Customizable:** Easily toggle modes and settings from the extension popup.
- **Secure:** API key is stored locally and never sent to third parties except Google Gemini API.

---

## Getting Started

### 1. Clone or Download the Repository
```bash
git clone <this-repo-url>
cd <repo-folder>
```

### 2. Load the Extension in Your Browser

#### For Chrome/Edge/Brave:
1. Open `chrome://extensions/` in your browser.
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked**.
4. Select the `adv_mode` folder from this repository.

#### For Firefox:
1. Open `about:debugging#/runtime/this-firefox` in your browser.
2. Click **Load Temporary Add-on**.
3. Select the `manifest.json` file inside the `adv_mode` folder.

---

### 3. Start the Backend Server (for Gemini API Key Proxy)

The extension uses a local Node.js server to securely expose your Gemini API key to the extension.

#### Steps:
1. Go to the `server` directory:
   ```bash
   cd server
   ```
2. Create a `.env` file and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your-google-gemini-api-key-here
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
   The server will run on `http://localhost:3000` and expose `/gemini-proxy` endpoint.

---

### 4. Configure the Extension
- Click the extension icon in your browser.
- Enter your Gemini API key in the popup (or let it auto-fetch from the server).
- Choose your preferred mode (Habit or AI).
- Enable the extension.

---

## Keyboard Shortcuts
- **Show/Hide Popup:** (see extension settings or browser shortcuts page)
- **Enter:** Send or process input
- **Esc:** Close popup

---

## Security & Privacy
- Your Gemini API key is only stored locally and proxied via your own server.
- No data is sent to third parties except Google Gemini API when using AI features.

---

## Troubleshooting
- Make sure the backend server is running and accessible at `http://localhost:3000`.
- Ensure your API key is valid and has access to Gemini API.
- For any issues, reload the extension or restart your browser.

---


- **Technical Approach for whatsapp web:**
  - The extension detects when the WhatsApp input field is focused by listening for focus events on input and contenteditable elements.
  - It injects a custom floating input box overlay, styled to be draggable and resizable using CSS and JavaScript.
  - The floating box synchronizes its value with the WhatsApp input using DOM events and programmatic value updates.
  - When Enter is pressed, a synthetic keyboard event is dispatched to WhatsApp's input to trigger message sending.
  - The solution is robust for WhatsApp Web's dynamic DOM and works for both classic and new WhatsApp layouts.

---

## License
MIT
