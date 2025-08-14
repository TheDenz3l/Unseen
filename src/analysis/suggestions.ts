import { AnalysisFeatures } from './features';

export interface Suggestion {
  id: string;
  tone: string;
  text: string;
}

// Generate message rewrite suggestions
export function generateSuggestions(originalText: string, features: AnalysisFeatures): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  // Short & Playful variant
  suggestions.push({
    id: 'short_playful',
    tone: 'Short & Playful',
    text: generateShortPlayful(originalText, features),
  });

  // Direct & Concise variant
  suggestions.push({
    id: 'direct_concise', 
    tone: 'Direct & Concise',
    text: generateDirectConcise(originalText, features),
  });

  // Warm & Curious variant
  suggestions.push({
    id: 'warm_curious',
    tone: 'Warm & Curious', 
    text: generateWarmCurious(originalText, features),
  });

  return suggestions;
}

function generateShortPlayful(text: string, features: AnalysisFeatures): string {
  // Make it shorter and add some playfulness
  let result = text.trim();
  
  // If it's a question, make it more casual
  if (features.isQuestion && text.includes('?')) {
    result = result.replace(/\?+/g, '?');
    
    // Add casual alternatives for common question patterns
    result = result.replace(/How are you\?/i, "How's it going?");
    result = result.replace(/What are you doing\?/i, "What's up?");
    result = result.replace(/Did you/i, "You");
  }
  
  // Limit length to ~50 characters for "short" 
  if (result.length > 50) {
    // Find a good breaking point
    const words = result.split(' ');
    let shortened = '';
    for (const word of words) {
      if ((shortened + word).length > 47) break;
      shortened += (shortened ? ' ' : '') + word;
    }
    result = shortened + (result.endsWith('?') ? '?' : '');
  }

  // Add a subtle emoji if none present and sentiment is positive
  if (features.sentiment > 0 && !/[😊😍❤️🙂😄]/.test(result)) {
    result += ' 😊';
  }

  return result;
}

function generateDirectConcise(text: string, features: AnalysisFeatures): string {
  let result = text.trim();
  
  // Remove filler words and make more direct
  result = result.replace(/\b(just|really|actually|basically|literally)\b/gi, '');
  result = result.replace(/\s+/g, ' ').trim();
  
  // Convert questions to statements when appropriate
  if (features.doubleQuestion) {
    // If multiple questions, pick the most important one
    const sentences = result.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length > 1) {
      result = sentences[0].trim() + '?';
    }
  }
  
  // Remove excessive punctuation
  result = result.replace(/[.]{2,}/g, '.');
  result = result.replace(/[!]{2,}/g, '!');
  result = result.replace(/[?]{2,}/g, '?');
  
  return result;
}

function generateWarmCurious(text: string, features: AnalysisFeatures): string {
  let result = text.trim();
  
  // Add warm framing if message seems cold
  if (features.sentiment < 0) {
    // Soften harsh language
    result = result.replace(/\bno\b/gi, "I don't think so, but");
    result = result.replace(/\bcan't\b/gi, "won't be able to");
  }
  
  // Add curious elements to questions
  if (features.isQuestion) {
    // Make questions more engaging
    if (result.toLowerCase().startsWith('are you')) {
      result = 'I was wondering - ' + result.toLowerCase();
    } else if (result.toLowerCase().startsWith('did you')) {
      result = 'Curious - ' + result.toLowerCase();
    }
  }
  
  // Add warm opening for longer messages
  if (result.length > 100 && !result.match(/^(hey|hi|hope)/i)) {
    const warmOpenings = ['Hope you\'re doing well! ', 'Hey! ', 'Quick question - '];
    const opener = warmOpenings[Math.floor(Math.random() * warmOpenings.length)];
    result = opener + result.charAt(0).toLowerCase() + result.slice(1);
  }
  
  return result;
}
