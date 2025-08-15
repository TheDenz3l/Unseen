import { AnalysisFeatures } from './features';

interface ModelCoefficients {
  [key: string]: number;
}

// Generate explanations for the analysis result
export function generateReasons(features: AnalysisFeatures, coefficients: ModelCoefficients): string[] {
  const contributions: Array<{ feature: string; contribution: number; reason: string }> = [];

  // Calculate contribution of each feature (coefficient * value)
  if (Math.abs(coefficients.chaseCount * features.chaseCount) > 0.1) {
    const contribution = coefficients.chaseCount * features.chaseCount;
    if (contribution < 0) {
      contributions.push({
        feature: 'chaseCount',
        contribution,
        reason: `You've sent ${features.chaseCount} message${features.chaseCount > 1 ? 's' : ''} in a row`
      });
    }
  }

  if (Math.abs(coefficients.minsSinceLastMsg * features.minsSinceLastMsg) > 0.1) {
    const hours = Math.floor(features.minsSinceLastMsg / 60);
    const minutes = features.minsSinceLastMsg % 60;
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    
    contributions.push({
      feature: 'minsSinceLastMsg',
      contribution: coefficients.minsSinceLastMsg * features.minsSinceLastMsg,
      reason: `${timeStr} since last message`
    });
  }

  if (Math.abs(coefficients.hourOfDayBias * features.hourOfDayBias) > 0.1) {
    const contribution = coefficients.hourOfDayBias * features.hourOfDayBias;
    if (contribution > 0) {
      contributions.push({
        feature: 'hourOfDayBias',
        contribution,
        reason: 'Good timing - evening hours work better'
      });
    } else {
      contributions.push({
        feature: 'hourOfDayBias', 
        contribution,
        reason: 'Timing could be better - try evening hours'
      });
    }
  }

  if (Math.abs(coefficients.whoSpokeLast * features.whoSpokeLast) > 0.1) {
    const contribution = coefficients.whoSpokeLast * features.whoSpokeLast;
    if (features.whoSpokeLast === 1) {
      contributions.push({
        feature: 'whoSpokeLast',
        contribution,
        reason: 'They messaged last - good sign'
      });
    } else {
      contributions.push({
        feature: 'whoSpokeLast',
        contribution,
        reason: 'You messaged last - might want to wait'
      });
    }
  }

  if (Math.abs(coefficients.isQuestion * features.isQuestion) > 0.1 && features.isQuestion === 1) {
    contributions.push({
      feature: 'isQuestion',
      contribution: coefficients.isQuestion * features.isQuestion,
      reason: 'Contains a direct question'
    });
  }

  if (Math.abs(coefficients.doubleQuestion * features.doubleQuestion) > 0.1 && features.doubleQuestion === 1) {
    contributions.push({
      feature: 'doubleQuestion', 
      contribution: coefficients.doubleQuestion * features.doubleQuestion,
      reason: 'Multiple questions can seem overwhelming'
    });
  }

  if (Math.abs(coefficients.msgLen * features.msgLen) > 0.1) {
    const contribution = coefficients.msgLen * features.msgLen;
    if (features.msgLen > 200 && contribution < 0) {
      contributions.push({
        feature: 'msgLen',
        contribution,
        reason: 'Message is quite long - shorter might work better'
      });
    }
  }

  if (Math.abs(coefficients.sentiment * features.sentiment) > 0.1) {
    const contribution = coefficients.sentiment * features.sentiment;
    if (contribution > 0) {
      contributions.push({
        feature: 'sentiment',
        contribution,
        reason: 'Positive tone helps with engagement'
      });
    } else {
      contributions.push({
        feature: 'sentiment',
        contribution, 
        reason: 'Tone seems neutral or negative'
      });
    }
  }

  // Sort by absolute contribution and take top 3
  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  
  return contributions.slice(0, 3).map(c => c.reason);
}
