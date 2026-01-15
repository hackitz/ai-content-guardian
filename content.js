// Content script - displays results on page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ping") {
    sendResponse({ status: "ready" });
    return true;
  }
  
  if (request.action === "showAnalysis") {
    showAnalysisPanel(request);
    sendResponse({ status: "displayed" });
    return true;
  }
});

function showAnalysisPanel(data) {
  // Remove existing panel
  const existing = document.getElementById("ai-guardian-panel");
  if (existing) {
    existing.remove();
  }

  // Create panel
  const panel = document.createElement("div");
  panel.id = "ai-guardian-panel";
  panel.className = "ai-guardian-panel";

  if (data.status === "loading") {
    panel.innerHTML = `
      <div class="ai-guardian-header">
        <h2>🔍 Analyzing...</h2>
        <button class="ai-guardian-close" onclick="this.closest('.ai-guardian-panel').remove()">✕</button>
      </div>
      <div class="ai-guardian-body">
        <div class="ai-guardian-loading">
          <div class="ai-guardian-spinner"></div>
          <p>Checking for AI-generated content...</p>
        </div>
      </div>
    `;
  } else if (data.status === "error") {
    panel.innerHTML = `
      <div class="ai-guardian-header">
        <h2>⚠️ Error</h2>
        <button class="ai-guardian-close" onclick="this.closest('.ai-guardian-panel').remove()">✕</button>
      </div>
      <div class="ai-guardian-body">
        <p class="ai-guardian-error">${data.message}</p>
        <button class="ai-guardian-button" onclick="this.closest('.ai-guardian-panel').remove()">Close</button>
      </div>
    `;
  } else if (data.status === "success") {
    const result = data.result;
    panel.innerHTML = createResultHTML(result);
  }

  document.body.appendChild(panel);

  // Load saved size preference
  const savedSize = localStorage.getItem('ai-guardian-size') || 'large';
  if (savedSize === 'compact') {
    panel.classList.add('compact');
  }

  // Add close button handler
  const closeBtn = panel.querySelector(".ai-guardian-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => panel.remove());
  }

  // Add size toggle handler
  const sizeToggle = panel.querySelector("#ai-guardian-size-toggle");
  if (sizeToggle) {
    updateToggleText(panel, sizeToggle);
    sizeToggle.addEventListener("click", () => {
      panel.classList.toggle('compact');
      const isCompact = panel.classList.contains('compact');
      localStorage.setItem('ai-guardian-size', isCompact ? 'compact' : 'large');
      updateToggleText(panel, sizeToggle);
    });
  }

  // Add learn more button handler
  const learnBtn = panel.querySelector(".ai-guardian-learn");
  if (learnBtn) {
    learnBtn.addEventListener("click", () => {
      toggleLearnMore(panel);
    });
  }
}

function updateToggleText(panel, button) {
  const isCompact = panel.classList.contains('compact');
  button.textContent = isCompact ? 'Large' : 'Compact';
  button.title = isCompact ? 'Switch to large mode (better for elderly)' : 'Switch to compact mode';
}

