console.log('Smart Input Assistant: Content script loaded');

let state = { enabled: false, mode: 'off', apiKey: '' };
let activeElement = null;
let customInput = null;
let syncTimeout = null;
let observer = null;
let lastCustomValue = '';
const isWhatsApp = window.location.hostname.includes('whatsapp');

function updateState(newState) {
  state = { ...state, ...newState };
  console.log('Smart Input Assistant: Updated state:', state);
  cleanupModes();
  if (state.enabled) {
    if (state.mode === 'habit') {
      runHabitMode();
    } else if (state.mode === 'advanced') {
      runAdvancedMode();
    }
  }
}

function cleanupModes() {
  const existingBox = document.getElementById('custom-input-box');
  if (existingBox) {
    existingBox.remove();
  }
  activeElement = null;
  customInput = null;
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  document.body.classList.remove('custom-input-active');
}

function runHabitMode() {
  console.log('Smart Input Assistant: Habit Mode activated');
  function renderInputBox() {
    if (document.getElementById('custom-input-box') || !activeElement) return;
    const inputBox = document.createElement('div');
    inputBox.id = 'custom-input-box';
    inputBox.className = 'smart-input-box habit-mode';
    inputBox.innerHTML = `
      <div class="input-header">
        <div class="mode-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 3H21V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 21H3V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 3L13.5 10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10.5 13.5L3 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Habit Mode
        </div>
        <button class="close-btn" id="custom-close-btn" title="Close (Esc)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="input-container">
        <textarea id="custom-input" placeholder="Enhanced typing mode - your text syncs automatically..."></textarea>
        <div class="input-footer">
          <div class="sync-indicator">
            <div class="sync-dot"></div>
            <span>Synced</span>
          </div>
          <div class="shortcuts">Enter to send • Esc to close</div>
        </div>
      </div>
    `;
    document.body.appendChild(inputBox);
    document.body.classList.add('custom-input-active');
    document.getElementById('custom-close-btn').onclick = closeInputBox;
    customInput = document.getElementById('custom-input');
    customInput.addEventListener('input', handleCustomInput);
    customInput.addEventListener('keydown', handleKeyDown);
    syncState();
    customInput.focus();
    adjustSize(customInput);
    startSyncLoop();
    startObserver();
    setTimeout(() => inputBox.classList.add('visible'), 10);
  }
  function closeInputBox() {
    const inputBox = document.getElementById('custom-input-box');
    if (inputBox) {
      inputBox.classList.add('closing');
      setTimeout(() => {
        inputBox.remove();
        activeElement = null;
        customInput = null;
        if (observer) observer.disconnect();
        if (syncTimeout) clearTimeout(syncTimeout);
        document.body.classList.remove('custom-input-active');
      }, 200);
    }
  }
  function handleCustomInput(e) {
    if (!activeElement || isWhatsApp) return;
    const newValue = e.target.value;
    if (activeElement.isContentEditable) {
      activeElement.textContent = newValue;
    } else {
      activeElement.value = newValue;
    }
    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
    lastCustomValue = newValue;
    adjustSize(customInput);
    updateSyncIndicator();
  }
  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeInputBox();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (isWhatsApp) {
        handleWhatsAppSend();
      } else {
        if (activeElement) {
          const enterEvent = new KeyboardEvent('keydown', {
            bubbles: true,
            key: 'Enter',
            code: 'Enter'
          });
          activeElement.dispatchEvent(enterEvent);
        }
      }
    }
  }
  function handleWhatsAppSend() {
    const message = customInput.value.trim();
    if (!message) return;
    let waInput = document.querySelector('[contenteditable="true"][data-tab="10"]');
    if (!waInput) {
      waInput = Array.from(document.querySelectorAll('[contenteditable="true"]'))
        .find(el => el.getAttribute('aria-label')?.toLowerCase().includes('type a message'));
    }
    if (!waInput) return;
    waInput.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    const success = document.execCommand('insertText', false, message);
    if (!success || waInput.textContent.trim() !== message) {
      waInput.textContent = message;
    }
    waInput.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: message
    }));
    const fireEnter = () => {
      const down = new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', code: 'Enter' });
      const up = new KeyboardEvent('keyup', { bubbles: true, key: 'Enter', code: 'Enter' });
      waInput.dispatchEvent(down);
      waInput.dispatchEvent(up);
    };
    fireEnter();
    setTimeout(fireEnter, 100);
    customInput.value = '';
    lastCustomValue = '';
    adjustSize(customInput);
  }
  function adjustSize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }
  function syncState() {
    if (activeElement && customInput) {
      const val = activeElement.value || activeElement.textContent || '';
      if (customInput.value !== val) {
        customInput.value = val;
        adjustSize(customInput);
        lastCustomValue = val;
      }
    }
  }
  function startSyncLoop() {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      if (state.mode === 'habit' && customInput) {
        syncState();
        startSyncLoop();
      }
    }, 100);
  }
  function startObserver() {
    if (observer) observer.disconnect();
    if (activeElement?.isContentEditable) {
      observer = new MutationObserver(() => {
        if (customInput && customInput.value !== (activeElement.textContent || '')) {
          customInput.value = activeElement.textContent || '';
          adjustSize(customInput);
        }
      });
      observer.observe(activeElement, { childList: true, characterData: true, subtree: true });
    }
  }
  function updateSyncIndicator() {
    const indicator = document.querySelector('.sync-indicator');
    if (indicator) {
      indicator.classList.add('active');
      setTimeout(() => indicator.classList.remove('active'), 1000);
    }
  }
  document.addEventListener('focusin', (e) => {
    if (state.mode === 'habit' && state.enabled) {
      const target = e.target;
      if ((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) 
          && !target.closest('#custom-input-box')) {
        activeElement = target.closest('.copyable-text.selectable-text') || 
                       target.closest('.copyable-text') || 
                       target;
        renderInputBox();
      }
    }
  });
  document.addEventListener('focusout', () => {
    if (state.mode !== 'habit') {
      closeInputBox();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('custom-input-box')) {
      closeInputBox();
    }
  });
}

