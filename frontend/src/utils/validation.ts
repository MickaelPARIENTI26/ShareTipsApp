/**
 * Centralized validation utilities for frontend forms
 */

// ============ Regex Patterns ============

export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Password: at least 8 chars, 1 uppercase, 1 digit
  PASSWORD_STRONG: /^(?=.*[A-Z])(?=.*\d).{8,}$/,
  // Username: alphanumeric and underscores only
  USERNAME: /^[a-zA-Z0-9_]+$/,
};

// ============ Validation Rules ============

export const RULES = {
  USERNAME: {
    minLength: 3,
    maxLength: 20,
  },
  PASSWORD: {
    minLength: 8,
    requireUppercase: true,
    requireDigit: true,
  },
  TICKET: {
    minPrice: 1,
    maxPrice: 10000,
    minConfidence: 1,
    maxConfidence: 10,
  },
};

// ============ Validation Functions ============

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) {
    return { isValid: false, error: 'Email requis' };
  }
  if (!PATTERNS.EMAIL.test(email)) {
    return { isValid: false, error: 'Email invalide' };
  }
  return { isValid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Mot de passe requis' };
  }
  if (password.length < RULES.PASSWORD.minLength) {
    return { isValid: false, error: `${RULES.PASSWORD.minLength} caractères minimum` };
  }
  if (RULES.PASSWORD.requireUppercase && !/[A-Z]/.test(password)) {
    return { isValid: false, error: '1 majuscule requise' };
  }
  if (RULES.PASSWORD.requireDigit && !/\d/.test(password)) {
    return { isValid: false, error: '1 chiffre requis' };
  }
  return { isValid: true };
}

/**
 * Validate password for login (less strict - just check non-empty and min length)
 */
export function validateLoginPassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Mot de passe requis' };
  }
  if (password.length < 6) {
    return { isValid: false, error: '6 caractères minimum' };
  }
  return { isValid: true };
}

/**
 * Validate password confirmation
 */
export function validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
  if (!confirmPassword) {
    return { isValid: false, error: 'Confirmation requise' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Les mots de passe ne correspondent pas' };
  }
  return { isValid: true };
}

/**
 * Validate username
 */
export function validateUsername(username: string): ValidationResult {
  if (!username.trim()) {
    return { isValid: false, error: "Nom d'utilisateur requis" };
  }
  if (username.length < RULES.USERNAME.minLength) {
    return { isValid: false, error: `${RULES.USERNAME.minLength} caractères minimum` };
  }
  if (username.length > RULES.USERNAME.maxLength) {
    return { isValid: false, error: `${RULES.USERNAME.maxLength} caractères maximum` };
  }
  if (!PATTERNS.USERNAME.test(username)) {
    return { isValid: false, error: 'Lettres, chiffres et _ uniquement' };
  }
  return { isValid: true };
}

/**
 * Validate ticket price (credits)
 */
export function validateTicketPrice(priceStr: string, isPrivate: boolean): ValidationResult {
  // Public tickets don't need price validation
  if (!isPrivate) {
    return { isValid: true };
  }

  if (!priceStr.trim()) {
    return { isValid: false, error: 'Prix requis pour un ticket payant' };
  }

  const price = parseInt(priceStr, 10);

  if (isNaN(price)) {
    return { isValid: false, error: 'Prix invalide' };
  }

  if (price < RULES.TICKET.minPrice) {
    return { isValid: false, error: `Minimum ${RULES.TICKET.minPrice} crédit` };
  }

  if (price > RULES.TICKET.maxPrice) {
    return { isValid: false, error: `Maximum ${RULES.TICKET.maxPrice} crédits` };
  }

  return { isValid: true };
}

// ============ Form Validation Helpers ============

/**
 * Check if all validation results are valid
 */
export function isFormValid(...results: ValidationResult[]): boolean {
  return results.every(r => r.isValid);
}

// ============ Date of Birth Validation ============

export const RULES_AGE = {
  minAge: 18,
  maxAge: 120,
};

/**
 * Parse date string in DD/MM/YYYY format
 */
function parseDateDMY(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
  const year = parseInt(match[3], 10);

  const date = new Date(year, month, day);

  // Validate that the date is real (e.g., not 31/02/2000)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Calculate age from date of birth
 */
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Validate date of birth (format DD/MM/YYYY, 18+ years old)
 */
export function validateDateOfBirth(dateStr: string): ValidationResult {
  if (!dateStr.trim()) {
    return { isValid: false, error: 'Date de naissance requise' };
  }

  const date = parseDateDMY(dateStr);
  if (!date) {
    return { isValid: false, error: 'Format invalide (JJ/MM/AAAA)' };
  }

  const today = new Date();
  if (date > today) {
    return { isValid: false, error: 'Date dans le futur' };
  }

  const age = calculateAge(date);

  if (age < RULES_AGE.minAge) {
    return { isValid: false, error: `Vous devez avoir au moins ${RULES_AGE.minAge} ans` };
  }

  if (age > RULES_AGE.maxAge) {
    return { isValid: false, error: 'Date de naissance invalide' };
  }

  return { isValid: true };
}

/**
 * Convert DD/MM/YYYY to YYYY-MM-DD for API
 */
export function dateToISOFormat(dateStr: string): string {
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '';
  return `${match[3]}-${match[2]}-${match[1]}`;
}
