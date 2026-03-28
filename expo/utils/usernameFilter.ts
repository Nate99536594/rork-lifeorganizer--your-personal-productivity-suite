// Username Language Filter Utility

interface BannedWord {
  word: string;
  severity: 'high' | 'medium' | 'low';
}

// Basic banned words list - in a real app, this would be loaded from a server/database
const BANNED_WORDS: BannedWord[] = [
  // High severity - explicit offensive terms
  { word: 'fuck', severity: 'high' },
  { word: 'shit', severity: 'high' },
  { word: 'bitch', severity: 'high' },
  { word: 'asshole', severity: 'high' },
  { word: 'damn', severity: 'medium' },
  { word: 'crap', severity: 'low' },
  { word: 'nazi', severity: 'high' },
  { word: 'hitler', severity: 'high' },
  { word: 'kill', severity: 'high' },
  { word: 'die', severity: 'medium' },
  { word: 'hate', severity: 'medium' },
  { word: 'stupid', severity: 'low' },
  { word: 'idiot', severity: 'low' },
  { word: 'retard', severity: 'high' },
  { word: 'gay', severity: 'medium' }, // Context dependent
  { word: 'fag', severity: 'high' },
  { word: 'nigger', severity: 'high' },
  { word: 'nigga', severity: 'high' },
  { word: 'whore', severity: 'high' },
  { word: 'slut', severity: 'high' },
  { word: 'porn', severity: 'medium' },
  { word: 'sex', severity: 'medium' },
  { word: 'rape', severity: 'high' },
  { word: 'murder', severity: 'high' },
  { word: 'terrorist', severity: 'high' },
  { word: 'bomb', severity: 'high' },
  { word: 'drug', severity: 'medium' },
  { word: 'cocaine', severity: 'high' },
  { word: 'heroin', severity: 'high' },
  { word: 'meth', severity: 'high' },
];

// Character substitution mapping
const CHARACTER_SUBSTITUTIONS: Record<string, string> = {
  '@': 'a',
  '4': 'a',
  '3': 'e',
  '1': 'i',
  '!': 'i',
  '0': 'o',
  '$': 's',
  '+': 't',
  '7': 't',
  '5': 's',
  '8': 'b',
  '6': 'g',
  '9': 'g',
  '*': '',
  '#': '',
  '%': '',
  '&': '',
  '^': '',
  '(': '',
  ')': '',
  '-': '',
  '_': '',
  '=': '',
  '[': '',
  ']': '',
  '{': '',
  '}': '',
  '|': '',
  '\\': '',
  ':': '',
  ';': '',
  '"': '',
  "'": '',
  '<': '',
  '>': '',
  ',': '',
  '.': '',
  '?': '',
  '/': '',
  '~': '',
  '`': '',
};

/**
 * Normalizes a username by converting to lowercase and removing/substituting characters
 */
function normalizeUsername(username: string): string {
  let normalized = username.toLowerCase().trim();
  
  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, '');
  
  // Apply character substitutions
  for (const [char, replacement] of Object.entries(CHARACTER_SUBSTITUTIONS)) {
    normalized = normalized.replace(new RegExp(`\\${char}`, 'g'), replacement);
  }
  
  return normalized;
}

/**
 * Calculates Levenshtein distance between two strings for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Checks if a word is similar to a banned word using fuzzy matching
 */
function isFuzzyMatch(word: string, bannedWord: string, threshold: number = 2): boolean {
  if (word.length < 3 || bannedWord.length < 3) {
    return word === bannedWord;
  }
  
  const distance = levenshteinDistance(word, bannedWord);
  const maxLength = Math.max(word.length, bannedWord.length);
  
  // Allow up to threshold character differences, but not more than 50% of the word
  return distance <= threshold && distance <= maxLength * 0.5;
}

/**
 * Checks if a username contains banned content
 */
