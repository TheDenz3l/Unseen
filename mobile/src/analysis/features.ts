// Analysis types
export interface Message {
  author: 'you' | 'them';
  text: string;
  timestamp: number;
}

export interface Conversation {
  messages: Message[];
  draft?: string;
}

export interface AnalysisFeatures {
  minsSinceLastMsg: number;
  isQuestion: number; // 0/1
  msgLen: number;
  chaseCount: number; // consecutive messages from you
  hourOfDayBias: number; // -1 to 1 based on historical best times
  weekdayBias: number; // -1 to 1
  sentiment: number; // -1 to 1
  whoSpokeLast: number; // 1 if them, 0 if you
  prevLatencyAvg: number; // avg minutes to reply historically
  doubleQuestion: number; // 0/1
}

export interface AnalysisResult {
  prob: number; // 0-1
  bucket: 'Likely' | 'Uncertain' | 'Unlikely';
  recommendation: 'send' | 'wait';
  waitMinutes?: number;
  reasons: string[];
  featuresHash: string;
  suggestions?: string[]; // Optional suggestions
  id?: string; // Optional ID when stored
}

// Feature extraction
export function extractFeatures(conversation: Conversation, draft?: string): AnalysisFeatures {
  const { messages } = conversation;
  const now = Date.now();
  
  if (messages.length === 0) {
    return getDefaultFeatures();
  }

  const lastMsg = messages[messages.length - 1];
  const minsSinceLastMsg = Math.floor((now - lastMsg.timestamp) / (1000 * 60));
  
  // Text to analyze (draft if provided, otherwise last message)
  const textToAnalyze = draft || lastMsg.text;
  const msgLen = textToAnalyze.length;
  
  // Question detection (simple heuristics)
  const isQuestion = /\?/.test(textToAnalyze) ? 1 : 0;
  
  // Chase count (consecutive messages from 'you')
  let chaseCount = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].author === 'you') {
      chaseCount++;
    } else {
      break;
    }
  }
  
  // Time-based biases (simplified - would use historical data in real implementation)
  const hour = new Date(now).getHours();
  const hourOfDayBias = getHourBias(hour);
  
  const weekday = new Date(now).getDay();
  const weekdayBias = getWeekdayBias(weekday);
  
  // Sentiment analysis (very basic)
  const sentiment = calculateSentiment(textToAnalyze);
  
  // Who spoke last
  const whoSpokeLast = lastMsg.author === 'them' ? 1 : 0;
  
  // Historical latency (placeholder - would come from contact stats)
  const prevLatencyAvg = 180; // 3 hours default
  
  // Double question detection
  const doubleQuestion = (textToAnalyze.match(/\?/g) || []).length >= 2 ? 1 : 0;

  return {
    minsSinceLastMsg,
    isQuestion,
    msgLen,
    chaseCount,
    hourOfDayBias,
    weekdayBias,
    sentiment,
    whoSpokeLast,
    prevLatencyAvg,
    doubleQuestion,
  };
}

function getDefaultFeatures(): AnalysisFeatures {
  return {
    minsSinceLastMsg: 0,
    isQuestion: 0,
    msgLen: 0,
    chaseCount: 1,
    hourOfDayBias: 0,
    weekdayBias: 0,
    sentiment: 0,
    whoSpokeLast: 0,
    prevLatencyAvg: 180,
    doubleQuestion: 0,
  };
}

function getHourBias(hour: number): number {
  // Evening hours (7-10 PM) are generally better for texting
  if (hour >= 19 && hour <= 22) return 0.5;
  // Late night/early morning is worse
  if (hour >= 23 || hour <= 6) return -0.5;
  // Work hours are neutral to negative
  if (hour >= 9 && hour <= 17) return -0.2;
  return 0;
}

function getWeekdayBias(weekday: number): number {
  // Weekend is generally better for casual texting
  if (weekday === 0 || weekday === 6) return 0.3;
  // Friday is good
  if (weekday === 5) return 0.2;
  // Monday is slightly worse
  if (weekday === 1) return -0.1;
  return 0;
}

function calculateSentiment(text: string): number {
  // Very basic sentiment scoring
  const positive = ['great', 'good', 'awesome', 'love', 'happy', '😊', '❤️', '😍', '!'].length;
  const negative = ['bad', 'terrible', 'hate', 'sad', 'angry', '😢', '😡', '...'].length;
  
  let score = 0;
  positive && (score += 0.2);
  negative && (score -= 0.2);
  
  // Exclamation marks add positivity
  const exclamations = (text.match(/!/g) || []).length;
  score += Math.min(exclamations * 0.1, 0.3);
  
  // Ellipses add negativity/uncertainty
  if (text.includes('...')) score -= 0.3;
  
  return Math.max(-1, Math.min(1, score));
}

export function generateFeaturesHash(features: AnalysisFeatures): string {
  // Create a simple hash of the features for deduplication
  const featureString = [
    features.minsSinceLastMsg,
    features.isQuestion,
    features.msgLen,
    features.chaseCount,
    features.hourOfDayBias,
    features.weekdayBias,
    features.sentiment,
    features.whoSpokeLast,
    features.prevLatencyAvg,
    features.doubleQuestion
  ].join('|');
  
  // Simple hash function (good enough for deduplication)
  let hash = 0;
  for (let i = 0; i < featureString.length; i++) {
    const char = featureString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
