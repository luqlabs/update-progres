// Validation utilities for AI-generated content

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEducationalIntent(prompt: string): ValidationResult {
  const lowerPrompt = prompt.toLowerCase().trim();
  
  // Check if prompt is too short
  if (lowerPrompt.length < 3) {
    return {
      valid: false,
      errors: ["Please provide a more detailed description of what you want to create."],
      warnings: []
    };
  }
  
  // Educational keywords
  const educationalKeywords = [
    'quiz', 'question', 'test', 'exam', 'flashcard', 'study', 'learn', 'teach',
    'matching', 'game', 'practice', 'exercise', 'review', 'science', 'math',
    'history', 'geography', 'language', 'vocabulary', 'grammar', 'reading',
    'writing', 'chemistry', 'physics', 'biology', 'literature', 'algebra',
    'geometry', 'spelling', 'multiplication', 'division', 'fraction', 'create',
    'make', 'generate', 'add', 'update', 'change', 'modify', 'difficulty',
    'easy', 'medium', 'hard', 'theme', 'indigo', 'emerald', 'slate', 'blue', 'amber', 'sky'
  ];
  
  // Irrelevant/spam patterns
  const spamPatterns = [
    /^[a-z]{1,3}$/i, // Very short random text like "apa", "test"
    /^[\d\s]+$/, // Only numbers
    /^[^\w\s]+$/, // Only special characters
  ];
  
  // Check for spam
  for (const pattern of spamPatterns) {
    if (pattern.test(lowerPrompt)) {
      return {
        valid: false,
        errors: ["Please describe what activity you'd like to create."],
        warnings: []
      };
    }
  }
  
  // Check for educational context
  const hasEducationalContext = educationalKeywords.some(keyword => 
    lowerPrompt.includes(keyword)
  );
  
  if (!hasEducationalContext && lowerPrompt.split(' ').length < 4) {
    return {
      valid: false,
      errors: ["I couldn't understand your request. Please describe what type of activity you want to create (quiz, flashcards, or matching game)."],
      warnings: []
    };
  }
  
  return {
    valid: true,
    errors: [],
    warnings: []
  };
}

export function classifyIntent(prompt: string): {
  action: 'create' | 'modify' | 'clarify';
  appType?: 'quiz' | 'flashcards' | 'matching';
  confidence: number;
} {
  const lowerPrompt = prompt.toLowerCase();
  
  // Detect action
  let action: 'create' | 'modify' | 'clarify' = 'clarify';
  
  if (/\b(create|make|generate|new|build)\b/.test(lowerPrompt)) {
    action = 'create';
  } else if (/\b(change|modify|update|edit|add|remove|delete|adjust)\b/.test(lowerPrompt)) {
    action = 'modify';
  }
  
  // Detect app type
  let appType: 'quiz' | 'flashcards' | 'matching' | undefined;
  let confidence = 0.5;
  
  if (/\b(quiz|question|test|exam)\b/.test(lowerPrompt)) {
    appType = 'quiz';
    confidence = 0.9;
  } else if (/\b(flashcards?|flash ?cards?|study cards?)\b/.test(lowerPrompt)) {
    appType = 'flashcards';
    confidence = 0.9;
  } else if (/\b(match|matching|pair)\b/.test(lowerPrompt)) {
    appType = 'matching';
    confidence = 0.9;
  }
  
  return { action, appType, confidence };
}

export function validateGeneratedConfig(config: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic structure validation
  if (!config.type || !['quiz', 'flashcards', 'matching'].includes(config.type)) {
    errors.push("Invalid app type");
  }
  
  if (!config.title || config.title.length < 3) {
    errors.push("Title is too short");
  }
  
  // Quiz validation
  if (config.type === 'quiz') {
    if (!Array.isArray(config.questions) || config.questions.length === 0) {
      errors.push("Quiz must have at least one question");
    } else {
      config.questions.forEach((q: any, idx: number) => {
        if (!q.q || q.q.length < 5) {
          errors.push(`Question ${idx + 1} text is too short`);
        }
        
        if (!Array.isArray(q.options) || q.options.length < 2) {
          errors.push(`Question ${idx + 1} must have at least 2 options`);
        }
        
        if (!q.answer) {
          errors.push(`Question ${idx + 1} is missing the correct answer`);
        } else if (q.questionType !== 'short-answer' && q.questionType !== 'fill-blank' && 
                   !q.options.includes(q.answer)) {
          errors.push(`Question ${idx + 1} answer doesn't match any option`);
        }
        
        // Check for duplicate options
        const uniqueOptions = new Set(q.options);
        if (uniqueOptions.size !== q.options.length) {
          warnings.push(`Question ${idx + 1} has duplicate options`);
        }
      });
    }
  }
  
  // Flashcards validation
  if (config.type === 'flashcards') {
    if (!Array.isArray(config.cards) || config.cards.length === 0) {
      errors.push("Flashcard set must have at least one card");
    } else {
      config.cards.forEach((card: any, idx: number) => {
        if (!card.front || card.front.length < 2) {
          errors.push(`Card ${idx + 1} front is too short`);
        }
        if (!card.back || card.back.length < 2) {
          errors.push(`Card ${idx + 1} back is too short`);
        }
      });
    }
  }
  
  // Matching game validation
  if (config.type === 'matching') {
    if (!Array.isArray(config.pairs) || config.pairs.length < 4) {
      errors.push("Matching game must have at least 4 pairs");
    } else if (config.pairs.length > 12) {
      warnings.push("Matching game has more than 12 pairs, which may be overwhelming");
    } else {
      config.pairs.forEach((pair: any, idx: number) => {
        if (!pair.prompt || pair.prompt.length < 2) {
          errors.push(`Pair ${idx + 1} prompt is too short`);
        }
        if (!pair.answer || pair.answer.length < 2) {
          errors.push(`Pair ${idx + 1} answer is too short`);
        }
      });
    }
  }
  
  // Theme validation
  if (config.theme && !['indigo', 'emerald', 'slate', 'blue', 'amber', 'sky'].includes(config.theme)) {
    warnings.push(`Unusual theme: ${config.theme}. Using 'indigo' instead.`);
    config.theme = 'indigo';
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function isDestructiveChange(prompt: string, currentConfig: any): boolean {
  if (!currentConfig) return false;
  
  const lowerPrompt = prompt.toLowerCase();
  
  // Detect destructive keywords and replacement patterns
  const destructiveKeywords = [
    'delete', 'remove', 'clear', 'reset', 'start over', 'new', 'replace all',
    'change type', 'different type', 'replace', 'scrap', 'change everything'
  ];
  
  const replacementPatterns = [
    /\breplace\s+(the|this|everything|all|with|it)\b/,
    /\bstart\s+over\b/,
    /\bchange\s+(the|everything|it)\s+(completely|to)\b/,
    /\bdelete\s+(everything|all)\s+and\b/,
    /\bscrap\s+(this|it|everything)\b/
  ];
  
  const hasDestructiveKeyword = destructiveKeywords.some(keyword => lowerPrompt.includes(keyword));
  const hasReplacementPattern = replacementPatterns.some(pattern => pattern.test(lowerPrompt));
  
  return hasDestructiveKeyword || hasReplacementPattern;
}