function createResultHTML(result) {
  const score = result.score;
  const scoreColor = getScoreColor(score);
  const scoreText = getScoreText(score);
  const emoji = getScoreEmoji(score);
  
  return `
    <div class="ai-guardian-header">
      <h2>${emoji} AI Detection Result</h2>
      <div class="ai-guardian-header-controls">
        <button class="ai-guardian-size-toggle" id="ai-guardian-size-toggle">Compact</button>
        <button class="ai-guardian-close">✕</button>
      </div>
    </div>
    
    <div class="ai-guardian-body">
      ${result.sourceCredibility ? createSourceSection(result.sourceCredibility) : ''}
      
      <div class="ai-guardian-score-section">
        <div class="ai-guardian-score-label">AI Likelihood Score</div>
        <div class="ai-guardian-score-display" style="background: ${scoreColor}">
          <div class="ai-guardian-score-number">${score}/10</div>
          <div class="ai-guardian-score-text">${scoreText}</div>
        </div>
        <div class="ai-guardian-score-bar">
          ${createScoreBar(score)}
        </div>
      </div>

      ${result.indicators.length > 0 ? `
        <div class="ai-guardian-section">
          <h3>🔍 What We Found:</h3>
          <ul class="ai-guardian-list">
            ${result.indicators.map(ind => `<li>${ind}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${result.details.length > 0 ? `
        <div class="ai-guardian-section ai-guardian-details">
          <h3>📋 Details:</h3>
          <ul class="ai-guardian-list">
            ${result.details.map(detail => `<li>${detail}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <div class="ai-guardian-education">
        <h3>💡 What This Means:</h3>
        <p>${getEducationalMessage(score, result.type)}</p>
      </div>

      <div class="ai-guardian-disclaimer">
        <strong>⚠️ Important:</strong> This is an automated analysis and may not be 100% accurate. 
        Always use critical thinking and verify information from multiple trusted sources.
      </div>

      <div class="ai-guardian-actions">
        <button class="ai-guardian-button ai-guardian-learn">Learn More About AI Detection</button>
        <button class="ai-guardian-button ai-guardian-secondary" onclick="this.closest('.ai-guardian-panel').remove()">Close</button>
      </div>

      <div class="ai-guardian-learn-more" style="display: none;">
        <h3>🎓 How to Spot AI-Generated Content:</h3>
        
        <div class="ai-guardian-tip">
          <strong>For Text:</strong>
          <ul>
            <li>Overly perfect grammar with no mistakes</li>
            <li>Generic, impersonal tone</li>
            <li>Repetitive phrasing or structure</li>
            <li>Lack of personal anecdotes or specific details</li>
            <li>Very formal language when casual would be normal</li>
          </ul>
        </div>

        <div class="ai-guardian-tip">
          <strong>For Images:</strong>
          <ul>
            <li>Weird or extra fingers on hands</li>
            <li>Strange text that looks like gibberish</li>
            <li>Inconsistent lighting or shadows</li>
            <li>Unnaturally smooth or "plastic" looking skin</li>
            <li>Blurry or melted backgrounds</li>
            <li>Impossible architecture or geometry</li>
          </ul>
        </div>

        <div class="ai-guardian-tip">
          <strong>For Videos:</strong>
          <ul>
            <li>Unnatural facial movements or expressions</li>
            <li>Mismatched lip-syncing</li>
            <li>Flickering or glitches around edges</li>
            <li>Inconsistent lighting as person moves</li>
            <li>Check if it's from a verified source</li>
          </ul>
        </div>

        <div class="ai-guardian-tip">
          <strong>Always Ask:</strong>
          <ul>
            <li>Is this from a trusted, verified source?</li>
            <li>Can I find this on official websites or news?</li>
            <li>Does it seem too perfect or sensational?</li>
            <li>What's the motivation behind this content?</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

function createSourceSection(source) {
  let html = '<div class="ai-guardian-section ai-guardian-source">';
  
  if (source.isTrusted) {
    html += '<div class="ai-guardian-source-badge ai-guardian-trusted">✅ Trusted Source</div>';
    html += '<p>This content is from a verified, reputable news organization.</p>';
  } else if (source.isOfficial) {
    html += '<div class="ai-guardian-source-badge ai-guardian-trusted">✅ Official Source</div>';
    html += '<p>This is from a government or official institutional website.</p>';
  } else if (source.isEducational) {
    html += '<div class="ai-guardian-source-badge ai-guardian-trusted">✅ Educational Institution</div>';
    html += '<p>This content is from an academic or educational source.</p>';
  } else if (source.isAIPlatform) {
    html += '<div class="ai-guardian-source-badge ai-guardian-warning">⚠️ AI Content Platform</div>';
    html += `<p>This is from <strong>${source.platform}</strong>, a known AI generation service. Content is likely AI-created.</p>`;
  } else if (source.isContentFarm) {
    html += '<div class="ai-guardian-source-badge ai-guardian-warning">⚠️ Low-Quality Content Site</div>';
    html += '<p>This site is known for mass-produced, low-quality content.</p>';
  } else {
    html += '<div class="ai-guardian-source-badge ai-guardian-unknown">❓ Unknown Source</div>';
    html += '<p>We cannot verify the credibility of this source. Be cautious and cross-check information.</p>';
  }
  
  html += '</div>';
  return html;
}

function createScoreBar(score) {
  let html = '';
  for (let i = 1; i <= 10; i++) {
    const active = i <= score;
    const color = i <= 3 ? 'green' : i <= 6 ? 'yellow' : 'red';
    html += `<div class="ai-guardian-score-segment ${active ? 'active' : ''} ${color}"></div>`;
  }
  return html;
}

function getScoreColor(score) {
  if (score <= 3) return '#4caf50';
  if (score <= 6) return '#ff9800';
  return '#f44336';
}

function getScoreText(score) {
  if (score <= 2) return 'Very Low - Likely Human';
  if (score <= 4) return 'Low - Probably Human';
  if (score <= 6) return 'Medium - Uncertain';
  if (score <= 8) return 'High - Likely AI';
  return 'Very High - Probably AI';
}

function getScoreEmoji(score) {
  if (score <= 3) return '✅';
  if (score <= 6) return '⚠️';
  return '🤖';
}

function getEducationalMessage(score, type) {
  if (score <= 3) {
    return `This ${type} shows few signs of AI generation. It appears to be human-created, but always verify important information from trusted sources.`;
  } else if (score <= 6) {
    return `This ${type} shows some indicators that could suggest AI generation, but it's not conclusive. Exercise caution and verify the source and information independently.`;
  } else {
    return `This ${type} shows strong indicators of AI generation. Be very cautious, especially if this content makes claims, requests money, or asks for personal information. Verify through official channels.`;
  }
}

function toggleLearnMore(panel) {
  const learnMore = panel.querySelector('.ai-guardian-learn-more');
  const button = panel.querySelector('.ai-guardian-learn');
  
  if (learnMore.style.display === 'none') {
    learnMore.style.display = 'block';
    button.textContent = 'Hide Learning Resources';
  } else {
    learnMore.style.display = 'none';
    button.textContent = 'Learn More About AI Detection';
  }
}
