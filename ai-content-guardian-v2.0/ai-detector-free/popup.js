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
  
  // Email Checker
  const checkEmailBtn = document.getElementById('checkEmailBtn');
  const emailContent = document.getElementById('emailContent');
  const emailResults = document.getElementById('emailResults');
  
  if (checkEmailBtn) {
    checkEmailBtn.addEventListener('click', async () => {
      const email = emailContent.value.trim();
      
      if (!email) {
        alert('Please paste an email to check');
        return;
      }
      
      checkEmailBtn.disabled = true;
      checkEmailBtn.textContent = '🔍 Analyzing Email...';
      
      // Analyze the email
      const analysis = analyzeEmail(email);
      
      // Check if Pro Mode is enabled for enhanced analysis
      const settings = await chrome.storage.local.get(['proModeEnabled', 'apiKey']);
      
      if (settings.proModeEnabled && settings.apiKey) {
        // Could enhance with AI analysis here
        analysis.isPro = true;
      }
      
      // Display results
      displayEmailResults(analysis);
      
      checkEmailBtn.disabled = false;
      checkEmailBtn.textContent = '🔍 Check Email for Scams';
      
      // Scroll to results
      emailResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
  
  function analyzeEmail(emailText) {
    const analysis = {
      riskLevel: 0, // 0-10
      warnings: [],
      redFlags: [],
      safeIndicators: [],
      links: [],
      recommendations: []
    };
    
    const emailLower = emailText.toLowerCase();
    
    // Extract links
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const foundLinks = emailText.match(urlRegex) || [];
    analysis.links = foundLinks;
    
    // Check for urgency/threat language
    const urgentPhrases = [
      'urgent', 'immediate action', 'act now', 'within 24 hours',
      'account will be closed', 'suspended', 'verify now', 'click here now',
      'limited time', 'expires today', 'final notice', 'last warning'
    ];
    
    urgentPhrases.forEach(phrase => {
      if (emailLower.includes(phrase)) {
        analysis.riskLevel += 1.5;
        analysis.redFlags.push(`⚠️ Urgency language: "${phrase}"`);
      }
    });
    
    // Check for financial threats/promises
    const financialPhrases = [
      'prize', 'won', 'lottery', 'refund', 'claim your',
      'inheritance', 'million', 'transfer', 'tax refund',
      'verify your payment', 'update payment', 'billing problem'
    ];
    
    financialPhrases.forEach(phrase => {
      if (emailLower.includes(phrase)) {
        analysis.riskLevel += 1.5;
        analysis.redFlags.push(`💰 Financial lure: "${phrase}"`);
      }
    });
    
    // Check for credential requests
    const credentialPhrases = [
      'password', 'social security', 'ssn', 'credit card',
      'bank account', 'routing number', 'pin', 'cvv',
      'verify your identity', 'confirm your account', 'login credentials'
    ];
    
    credentialPhrases.forEach(phrase => {
      if (emailLower.includes(phrase)) {
        analysis.riskLevel += 2;
        analysis.redFlags.push(`🔑 Requests sensitive info: "${phrase}"`);
      }
    });
    
    // Check for impersonation
    const impersonationTerms = [
      'amazon', 'paypal', 'bank', 'irs', 'social security',
      'microsoft', 'apple', 'google', 'netflix', 'cra',
      'fedex', 'ups', 'usps', 'dhl'
    ];
    
    impersonationTerms.forEach(term => {
      if (emailLower.includes(term)) {
        analysis.warnings.push(`🏢 Mentions: ${term.toUpperCase()}`);
        analysis.riskLevel += 0.5;
      }
    });
    
    // Check for suspicious links
    if (foundLinks.length > 0) {
      analysis.warnings.push(`🔗 Contains ${foundLinks.length} link(s) - verify before clicking`);
      
      foundLinks.forEach(link => {
        // Check for URL shorteners
        if (link.includes('bit.ly') || link.includes('tinyurl') || link.includes('t.co')) {
          analysis.riskLevel += 1.5;
          analysis.redFlags.push(`🚨 Shortened URL detected (hides real destination)`);
        }
        
        // Check for IP addresses
        if (/\d+\.\d+\.\d+\.\d+/.test(link)) {
          analysis.riskLevel += 2;
          analysis.redFlags.push(`🚨 Link uses IP address instead of domain name`);
        }
        
        // Check for suspicious domains
        if (link.includes('-') && (link.includes('verify') || link.includes('secure') || link.includes('account'))) {
          analysis.riskLevel += 1;
          analysis.redFlags.push(`⚠️ Suspicious URL pattern detected`);
        }
      });
    }
    
    // Check for poor grammar (simplified)
    const grammarIssues = (emailText.match(/\s{2,}/g) || []).length + // Multiple spaces
                          (emailText.match(/[.!?]{2,}/g) || []).length; // Multiple punctuation
    
    if (grammarIssues > 3) {
      analysis.riskLevel += 1;
      analysis.redFlags.push(`📝 Poor formatting (${grammarIssues} issues detected)`);
    }
    
    // Check for generic greeting
    if (emailLower.includes('dear customer') || emailLower.includes('dear user') || 
        emailLower.includes('dear member') || emailLower.includes('valued customer')) {
      analysis.riskLevel += 1;
      analysis.redFlags.push(`👤 Generic greeting (not personalized)`);
    }
    
    // Positive indicators
    if (!foundLinks.length) {
      analysis.safeIndicators.push('✅ No links in email');
    }
    
    if (!/(password|account|verify|urgent|prize|won|claim)/i.test(emailText)) {
      analysis.safeIndicators.push('✅ No common scam keywords');
    }
    
    // Generate recommendations
    if (analysis.riskLevel > 7) {
      analysis.recommendations.push('🚨 HIGH RISK: This email shows multiple scam indicators. Do NOT respond, click links, or provide information. Delete this email.');
    } else if (analysis.riskLevel > 4) {
      analysis.recommendations.push('⚠️ MEDIUM RISK: This email has suspicious elements. Verify independently before taking action.');
    } else if (analysis.riskLevel > 2) {
      analysis.recommendations.push('⚠️ LOW-MEDIUM RISK: Exercise caution. Some suspicious patterns detected.');
    } else {
      analysis.recommendations.push('✅ LOW RISK: Few scam indicators, but always stay cautious.');
    }
    
    // Specific recommendations based on content
    if (emailLower.includes('bank') || emailLower.includes('credit card')) {
      analysis.recommendations.push('📞 If this is about your bank: Call the number on the back of your card (NOT a number from the email)');
    }
    
    if (emailLower.includes('package') || emailLower.includes('delivery') || 
        emailLower.includes('fedex') || emailLower.includes('ups') || emailLower.includes('usps')) {
      analysis.recommendations.push('📦 For package notifications: Check tracking directly on the shipping company\'s official website');
    }
    
    if (emailLower.includes('irs') || emailLower.includes('tax') || emailLower.includes('cra')) {
      analysis.recommendations.push('🏛️ IMPORTANT: The IRS/CRA NEVER initiates contact by email. This is likely a scam.');
    }
    
    if (emailLower.includes('amazon') || emailLower.includes('paypal') || emailLower.includes('netflix')) {
      analysis.recommendations.push('🌐 Log into your account directly (type the website yourself) to check - don\'t use links from the email');
    }
    
    if (foundLinks.length > 0) {
      analysis.recommendations.push('🔗 NEVER click links in suspicious emails. Type the website address yourself.');
    }
    
    if (/(password|ssn|social security|credit card|bank account)/i.test(emailText)) {
      analysis.recommendations.push('🔐 Legitimate companies NEVER ask for passwords, SSN, or full card numbers via email');
    }
    
    // Cap risk level at 10
    analysis.riskLevel = Math.min(Math.round(analysis.riskLevel), 10);
    
    return analysis;
  }
  
  function displayEmailResults(analysis) {
    const riskColor = analysis.riskLevel >= 7 ? '#f44336' : 
                      analysis.riskLevel >= 4 ? '#ff9800' : '#4caf50';
    
    const riskText = analysis.riskLevel >= 7 ? 'HIGH RISK - Likely Scam' :
                     analysis.riskLevel >= 4 ? 'MEDIUM RISK - Be Cautious' :
                     analysis.riskLevel >= 2 ? 'LOW-MEDIUM RISK' : 'LOW RISK';
    
    let html = `
      <div style="background: white; border: 3px solid ${riskColor}; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 48px; font-weight: 900; color: ${riskColor};">
            ${analysis.riskLevel}/10
          </div>
          <div style="font-size: 20px; font-weight: 700; color: ${riskColor};">
            ${riskText}
          </div>
        </div>
    `;
    
    // Red Flags
    if (analysis.redFlags.length > 0) {
      html += `
        <div style="background: #ffebee; border-left: 4px solid #f44336; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #c62828;">🚨 Red Flags Found:</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
            ${analysis.redFlags.map(flag => `<li>${flag}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    // Warnings
    if (analysis.warnings.length > 0) {
      html += `
        <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #e65100;">⚠️ Warnings:</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
            ${analysis.warnings.map(warn => `<li>${warn}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    // Safe indicators
    if (analysis.safeIndicators.length > 0) {
      html += `
        <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #2e7d32;">✅ Positive Signs:</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
            ${analysis.safeIndicators.map(ind => `<li>${ind}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    // Links found
    if (analysis.links.length > 0) {
      html += `
        <div style="background: #f5f5f5; border-left: 4px solid #666; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #333;">🔗 Links Found (${analysis.links.length}):</h4>
          <div style="font-size: 12px; word-break: break-all; max-height: 100px; overflow-y: auto;">
            ${analysis.links.map(link => `<div style="margin-bottom: 4px; padding: 4px; background: white; border-radius: 4px;">${link}</div>`).join('')}
          </div>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #d32f2f; font-weight: 600;">⚠️ DO NOT click these links unless you're absolutely certain they're safe!</p>
        </div>
      `;
    }
    
    // Recommendations
    html += `
      <div style="background: #e3f2fd; border: 2px solid #2196f3; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
        <h4 style="margin: 0 0 12px 0; color: #1565c0;">💡 What You Should Do:</h4>
        <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.7;">
          ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ol>
      </div>
    `;
    
    html += `
      <div style="text-align: center; padding-top: 16px; border-top: 2px solid #ddd;">
        <p style="font-size: 13px; color: #666; margin: 0;">
          <strong>When in doubt, ask a trusted family member or friend!</strong>
        </p>
      </div>
    </div>
    `;
    
    emailResults.innerHTML = html;
    emailResults.style.display = 'block';
  }
  
  // Quick Check URL button
  const quickCheckBtn = document.getElementById('quickCheckBtn');
  const quickCheckUrl = document.getElementById('quickCheckUrl');
  
  if (quickCheckBtn) {
    quickCheckBtn.addEventListener('click', async () => {
      let urlToCheck = quickCheckUrl.value.trim();
      
      // If no URL provided, use current tab
      if (!urlToCheck) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        urlToCheck = tab.url;
      }
      
      // Validate URL
      if (!urlToCheck.startsWith('http://') && !urlToCheck.startsWith('https://')) {
        urlToCheck = 'https://' + urlToCheck;
      }
      
      try {
        new URL(urlToCheck); // Validate URL format
        
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Send message to background script to analyze the URL
        chrome.runtime.sendMessage({
          action: 'analyzeUrl',
          url: urlToCheck,
          tabId: tab.id
        });
        
        // Close popup
        window.close();
      } catch (error) {
        alert('Please enter a valid URL (e.g., example.com or https://example.com)');
      }
    });
    
    // Allow Enter key to submit
    quickCheckUrl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        quickCheckBtn.click();
      }
    });
  }
});