function runAdvancedMode() {
  console.log('Smart Input Assistant: Advanced Mode activated');
  const inputBox = document.createElement('div');
  inputBox.id = 'custom-input-box';
  inputBox.className = 'smart-input-box advanced-mode';
  inputBox.innerHTML = `
    <div class="input-header">
      <div class="mode-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.75 17L9 20L20 20L19.25 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 13H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 4V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M8 4L16 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        AI Mode
      </div>
      <button class="close-btn" onclick="this.parentElement.parentElement.remove()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
    <div class="input-container">
      <textarea id="custom-input" placeholder="Ask AI: 'summarize this page' or 'css: make a blue button'"></textarea>
      <div class="input-footer">
        <div class="ai-status">
          <div class="ai-indicator"></div>
          <span>Ready</span>
        </div>
        <div class="shortcuts">Enter to process • css: for styles</div>
      </div>
    </div>
  `;
  document.body.appendChild(inputBox);
  const input = document.getElementById('custom-input');
  setTimeout(() => inputBox.classList.add('visible'), 10);
  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const command = input.value.trim();
      if (!command) return;
      input.disabled = true;
      updateAIStatus('processing', 'Processing...');
      try {
        const result = await processGeminiCommand(command);
        if (command.startsWith('css:')) {
          const style = document.createElement('style');
          style.textContent = result;
          style.id = 'smart-input-generated-css';
          const existing = document.getElementById('smart-input-generated-css');
          if (existing) existing.remove();
          document.head.appendChild(style);
          updateAIStatus('success', 'CSS Applied!');
          showNotification('CSS styles have been applied to the page!', 'success');
        } else {
          updateAIStatus('complete', 'Complete');
          showNotification(result, 'info');
        }
      } catch (error) {
        updateAIStatus('error', 'Error');
        showNotification('Error: ' + error.message, 'error');
      }
      input.disabled = false;
      input.value = '';
      setTimeout(() => updateAIStatus('ready', 'Ready'), 2000);
    }
    if (e.key === 'Escape') {
      inputBox.remove();
    }
  });
  input.focus();
}

function updateAIStatus(status, text) {
  const statusElement = document.querySelector('.ai-status span');
  const indicator = document.querySelector('.ai-indicator');
  if (statusElement) statusElement.textContent = text;
  if (indicator) {
    indicator.className = `ai-indicator ${status}`;
  }
}

async function processGeminiCommand(text) {
  const key = state.apiKey;
  if (!key) {
    throw new Error('API key missing. Please configure it in the extension popup.');
  }
  let prompt = '';
  if (text.startsWith('css:')) {
    prompt = 'Generate only valid CSS code (no explanations, no markdown, no code blocks) based on this description: ' + text.replace(/^css:/i, '').trim();
  } else {
    prompt = 'Provide a concise summary or response to: ' + text;
  }
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.7, 
        maxOutputTokens: text.startsWith('css:') ? 512 : 256 
      }
    })
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  const result = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!result) {
    throw new Error('No response from AI');
  }
  return result;
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `smart-input-notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">
        ${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
      </div>
      <div class="notification-message">${message}</div>
    </div>
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('visible'), 10);
  setTimeout(() => {
    notification.classList.add('hiding');
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}