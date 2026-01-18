// Database of known sites, platforms, and indicators
const SITE_DATABASE = {
  // Trusted news sources (likely human-created, editorial standards)
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

  // Content farms and low-quality sites (higher risk)
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

// AI text patterns and indicators
const AI_TEXT_PATTERNS = {
  // Common AI phrases (red flags)
  commonPhrases: [
    'as an ai', 'as a language model', 'i don\'t have personal',
    'i cannot', 'i\'m sorry, but', 'it\'s important to note',
    'in conclusion', 'furthermore', 'moreover', 'delve into',
    'it\'s worth noting', 'elevate', 'leverage', 'utilize',
    'comprehensive', 'robust', 'streamline', 'optimize',
    'synergy', 'paradigm', 'holistic', 'multifaceted'
  ],

  // Overly formal patterns
  formalPatterns: [
    /it is important to (note|understand|recognize|remember)/gi,
    /one (must|should|can) (consider|note|understand)/gi,
    /in (order|addition) to/gi,
    /for (example|instance)/gi,
    /with (regard|respect) to/gi
  ],

  // Generic conclusions
  genericConclusions: [
    'in summary', 'to summarize', 'in conclusion',
    'ultimately', 'in essence', 'at the end of the day'
  ],

  // Repetitive structure indicators
  listMarkers: [
    /^\d+\.\s/gm,  // Numbered lists
    /^[-•*]\s/gm   // Bullet points
  ]
};

// Image metadata tags that indicate AI generation
const AI_IMAGE_TAGS = [
  'midjourney', 'dall-e', 'dalle', 'stable diffusion',
  'ai generated', 'artificial intelligence', 'neural network',
  'gpt', 'machine learning', 'synthetic', 'generated'
];

// Video indicators
const AI_VIDEO_INDICATORS = {
  suspiciousChannels: [
    'ai generated', 'synthetic', 'deepfake', 'face swap'
  ],
  keywords: [
    'this video was created using ai',
    'ai generated video',
    'synthetic media',
    'deepfake',
    'not real footage'
  ]
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SITE_DATABASE,
    AI_TEXT_PATTERNS,
    AI_IMAGE_TAGS,
    AI_VIDEO_INDICATORS
  };
}
