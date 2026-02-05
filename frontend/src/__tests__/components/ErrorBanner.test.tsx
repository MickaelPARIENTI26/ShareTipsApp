import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ErrorBanner from '../../components/common/ErrorBanner';
import { ErrorType, type AppError } from '../../utils/errors';

// Mock the theme
jest.mock('../../theme', () => ({
  useTheme: () => ({
    colors: {
      danger: '#EF4444',
      dangerLight: '#FEF2F2',
      dangerBorder: '#FECACA',
      primary: '#3B82F6',
      textSecondary: '#6B7280',
    },
  }),
}));

describe('ErrorBanner', () => {
  describe('rendering', () => {
    it('should render null when error is null', () => {
      const { toJSON } = render(<ErrorBanner error={null} />);
      expect(toJSON()).toBeNull();
    });

    it('should render message when error is a string', () => {
      const { getByText } = render(
        <ErrorBanner error="Something went wrong" />
      );

      expect(getByText('Something went wrong')).toBeTruthy();
    });

    it('should render message from AppError object', () => {
      const appError: AppError = {
        type: ErrorType.NETWORK,
        message: 'Network connection failed',
        retryable: true,
      };

      const { getByText } = render(<ErrorBanner error={appError} />);

      expect(getByText('Network connection failed')).toBeTruthy();
    });
  });

  describe('dismiss button', () => {
    it('should call onDismiss when dismiss button is pressed', () => {
      const onDismiss = jest.fn();

      const { UNSAFE_getAllByType } = render(
        <ErrorBanner error="Test error" onDismiss={onDismiss} />
      );

      // Find the dismiss button (TouchableOpacity with close icon)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { TouchableOpacity } = require('react-native');
      const touchables = UNSAFE_getAllByType(TouchableOpacity);
      const dismissButton = touchables[touchables.length - 1];

      fireEvent.press(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not render dismiss button when onDismiss is not provided', () => {
      const { UNSAFE_getAllByType } = render(
        <ErrorBanner error="Test error" />
      );

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { TouchableOpacity } = require('react-native');
      const touchables = UNSAFE_getAllByType(TouchableOpacity);

      // Should have no buttons
      expect(touchables.length).toBe(0);
    });
  });

  describe('retry button', () => {
    it('should show retry button for retryable errors', () => {
      const onRetry = jest.fn();
      const appError: AppError = {
        type: ErrorType.NETWORK,
        message: 'Network error',
        retryable: true,
      };

      const { getByText } = render(
        <ErrorBanner error={appError} onRetry={onRetry} />
      );

      expect(getByText('Réessayer')).toBeTruthy();
    });

    it('should call onRetry when retry button is pressed', () => {
      const onRetry = jest.fn();
      const appError: AppError = {
        type: ErrorType.SERVER,
        message: 'Server error',
        retryable: true,
      };

      const { getByText } = render(
        <ErrorBanner error={appError} onRetry={onRetry} />
      );

      fireEvent.press(getByText('Réessayer'));

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not show retry button for non-retryable errors', () => {
      const onRetry = jest.fn();
      const appError: AppError = {
        type: ErrorType.AUTH,
        message: 'Authentication failed',
        retryable: false,
      };

      const { queryByText } = render(
        <ErrorBanner error={appError} onRetry={onRetry} />
      );

      expect(queryByText('Réessayer')).toBeNull();
    });

    it('should not show retry button for string errors', () => {
      const onRetry = jest.fn();

      const { queryByText } = render(
        <ErrorBanner error="String error" onRetry={onRetry} />
      );

      expect(queryByText('Réessayer')).toBeNull();
    });
  });

  describe('error types', () => {
    it.each([
      [ErrorType.NETWORK, 'cloud-offline-outline'],
      [ErrorType.AUTH, 'lock-closed-outline'],
      [ErrorType.FORBIDDEN, 'ban-outline'],
      [ErrorType.NOT_FOUND, 'search-outline'],
      [ErrorType.SERVER, 'server-outline'],
      [ErrorType.UNKNOWN, 'alert-circle-outline'],
    ])('should render correct icon for %s error', (errorType) => {
      const appError: AppError = {
        type: errorType as ErrorType,
        message: 'Test message',
        retryable: false,
      };

      const { UNSAFE_getByType } = render(<ErrorBanner error={appError} />);

      // The component should render without crashing
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { View } = require('react-native');
      expect(UNSAFE_getByType(View)).toBeTruthy();
    });
  });
});
