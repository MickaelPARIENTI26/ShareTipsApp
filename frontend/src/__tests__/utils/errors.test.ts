// Unmock axios for this test file - we need real AxiosError class
jest.unmock('axios');

import { AxiosError } from 'axios';
import { parseError, getErrorMessage, isRetryableError, ErrorType } from '../../utils/errors';

// Helper to create real Axios errors
function createAxiosError(
  status: number,
  data?: unknown,
  code?: string
): AxiosError {
  const config = { url: '/test', headers: {} } as any;

  const response = status ? {
    status,
    statusText: 'Error',
    headers: {},
    config,
    data,
  } : undefined;

  return new AxiosError(
    'Test error',
    code || 'ERR_BAD_REQUEST',
    config,
    null,
    response as any
  );
}

describe('parseError', () => {
  describe('Axios errors', () => {
    it('should parse 401 as AUTH error', () => {
      const error = createAxiosError(401);
      const result = parseError(error);

      expect(result.type).toBe(ErrorType.AUTH);
      expect(result.statusCode).toBe(401);
      expect(result.retryable).toBe(false);
    });

    it('should parse 403 as FORBIDDEN error', () => {
      const error = createAxiosError(403);
      const result = parseError(error);

      expect(result.type).toBe(ErrorType.FORBIDDEN);
      expect(result.statusCode).toBe(403);
    });

    it('should parse 404 as NOT_FOUND error', () => {
      const error = createAxiosError(404);
      const result = parseError(error);

      expect(result.type).toBe(ErrorType.NOT_FOUND);
      expect(result.statusCode).toBe(404);
    });

    it('should parse 400 as VALIDATION error', () => {
      const error = createAxiosError(400, { message: 'Invalid data' });
      const result = parseError(error);

      expect(result.type).toBe(ErrorType.VALIDATION);
      expect(result.statusCode).toBe(400);
    });

    it('should parse 500 as SERVER error and mark as retryable', () => {
      const error = createAxiosError(500);
      const result = parseError(error);

      expect(result.type).toBe(ErrorType.SERVER);
      expect(result.retryable).toBe(true);
    });

    it('should parse network error (no response) as NETWORK error', () => {
      const error = new AxiosError(
        'Network Error',
        'ERR_NETWORK',
        { url: '/test', headers: {} } as any,
        null,
        undefined
      );
      const result = parseError(error);

      expect(result.type).toBe(ErrorType.NETWORK);
      expect(result.retryable).toBe(true);
    });

    it('should translate known backend error messages', () => {
      const error = createAxiosError(400, { message: 'Invalid credentials' });
      const result = parseError(error);

      expect(result.message).toBe('Email ou mot de passe incorrect.');
    });

    it('should translate "Email already registered" message', () => {
      const error = createAxiosError(400, { message: 'Email already registered' });
      const result = parseError(error);

      expect(result.message).toBe('Cet email est déjà utilisé.');
    });

    it('should translate "Insufficient credits" message', () => {
      const error = createAxiosError(400, { message: 'Insufficient credits' });
      const result = parseError(error);

      expect(result.message).toBe('Solde insuffisant.');
    });

    it('should handle ASP.NET validation errors format', () => {
      const error = createAxiosError(400, {
        errors: {
          Email: ['Email is required'],
        },
      });
      const result = parseError(error);

      expect(result.message).toBe('Email is required');
    });

    it('should handle error message in "error" field', () => {
      const error = createAxiosError(400, { error: 'Custom error' });
      const result = parseError(error);

      expect(result.type).toBe(ErrorType.VALIDATION);
    });

    it('should handle error message in "detail" field', () => {
      const error = createAxiosError(400, { detail: 'Detailed error' });
      const result = parseError(error);

      expect(result.type).toBe(ErrorType.VALIDATION);
    });
  });

  describe('Standard Error objects', () => {
    it('should parse standard Error', () => {
      const error = new Error('Something went wrong');
      const result = parseError(error);

      expect(result.type).toBe(ErrorType.UNKNOWN);
      expect(result.message).toBe('Something went wrong');
      expect(result.retryable).toBe(false);
    });

    it('should parse network-related Error as NETWORK', () => {
      const error = new Error('Network request failed');
      const result = parseError(error);

      expect(result.type).toBe(ErrorType.NETWORK);
      expect(result.retryable).toBe(true);
    });
  });

  describe('String errors', () => {
    it('should parse string error', () => {
      const result = parseError('String error message');

      expect(result.type).toBe(ErrorType.UNKNOWN);
      expect(result.message).toBe('String error message');
    });
  });

  describe('Unknown error types', () => {
    it('should handle null error', () => {
      const result = parseError(null);

      expect(result.type).toBe(ErrorType.UNKNOWN);
    });

    it('should handle undefined error', () => {
      const result = parseError(undefined);

      expect(result.type).toBe(ErrorType.UNKNOWN);
    });

    it('should handle object error', () => {
      const result = parseError({ custom: 'error' });

      expect(result.type).toBe(ErrorType.UNKNOWN);
    });
  });
});

describe('getErrorMessage', () => {
  it('should return message string from error', () => {
    const error = createAxiosError(401);
    const message = getErrorMessage(error);

    expect(typeof message).toBe('string');
    expect(message.length).toBeGreaterThan(0);
  });

  it('should return translated message for known errors', () => {
    const error = createAxiosError(400, { message: 'Invalid credentials' });
    const message = getErrorMessage(error);

    expect(message).toBe('Email ou mot de passe incorrect.');
  });
});

describe('isRetryableError', () => {
  it('should return true for network errors', () => {
    const error = createAxiosError(0, undefined, 'ERR_NETWORK');
    delete (error as any).response;

    expect(isRetryableError(error)).toBe(true);
  });

  it('should return true for server errors (500)', () => {
    const error = createAxiosError(500);

    expect(isRetryableError(error)).toBe(true);
  });

  it('should return false for auth errors (401)', () => {
    const error = createAxiosError(401);

    expect(isRetryableError(error)).toBe(false);
  });

  it('should return false for validation errors (400)', () => {
    const error = createAxiosError(400);

    expect(isRetryableError(error)).toBe(false);
  });
});