function containsBannedContent(normalizedUsername: string): { 
  isBanned: boolean; 
  matchedWords: string[]; 
  severity: 'high' | 'medium' | 'low' | null;
} {
  const matchedWords: string[] = [];
  let highestSeverity: 'high' | 'medium' | 'low' | null = null;
  
  for (const bannedItem of BANNED_WORDS) {
    const bannedWord = bannedItem.word;
    
    // Exact substring match
    if (normalizedUsername.includes(bannedWord)) {
      matchedWords.push(bannedWord);
      if (!highestSeverity || 
          (bannedItem.severity === 'high') ||
          (bannedItem.severity === 'medium' && highestSeverity === 'low')) {
        highestSeverity = bannedItem.severity;
      }
      continue;
    }
    
    // Fuzzy matching for words longer than 3 characters
    if (bannedWord.length >= 3) {
      // Check if the banned word appears as a fuzzy match in the username
      for (let i = 0; i <= normalizedUsername.length - bannedWord.length + 2; i++) {
        const substring = normalizedUsername.substring(i, i + bannedWord.length + 2);
        if (isFuzzyMatch(substring, bannedWord)) {
          matchedWords.push(bannedWord);
          if (!highestSeverity || 
              (bannedItem.severity === 'high') ||
              (bannedItem.severity === 'medium' && highestSeverity === 'low')) {
            highestSeverity = bannedItem.severity;
          }
          break;
        }
      }
    }
  }
  
  return {
    isBanned: matchedWords.length > 0,
    matchedWords,
    severity: highestSeverity
  };
}

/**
 * Main username filter function
 */
export function validateUsername(username: string, skipLanguageFilter: boolean = false): {
  isValid: boolean;
  error?: string;
  severity?: 'high' | 'medium' | 'low';
  matchedWords?: string[];
} {
  // Basic validation
  if (!username || username.trim().length === 0) {
    return {
      isValid: false,
      error: 'Username cannot be empty'
    };
  }
  
  if (username.trim().length < 3) {
    return {
      isValid: false,
      error: 'Username must be at least 3 characters long'
    };
  }
  
  if (username.trim().length > 20) {
    return {
      isValid: false,
      error: 'Username cannot be longer than 20 characters'
    };
  }
  
  // Skip language filter if requested (for auto-generated usernames)
  if (skipLanguageFilter) {
    return {
      isValid: true
    };
  }
  
  // Normalize the username for filtering
  const normalizedUsername = normalizeUsername(username);
  
  // Check against banned words
  const bannedCheck = containsBannedContent(normalizedUsername);
  
  if (bannedCheck.isBanned) {
    return {
      isValid: false,
      error: 'This username is not allowed. Please avoid using inappropriate, offensive, or sensitive language.',
      severity: bannedCheck.severity || 'medium',
      matchedWords: bannedCheck.matchedWords
    };
  }
  
  return {
    isValid: true
  };
}

/**
 * Logs rejected usernames for admin review (in a real app, this would send to a server)
 */
export function logRejectedUsername(username: string, reason: string, matchedWords?: string[]): void {
  // In a real app, this would send data to your analytics/logging service
  console.log('Rejected Username:', {
    username,
    reason,
    matchedWords,
    timestamp: new Date().toISOString()
  });
}

/**
 * Suggests alternative usernames when one is rejected
 */
export function suggestAlternativeUsernames(originalUsername: string): string[] {
  const suggestions: string[] = [];
  const cleanBase = originalUsername.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  if (cleanBase.length >= 3) {
    // Add numbers to the end
    for (let i = 1; i <= 3; i++) {
      const suggestion = cleanBase + Math.floor(Math.random() * 999 + 1);
      suggestions.push(suggestion);
    }
    
    // Add prefixes
    const prefixes = ['cool', 'super', 'awesome', 'real', 'the'];
    for (const prefix of prefixes.slice(0, 2)) {
      suggestions.push(prefix + cleanBase);
    }
  }
  
  return suggestions;
}