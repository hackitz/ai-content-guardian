// Database of known sites, platforms, and indicators (inline)
const SITE_DATABASE = {
  // Trusted news sources
  trustedNews: [
    'apnews.com', 'reuters.com', 'bbc.com', 'bbc.co.uk',
    'npr.org', 'pbs.org', 'theguardian.com', 'wsj.com',
    'nytimes.com', 'washingtonpost.com', 'usatoday.com',
    'cbsnews.com', 'abcnews.go.com', 'nbcnews.com',
    'cnn.com', 'time.com', 'theatlantic.com', 'economist.com',
    'financialtimes.com', 'bloomberg.com', 'aljazeera.com'
  ],

  // Known AI art/image generation platforms
  aiImagePlatforms: [
    'midjourney.com', 'openai.com/dall-e', 'stability.ai',
    'stablediffusionweb.com', 'dreamstudio.ai', 'craiyon.com',
    'nightcafe.studio', 'artbreeder.com', 'playground.ai',
    'lexica.art', 'civitai.com', 'tensor.art', 'leonardo.ai',
    'picso.ai', 'deepai.org', 'hotpot.ai', 'fotor.com/ai-image-generator'
  ],

  // Known AI text generation/content platforms
  aiTextPlatforms: [
    'chat.openai.com', 'bard.google.com', 'claude.ai',
    'character.ai', 'jasper.ai', 'copy.ai', 'writesonic.com',
    'rytr.me', 'shortly.ai', 'peppertype.ai'
  ],

  // Known deepfake/AI video platforms
  aiVideoPlatforms: [
    'synthesia.io', 'deepfake', 'runway.ml', 'd-id.com',
    'heygen.com', 'colossyan.com', 'hour.one'
  ],

  // Content farms
  contentFarms: [
    'taboola.com', 'outbrain.com', 'mgid.com',
    'revcontent.com', 'content.ad'
  ],

  // Verified creator platforms
  verifiedPlatforms: [
    'youtube.com', 'vimeo.com', 'twitter.com', 'x.com',
    'instagram.com', 'facebook.com', 'linkedin.com',
    'medium.com', 'substack.com', 'patreon.com'
  ],

  // Government and official sources
  officialSources: [
    'gov', 'gov.uk', 'europa.eu', 'un.org',
    'who.int', 'cdc.gov', 'nih.gov', 'nasa.gov'
  ],

  // Educational institutions
  educational: [
    '.edu', 'ac.uk', 'mit.edu', 'stanford.edu',
    'harvard.edu', 'ox.ac.uk', 'cam.ac.uk'
  ]
};

// AI text patterns
const AI_TEXT_PATTERNS = {
  commonPhrases: [
    'as an ai', 'as a language model', 'i don\'t have personal',
    'i cannot', 'i\'m sorry, but', 'it\'s important to note',
    'in conclusion', 'furthermore', 'moreover', 'delve into',
    'it\'s worth noting', 'elevate', 'leverage', 'utilize',
    'comprehensive', 'robust', 'streamline', 'optimize',
    'synergy', 'paradigm', 'holistic', 'multifaceted'
  ],

  formalPatterns: [
    /it is important to (note|understand|recognize|remember)/gi,
    /one (must|should|can) (consider|note|understand)/gi,
    /in (order|addition) to/gi,
    /for (example|instance)/gi,
    /with (regard|respect) to/gi
  ],

  genericConclusions: [
    'in summary', 'to summarize', 'in conclusion',
    'ultimately', 'in essence', 'at the end of the day'
  ]
};

// Image metadata tags
const AI_IMAGE_TAGS = [
  'midjourney', 'dall-e', 'dalle', 'stable diffusion',
  'ai generated', 'artificial intelligence', 'neural network',
  'gpt', 'machine learning', 'synthetic', 'generated'
];

// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu items
  chrome.contextMenus.create({
    id: "analyzeText",
    title: "🔍 Check if AI-generated (Text)",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "analyzeImage",
    title: "🔍 Check if AI-generated (Image)",
    contexts: ["image"]
  });

  chrome.contextMenus.create({
    id: "analyzePage",
    title: "🔍 Check this page/site",
    contexts: ["page"]
  });

  chrome.contextMenus.create({
    id: "analyzeLink",
    title: "🔍 Check this link",
    contexts: ["link"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Ensure content script is injected
  await ensureContentScript(tab.id);
  
  if (info.menuItemId === "analyzeText") {
    analyzeText(tab.id, info.selectionText, info.pageUrl);
  } else if (info.menuItemId === "analyzeImage") {
    analyzeImage(tab.id, info.srcUrl, info.pageUrl);
  } else if (info.menuItemId === "analyzePage") {
    analyzePage(tab.id, info.pageUrl);
  } else if (info.menuItemId === "analyzeLink") {
    analyzeLink(tab.id, info.linkUrl);
  }
});

// Handle messages from popup (Quick Check)
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'analyzeUrl') {
    // Ensure content script is injected
    await ensureContentScript(message.tabId);
    // Analyze the URL as a page
    analyzePage(message.tabId, message.url);
  }
});

// Ensure content script is injected
async function ensureContentScript(tabId) {
  try {
    // Try to ping the content script
    await chrome.tabs.sendMessage(tabId, { action: "ping" });
  } catch (e) {
    // Content script not loaded, inject it manually
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
      
      await chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ['content.css']
      });
      
      // Give it a moment to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      console.error("Failed to inject content script:", err);
    }
  }
}

// Analyze text content
async function analyzeText(tabId, text, pageUrl) {
  showLoading(tabId, "text");

  try {
    // Check if Pro Mode is enabled
    const settings = await chrome.storage.local.get(['proModeEnabled', 'apiKey', 'aiModel']);
    
    if (settings.proModeEnabled && settings.apiKey) {
      // Use AI-powered detection
      const aiResult = await analyzeTextWithAI(text, pageUrl, settings);
      showResult(tabId, aiResult);
      return;
    }
    
    // Use free pattern-based detection
    const result = await analyzeTextFree(text, pageUrl);
    showResult(tabId, result);
  } catch (error) {
    console.error("Text analysis error:", error);
    showError(tabId, "text", error.message);
  }
}

// Free pattern-based text analysis
async function analyzeTextFree(text, pageUrl) {
  try {
    const result = {
      type: "text",
      score: 0,
      indicators: [],
      details: [],
      trustLevel: "unknown"
    };

    // Check source credibility
    const sourceCheck = checkSourceCredibility(pageUrl);
    result.sourceCredibility = sourceCheck;

    // Check for AI patterns
    let aiScore = 0;
    const patterns = AI_TEXT_PATTERNS;

    // Check common AI phrases
    let phraseCount = 0;
    patterns.commonPhrases.forEach(phrase => {
      if (text.toLowerCase().includes(phrase)) {
        phraseCount++;
        result.details.push(`Contains AI phrase: "${phrase}"`);
      }
    });

    if (phraseCount > 0) {
      aiScore += Math.min(phraseCount * 1.5, 4);
      result.indicators.push(`${phraseCount} common AI phrases detected`);
    }

    // Check formal patterns
    let formalCount = 0;
    patterns.formalPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        formalCount += matches.length;
      }
    });

    if (formalCount > 3) {
      aiScore += 2;
      result.indicators.push("Overly formal writing style");
    }

    // Check for excessive structure (lists, bullets)
    const hasNumberedList = /^\d+\.\s.+$/gm.test(text);
    const hasBullets = /^[-•*]\s.+$/gm.test(text);
    
    if ((hasNumberedList || hasBullets) && text.length < 500) {
      aiScore += 1;
      result.indicators.push("Structured format (common in AI responses)");
    }

    // Check length and repetition
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 5) {
      const avgLength = text.length / sentences.length;
      if (avgLength > 100) {
        aiScore += 1;
        result.indicators.push("Very long average sentence length");
      }
    }

    // Check for lack of personal voice
    const firstPerson = (text.match(/\b(I|I'm|I've|my|me)\b/gi) || []).length;
    const textLength = text.split(/\s+/).length;
    
    if (textLength > 50 && firstPerson === 0) {
      aiScore += 1.5;
      result.indicators.push("No personal pronouns (impersonal tone)");
    }

    // Adjust based on source credibility
    if (sourceCheck.isTrusted) {
      aiScore = Math.max(0, aiScore - 2);
      result.details.push("Source is from trusted news outlet");
    } else if (sourceCheck.isAIPlatform) {
      aiScore += 3;
      result.details.push("Source is known AI platform");
    }

    // Calculate final score (1-10)
    result.score = Math.min(Math.round(aiScore), 10);
    
    if (result.score === 0 && result.indicators.length === 0) {
      result.indicators.push("No obvious AI indicators detected");
      result.details.push("Text appears natural and conversational");
    }

    return result;
  } catch (error) {
    console.error("Text analysis error:", error);
    throw error;
  }
}

