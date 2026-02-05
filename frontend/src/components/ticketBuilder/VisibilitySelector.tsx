import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TicketVisibility } from '../../store/ticketBuilder.store';
import { useTheme, type ThemeColors } from '../../theme';
import { validateTicketPrice, RULES } from '../../utils/validation';

export const PRICE_INPUT_ACCESSORY_ID = 'priceInputAccessory';

interface VisibilitySelectorProps {
  visibility: TicketVisibility;
  priceEur: number | null;
  onVisibilityChange: (value: TicketVisibility) => void;
  onPriceChange: (value: number | null) => void;
}

const VisibilitySelector: React.FC<VisibilitySelectorProps> = ({
  visibility,
  priceEur,
  onVisibilityChange,
  onPriceChange,
}) => {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const [priceText, setPriceText] = useState(priceEur != null ? String(priceEur) : '');
  const [touched, setTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPrivate = visibility === 'PRIVATE';
  const priceValidation = validateTicketPrice(priceText, isPrivate);

  const handlePriceChange = (text: string) => {
    setPriceText(text);
    setTouched(true);
    const num = parseInt(text, 10);
    onPriceChange(Number.isNaN(num) || num < 1 ? null : num);
  };

  const handleVisibilityChange = (value: TicketVisibility) => {
    onVisibilityChange(value);
    if (value === 'PUBLIC') {
      setPriceText('');
      setTouched(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Visibilité du ticket</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          testID="visibility-public-button"
          style={[
            styles.toggleBtn,
            visibility === 'PUBLIC' && styles.toggleBtnActive,
          ]}
          onPress={() => handleVisibilityChange('PUBLIC')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="earth"
            size={16}
            color={visibility === 'PUBLIC' ? colors.textOnPrimary : colors.textSecondary}
          />
          <Text
            style={[
              styles.toggleText,
              visibility === 'PUBLIC' && styles.toggleTextActive,
            ]}
          >
            Public
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="visibility-private-button"
          style={[
            styles.toggleBtn,
            visibility === 'PRIVATE' && styles.toggleBtnActivePrivate,
          ]}
          onPress={() => handleVisibilityChange('PRIVATE')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="lock-closed"
            size={16}
            color={visibility === 'PRIVATE' ? colors.textOnPrimary : colors.textSecondary}
          />
          <Text
            style={[
              styles.toggleText,
              visibility === 'PRIVATE' && styles.toggleTextActive,
            ]}
          >
            Privé
          </Text>
        </TouchableOpacity>
      </View>

      {visibility === 'PRIVATE' && (
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>
            Prix du ticket ({RULES.TICKET.minPrice}-{RULES.TICKET.maxPrice} EUR)
          </Text>
          <View style={[
            styles.priceInputWrapper,
            touched && !priceValidation.isValid && styles.priceInputError,
          ]}>
            <TextInput
              testID="price-input"
              style={styles.priceInput}
              keyboardType="number-pad"
              placeholder="Ex: 50"
              placeholderTextColor={colors.textTertiary}
              value={priceText}
              onChangeText={handlePriceChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onSubmitEditing={() => Keyboard.dismiss()}
              inputAccessoryViewID={Platform.OS === 'ios' ? PRICE_INPUT_ACCESSORY_ID : undefined}
            />
            <Text style={styles.priceSuffix}>EUR</Text>
            {isFocused && (
              <TouchableOpacity
                style={styles.okButton}
                onPress={() => Keyboard.dismiss()}
                activeOpacity={0.7}
              >
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
          {touched && !priceValidation.isValid && (
            <Text style={styles.priceError}>{priceValidation.error}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginBottom: 8,
        },
        label: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 8,
        },
        toggleRow: {
          flexDirection: 'row',
          gap: 8,
        },
        toggleBtn: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingVertical: 10,
          borderRadius: 8,
          backgroundColor: colors.background,
        },
        toggleBtnActive: {
          backgroundColor: colors.primary,
        },
        toggleBtnActivePrivate: {
          backgroundColor: colors.warning,
        },
        toggleText: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        toggleTextActive: {
          color: colors.textOnPrimary,
        },
        priceRow: {
          marginTop: 10,
        },
        priceLabel: {
          fontSize: 12,
          color: colors.textSecondary,
          marginBottom: 6,
        },
        priceInputWrapper: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.background,
          borderRadius: 8,
          paddingHorizontal: 12,
        },
        priceInput: {
          flex: 1,
          fontSize: 16,
          fontWeight: '600',
          color: colors.text,
          paddingVertical: 10,
        },
        priceInputError: {
          borderWidth: 1,
          borderColor: colors.danger,
        },
        priceSuffix: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        okButton: {
          backgroundColor: colors.primary,
          borderRadius: 6,
          paddingHorizontal: 12,
          paddingVertical: 6,
          marginLeft: 8,
        },
        okButtonText: {
          fontSize: 14,
          fontWeight: '700',
          color: colors.textOnPrimary,
        },
        priceError: {
          color: colors.danger,
          fontSize: 11,
          marginTop: 4,
          marginLeft: 4,
        },
      }),
    [colors]
  );

export default VisibilitySelector;
