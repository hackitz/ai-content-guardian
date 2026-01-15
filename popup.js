// Popup script for AI Content Guardian

document.addEventListener("DOMContentLoaded", async () => {
  // Tab switching
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active from all
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      
      // Add active to clicked
      tab.classList.add('active');
      const tabId = tab.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Pro Mode toggle
  const proModeToggle = document.getElementById('proModeToggle');
  const proSettings = document.getElementById('proSettings');
  const proDisabled = document.getElementById('proDisabled');
  const saveBtn = document.getElementById('saveProSettings');
  const apiKeyInput = document.getElementById('apiKey');
  const aiModelSelect = document.getElementById('aiModel');
  const statusDiv = document.getElementById('proStatus');
  
  // Load saved settings
  const settings = await chrome.storage.local.get(['proModeEnabled', 'apiKey', 'aiModel']);
  
  if (settings.proModeEnabled) {
    proModeToggle.checked = true;
    proSettings.style.display = 'block';
    proDisabled.style.display = 'none';
  }
  
  if (settings.apiKey) {
    apiKeyInput.value = settings.apiKey;
  }
  
  if (settings.aiModel) {
    aiModelSelect.value = settings.aiModel;
  }
  
  // Toggle Pro Mode
  proModeToggle.addEventListener('change', () => {
    if (proModeToggle.checked) {
      proSettings.style.display = 'block';
      proDisabled.style.display = 'none';
    } else {
      proSettings.style.display = 'none';
      proDisabled.style.display = 'block';
      
      // Disable pro mode
      chrome.storage.local.set({ proModeEnabled: false });
      showStatus('Pro Mode disabled', 'success');
    }
  });
  
  // Save Pro Settings
  saveBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const aiModel = aiModelSelect.value;
    
    if (!apiKey) {
      showStatus('Please enter an API key', 'error');
      return;
    }
    
    // Validate API key format based on model
    if (aiModel === 'claude' && !apiKey.startsWith('sk-ant-')) {
      showStatus('Invalid Anthropic API key format. Should start with "sk-ant-"', 'error');
      return;
    } else if (aiModel === 'openai' && !apiKey.startsWith('sk-')) {
      showStatus('Invalid OpenAI API key format. Should start with "sk-"', 'error');
      return;
    }
    
    try {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      
      // Save to storage
      await chrome.storage.local.set({
        proModeEnabled: true,
        apiKey: apiKey,
        aiModel: aiModel
      });
      
      showStatus('✓ Pro Mode enabled! API key saved securely.', 'success');
      saveBtn.textContent = 'Save Pro Settings';
      saveBtn.disabled = false;
    } catch (error) {
      showStatus('Error saving settings: ' + error.message, 'error');
      saveBtn.textContent = 'Save Pro Settings';
      saveBtn.disabled = false;
    }
  });
  
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
  
  // QR Code toggle button
  const qrToggleBtn = document.getElementById('qrToggleBtn');
  if (qrToggleBtn) {
    qrToggleBtn.addEventListener('click', () => {
      const qrCode = document.getElementById('qrCode');
      qrCode.classList.toggle('show');
      
      // Update button text
      if (qrCode.classList.contains('show')) {
        qrToggleBtn.textContent = '📱 Hide PayPal QR Code';
      } else {
        qrToggleBtn.textContent = '📱 Show PayPal QR Code';
      }
    });
  }
});