// AI-powered text analysis
async function analyzeTextWithAI(text, pageUrl, settings) {
  const result = {
    type: "text",
    score: 0,
    indicators: [],
    details: [],
    trustLevel: "unknown",
    isPro: true
  };

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": settings.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `Analyze this text and determine if it's AI-generated. Provide a score from 1-10 (1=definitely human, 10=definitely AI) and explain your reasoning.

Text: "${text}"

Respond with JSON only:
{
  "score": 1-10,
  "indicators": ["list of specific AI indicators found"],
  "reasoning": "brief explanation of your assessment"
}`
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.content[0].text.trim();
    const cleanResponse = aiResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanResponse);

    result.score = parsed.score || 5;
    result.indicators = parsed.indicators || [];
    result.details = [parsed.reasoning];
    result.details.unshift("🤖 AI-Powered Analysis (Pro Mode)");

    // Add source check
    const sourceCheck = checkSourceCredibility(pageUrl);
    result.sourceCredibility = sourceCheck;

    return result;
  } catch (error) {
    console.error("AI analysis error:", error);
    // Fall back to free analysis
    result.details.push("⚠️ AI analysis failed, using pattern matching");
    return analyzeTextFree(text, pageUrl);
  }
}

// Analyze image
async function analyzeImage(tabId, imageUrl, pageUrl) {
  showLoading(tabId, "image");

  try {
    // Check if Pro Mode is enabled
    const settings = await chrome.storage.local.get(['proModeEnabled', 'apiKey', 'aiModel']);
    
    if (settings.proModeEnabled && settings.apiKey) {
      // Use AI-powered detection
      const aiResult = await analyzeImageWithAI(imageUrl, pageUrl, settings);
      showResult(tabId, aiResult);
      return;
    }
    
    // Use free pattern-based detection
    const result = await analyzeImageFree(imageUrl, pageUrl);
    showResult(tabId, result);
  } catch (error) {
    console.error("Image analysis error:", error);
    showError(tabId, "image", error.message);
  }
}

// Free pattern-based image analysis
async function analyzeImageFree(imageUrl, pageUrl) {
  try {
    const result = {
      type: "image",
      score: 0,
      indicators: [],
      details: [],
      trustLevel: "unknown"
    };

    // Check source
    const sourceCheck = checkSourceCredibility(pageUrl);
    result.sourceCredibility = sourceCheck;

    let aiScore = 0;

    // Check if from known AI platform
    if (sourceCheck.isAIPlatform) {
      aiScore += 5;
      result.indicators.push("Image from known AI generation platform");
      result.details.push(`Source: ${sourceCheck.platform}`);
    }

    // Check URL for AI indicators
    const urlLower = imageUrl.toLowerCase();
    AI_IMAGE_TAGS.forEach(tag => {
      if (urlLower.includes(tag)) {
        aiScore += 2;
        result.indicators.push(`URL contains "${tag}"`);
      }
    });

    // Check domain patterns
    if (urlLower.includes('cdn') && (urlLower.includes('ai') || urlLower.includes('generated'))) {
      aiScore += 2;
      result.indicators.push("CDN URL suggests AI generation");
    }

    // Pattern-based heuristics
    result.details.push("💡 Look for these AI tells:");
    result.details.push("• Unusual or malformed hands/fingers");
    result.details.push("• Inconsistent lighting or shadows");
    result.details.push("• Weird text or gibberish in images");
    result.details.push("• Unnatural skin texture (too smooth)");
    result.details.push("• Impossible geometry or perspective");
    result.details.push("• Blurry or merged backgrounds");

    // Calculate final score
    result.score = Math.min(Math.round(aiScore), 10);

    if (result.score < 3) {
      result.details.push("⚠️ Note: Modern AI images are hard to detect. Check manually for the signs above.");
    }

    return result;
  } catch (error) {
    console.error("Image analysis error:", error);
    throw error;
  }
}

// AI-powered image analysis
async function analyzeImageWithAI(imageUrl, pageUrl, settings) {
  const result = {
    type: "image",
    score: 0,
    indicators: [],
    details: [],
    trustLevel: "unknown",
    isPro: true
  };

  try {
    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to fetch image");
    }

    const blob = await imageResponse.blob();
    const base64 = await blobToBase64(blob);
    const mediaType = blob.type || "image/jpeg";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": settings.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64
              }
            },
            {
              type: "text",
              text: `Analyze this image for AI-generation indicators. Look for: unusual hands/fingers, inconsistent lighting, unnatural textures, weird text, impossible geometry, overly smooth surfaces.

Provide a score from 1-10 (1=definitely real photo, 10=definitely AI) and list specific indicators.

Respond with JSON only:
{
  "score": 1-10,
  "indicators": ["list of specific AI indicators you see"],
  "reasoning": "brief explanation"
}`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.content[0].text.trim();
    const cleanResponse = aiResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanResponse);

    result.score = parsed.score || 5;
    result.indicators = parsed.indicators || [];
    result.details = [parsed.reasoning];
    result.details.unshift("🤖 AI-Powered Visual Analysis (Pro Mode)");

    // Add source check
    const sourceCheck = checkSourceCredibility(pageUrl);
    result.sourceCredibility = sourceCheck;

    return result;
  } catch (error) {
    console.error("AI image analysis error:", error);
    // Fall back to free analysis
    result.details.push("⚠️ AI analysis failed, using pattern matching");
    return analyzeImageFree(imageUrl, pageUrl);
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Analyze page/site
async function analyzePage(tabId, pageUrl) {
  showLoading(tabId, "page");

  try {
    const result = {
      type: "page",
      score: 0,
      indicators: [],
      details: [],
      trustLevel: "unknown"
    };

    const sourceCheck = checkSourceCredibility(pageUrl);
    result.sourceCredibility = sourceCheck;

    let aiScore = 5; // Start neutral

    // Trusted source
    if (sourceCheck.isTrusted) {
      aiScore = 2;
      result.indicators.push("✅ Trusted news source");
      result.details.push("This is a reputable news organization with editorial standards");
    }

    // Government/official
    if (sourceCheck.isOfficial) {
      aiScore = 1;
      result.indicators.push("✅ Official government/institutional source");
      result.details.push("Government and official sources are unlikely to use AI-generated content");
    }

    // Educational
    if (sourceCheck.isEducational) {
      aiScore = 2;
      result.indicators.push("✅ Educational institution");
      result.details.push("Academic sources maintain quality standards");
    }

    // AI platform
    if (sourceCheck.isAIPlatform) {
      aiScore = 9;
      result.indicators.push("⚠️ Known AI content platform");
      result.details.push(`This is ${sourceCheck.platform} - content is AI-generated`);
    }

    // Content farm
    if (sourceCheck.isContentFarm) {
      aiScore = 7;
      result.indicators.push("⚠️ Low-quality content site");
      result.details.push("This site is known for mass-produced content");
    }

    // Unknown source
    if (!sourceCheck.isTrusted && !sourceCheck.isOfficial && !sourceCheck.isEducational && !sourceCheck.isAIPlatform) {
      aiScore = 5;
      result.indicators.push("⚠️ Unknown or unverified source");
      result.details.push("Cannot verify the credibility of this source");
      result.details.push("💡 Be cautious and cross-check with trusted sources");
    }

    result.score = Math.min(Math.round(aiScore), 10);

    showResult(tabId, result);
  } catch (error) {
    console.error("Page analysis error:", error);
    showError(tabId, "page", error.message);
  }
}

// Analyze link
async function analyzeLink(tabId, linkUrl) {
  analyzePage(tabId, linkUrl);
}

// Check source credibility
function checkSourceCredibility(url) {
  const result = {
    isTrusted: false,
    isOfficial: false,
    isEducational: false,
    isAIPlatform: false,
    isContentFarm: false,
    isVerified: false,
    platform: null
  };

  if (!url) return result;

  const urlLower = url.toLowerCase();
  const domain = extractDomain(url);

  // Check trusted news
  if (SITE_DATABASE.trustedNews.some(site => domain.includes(site))) {
    result.isTrusted = true;
  }

  // Check official sources
  if (SITE_DATABASE.officialSources.some(ext => domain.endsWith(ext) || domain.includes(ext))) {
    result.isOfficial = true;
  }

  // Check educational
  if (SITE_DATABASE.educational.some(ext => domain.endsWith(ext) || domain.includes(ext))) {
    result.isEducational = true;
  }

  // Check AI platforms
  const aiPlatform = [...SITE_DATABASE.aiImagePlatforms, ...SITE_DATABASE.aiTextPlatforms, ...SITE_DATABASE.aiVideoPlatforms]
    .find(site => domain.includes(site));
  
  if (aiPlatform) {
    result.isAIPlatform = true;
    result.platform = aiPlatform;
  }

  // Check content farms
  if (SITE_DATABASE.contentFarms.some(site => domain.includes(site))) {
    result.isContentFarm = true;
  }

  // Check verified platforms
  if (SITE_DATABASE.verifiedPlatforms.some(site => domain.includes(site))) {
    result.isVerified = true;
  }

  return result;
}

// Extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch (e) {
    return url.toLowerCase();
  }
}

// Show loading state
function showLoading(tabId, type) {
  ensureContentScript(tabId).then(() => {
    chrome.tabs.sendMessage(tabId, {
      action: "showAnalysis",
      type: type,
      status: "loading"
    }).catch(() => {
      console.log("Content script not ready");
    });
  });
}

// Show result
function showResult(tabId, result) {
  ensureContentScript(tabId).then(() => {
    chrome.tabs.sendMessage(tabId, {
      action: "showAnalysis",
      status: "success",
      result: result
    }).catch((err) => {
      console.log("Could not send result to page:", err);
      // Fallback: try to inject and send again
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, {
          action: "showAnalysis",
          status: "success",
          result: result
        }).catch(() => console.log("Retry failed"));
      }, 500);
    });
  });
}

// Show error
function showError(tabId, type, message) {
  ensureContentScript(tabId).then(() => {
    chrome.tabs.sendMessage(tabId, {
      action: "showAnalysis",
      type: type,
      status: "error",
      message: message
    }).catch(() => {
      console.log("Could not send error to page");
    });
  });
}

// Ensure content script is injected
async function ensureContentScript(tabId) {
  try {
    // Try to ping the content script
    const response = await chrome.tabs.sendMessage(tabId, { action: "ping" });
    if (response && response.status === "ready") {
      return true; // Content script is ready
    }
  } catch (e) {
    console.log("Content script not present, injecting...");
  }
  
  // Content script not loaded, inject it manually
  try {
    // First inject CSS
    await chrome.scripting.insertCSS({
      target: { tabId: tabId },
      files: ['content.css']
    });
    
    // Then inject JS
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
    
    // Wait for it to initialize
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return true;
  } catch (err) {
    console.error("Could not inject content script:", err);
    return false;
  }
}
