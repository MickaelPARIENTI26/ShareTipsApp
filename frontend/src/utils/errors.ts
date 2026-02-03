/**
 * Centralized error handling utilities for the frontend
 */

import { AxiosError } from 'axios';

// ============ Error Types ============

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  FORBIDDEN = 'FORBIDDEN',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: unknown;
  statusCode?: number;
  retryable: boolean;
}

// ============ Error Messages (French) ============

const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: 'Connexion impossible. Vérifiez votre connexion internet.',
  [ErrorType.AUTH]: 'Session expirée. Veuillez vous reconnecter.',
  [ErrorType.VALIDATION]: 'Données invalides. Veuillez vérifier vos informations.',
  [ErrorType.NOT_FOUND]: 'Élément introuvable.',
  [ErrorType.FORBIDDEN]: 'Accès refusé.',
  [ErrorType.SERVER]: 'Erreur serveur. Réessayez plus tard.',
  [ErrorType.UNKNOWN]: 'Une erreur inattendue est survenue.',
};

// Backend-specific error messages mapping
const BACKEND_ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  'Invalid credentials': 'Email ou mot de passe incorrect.',
  'User not found': 'Utilisateur introuvable.',
  'Email already registered': 'Cet email est déjà utilisé.',
  'Username already taken': 'Ce nom d\'utilisateur est déjà pris.',
  'Invalid refresh token': 'Session expirée. Veuillez vous reconnecter.',
  'Token expired': 'Session expirée. Veuillez vous reconnecter.',

  // Wallet errors
  'Insufficient credits': 'Solde insuffisant.',
  'Insufficient balance': 'Solde insuffisant.',
  'Invalid amount': 'Montant invalide.',

  // Ticket errors
  'Ticket not found': 'Ticket introuvable.',
  'Ticket already purchased': 'Vous avez déjà acheté ce ticket.',
  'Cannot purchase own ticket': 'Vous ne pouvez pas acheter votre propre ticket.',
  'Ticket is not for sale': 'Ce ticket n\'est pas à vendre.',
  'Ticket expired': 'Ce ticket a expiré.',

  // Favorite errors
  'Cannot favorite own ticket': 'Vous ne pouvez pas ajouter votre propre ticket en favoris.',
  'Already in favorites': 'Déjà dans vos favoris.',

  // Follow errors
  'Cannot follow yourself': 'Vous ne pouvez pas vous suivre vous-même.',
  'Already following': 'Vous suivez déjà ce pronostiqueur.',
  'Not following': 'Vous ne suivez pas ce pronostiqueur.',

  // Subscription errors
  'Already subscribed': 'Vous êtes déjà abonné.',
  'Cannot subscribe to yourself': 'Vous ne pouvez pas vous abonner à vous-même.',
  'Subscription not found': 'Abonnement introuvable.',
};

// ============ Error Classification ============

/**
 * Classify an error into an ErrorType based on status code and content
 */
function classifyError(statusCode?: number, message?: string): ErrorType {
  if (!statusCode) return ErrorType.NETWORK;

  switch (statusCode) {
    case 400:
      return ErrorType.VALIDATION;
    case 401:
      return ErrorType.AUTH;
    case 403:
      return ErrorType.FORBIDDEN;
    case 404:
      return ErrorType.NOT_FOUND;
    case 500:
    case 502:
    case 503:
    case 504:
      return ErrorType.SERVER;
    default:
      if (statusCode >= 400 && statusCode < 500) return ErrorType.VALIDATION;
      if (statusCode >= 500) return ErrorType.SERVER;
      return ErrorType.UNKNOWN;
  }
}

/**
 * Get a user-friendly message from a backend error message
 */
function getBackendErrorMessage(backendMessage: string): string | null {
  // Check for exact match
  if (BACKEND_ERROR_MESSAGES[backendMessage]) {
    return BACKEND_ERROR_MESSAGES[backendMessage];
  }

  // Check for partial matches (for messages with dynamic content)
  for (const [key, value] of Object.entries(BACKEND_ERROR_MESSAGES)) {
    if (backendMessage.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  return null;
}

// ============ Error Extraction ============

/**
 * Extract error message from various error response formats
 */
function extractErrorMessage(error: AxiosError): string | undefined {
  const data = error.response?.data;

  if (!data) return undefined;

  // Handle string response
  if (typeof data === 'string') return data;

  // Handle object response with various message fields
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;

    // Common error message field names
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error === 'string') return obj.error;
    if (typeof obj.title === 'string') return obj.title;
    if (typeof obj.detail === 'string') return obj.detail;

    // ASP.NET validation errors format
    if (obj.errors && typeof obj.errors === 'object') {
      const errors = obj.errors as Record<string, string[]>;
      const firstError = Object.values(errors)[0];
      if (Array.isArray(firstError) && firstError.length > 0) {
        return firstError[0];
      }
    }
  }

  return undefined;
}

// ============ Main Error Handler ============

/**
 * Parse any error into a standardized AppError
 */
export function parseError(error: unknown): AppError {
  // Handle Axios errors
  if (error instanceof AxiosError) {
    const statusCode = error.response?.status;
    const backendMessage = extractErrorMessage(error);
    const errorType = classifyError(statusCode, backendMessage);

    // Try to get a user-friendly message from the backend error
    let message = ERROR_MESSAGES[errorType];
    if (backendMessage) {
      const friendlyMessage = getBackendErrorMessage(backendMessage);
      if (friendlyMessage) {
        message = friendlyMessage;
      } else if (errorType === ErrorType.VALIDATION || errorType === ErrorType.FORBIDDEN) {
        // Use backend message for validation/forbidden errors if no mapping found
        message = backendMessage;
      }
    }

    // Special case: network error (no response)
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
      return {
        type: ErrorType.NETWORK,
        message: ERROR_MESSAGES[ErrorType.NETWORK],
        originalError: error,
        retryable: true,
      };
    }

    return {
      type: errorType,
      message,
      originalError: error,
      statusCode,
      retryable: errorType === ErrorType.NETWORK || errorType === ErrorType.SERVER,
    };
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for network-related error messages
    if (error.message.includes('Network') || error.message.includes('network')) {
      return {
        type: ErrorType.NETWORK,
        message: ERROR_MESSAGES[ErrorType.NETWORK],
        originalError: error,
        retryable: true,
      };
    }

    return {
      type: ErrorType.UNKNOWN,
      message: error.message || ERROR_MESSAGES[ErrorType.UNKNOWN],
      originalError: error,
      retryable: false,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: ErrorType.UNKNOWN,
      message: error,
      originalError: error,
      retryable: false,
    };
  }

  // Fallback for unknown error types
  return {
    type: ErrorType.UNKNOWN,
    message: ERROR_MESSAGES[ErrorType.UNKNOWN],
    originalError: error,
    retryable: false,
  };
}

/**
 * Get a simple error message string from any error
 */
export function getErrorMessage(error: unknown): string {
  return parseError(error).message;
}

/**
 * Check if an error is retryable (network or server error)
 */
export function isRetryableError(error: unknown): boolean {
  return parseError(error).retryable;
}
