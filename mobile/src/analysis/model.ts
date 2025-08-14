import { AnalysisFeatures, AnalysisResult } from './features';
import { generateReasons } from './reasons';

// Logistic regression coefficients (from PRD - would be tuned on real data)
const MODEL_COEFFICIENTS = {
  b0: -0.5,              // intercept
  minsSinceLastMsg: 0.002,   // positive: more time = better
  isQuestion: -0.3,          // negative: questions can seem needy
  msgLen: -0.005,            // negative: longer messages = worse
  chaseCount: -0.8,          // negative: chasing = bad
  hourOfDayBias: 0.7,        // positive: good hours help
  weekdayBias: 0.4,          // positive: good days help
  sentiment: 0.5,            // positive: positive sentiment helps
  whoSpokeLast: 0.6,         // positive: if they spoke last, better chance
  prevLatencyAvg: 0.001,     // positive: if they usually take long, wait
  doubleQuestion: -0.5,      // negative: double questions are bad
};

export function runAnalysis(features: AnalysisFeatures): AnalysisResult {
  // Calculate logistic regression score
  const z = MODEL_COEFFICIENTS.b0 +
    MODEL_COEFFICIENTS.minsSinceLastMsg * features.minsSinceLastMsg +
    MODEL_COEFFICIENTS.isQuestion * features.isQuestion +
    MODEL_COEFFICIENTS.msgLen * features.msgLen +
    MODEL_COEFFICIENTS.chaseCount * features.chaseCount +
    MODEL_COEFFICIENTS.hourOfDayBias * features.hourOfDayBias +
    MODEL_COEFFICIENTS.weekdayBias * features.weekdayBias +
    MODEL_COEFFICIENTS.sentiment * features.sentiment +
    MODEL_COEFFICIENTS.whoSpokeLast * features.whoSpokeLast +
    MODEL_COEFFICIENTS.prevLatencyAvg * Math.min(features.prevLatencyAvg, 1440) / 1440 + // normalize to days
    MODEL_COEFFICIENTS.doubleQuestion * features.doubleQuestion;

  // Convert to probability using logistic function
  const rawProb = 1 / (1 + Math.exp(-z));
  
  // Clamp probability to reasonable bounds (PRD requirement)
  const prob = Math.max(0.05, Math.min(0.95, rawProb));

  // Bucket the probability (from PRD)
  const bucket = prob > 0.67 ? 'Likely' : prob < 0.33 ? 'Unlikely' : 'Uncertain';

  // Generate recommendation
  const { recommendation, waitMinutes } = generateRecommendation(prob, features);

  // Generate reasons based on feature contributions
  const reasons = generateReasons(features, MODEL_COEFFICIENTS);

  // Create features hash for caching/deduplication
  const featuresHash = createFeaturesHash(features);

  return {
    prob,
    bucket,
    recommendation,
    waitMinutes,
    reasons,
    featuresHash,
  };
}

function generateRecommendation(prob: number, features: AnalysisFeatures): {
  recommendation: 'send' | 'wait';
  waitMinutes?: number;
} {
  // If probability is high, send now
  if (prob > 0.6) {
    return { recommendation: 'send' };
  }

  // If probability is very low and they spoke last recently, wait longer
  if (prob < 0.4 && features.whoSpokeLast === 1 && features.minsSinceLastMsg < 60) {
    return { 
      recommendation: 'wait', 
      waitMinutes: 240 // 4 hours 
    };
  }

  // If it's bad timing (late night, etc.), suggest waiting for better time
  if (features.hourOfDayBias < -0.2) {
    const now = new Date();
    const targetHour = 19; // 7 PM
    const currentHour = now.getHours();
    
    let hoursToWait;
    if (currentHour < targetHour) {
      hoursToWait = targetHour - currentHour;
    } else {
      hoursToWait = (24 - currentHour) + targetHour; // next day
    }
    
    return {
      recommendation: 'wait',
      waitMinutes: hoursToWait * 60,
    };
  }

  // Default: wait a moderate amount
  return {
    recommendation: 'wait',
    waitMinutes: 120, // 2 hours
  };
}

function createFeaturesHash(features: AnalysisFeatures): string {
  // Simple hash of feature values for caching
  const str = Object.values(features).map(v => v.toFixed(3)).join('|');
  return btoa(str).slice(0, 16);
}

export { MODEL_COEFFICIENTS };
