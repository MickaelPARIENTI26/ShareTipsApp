/**
 * Haptics Utility - ShareTips
 *
 * Utilitaire centralisé pour les retours haptiques (vibrations).
 * Fournit des feedbacks tactiles pour renforcer les interactions utilisateur.
 *
 * @example
 * // Import
 * import { haptics } from '../utils/haptics';
 *
 * // Usage basique
 * haptics.selection();    // Selection d'un element
 * haptics.light();        // Action legere
 * haptics.medium();       // Action moyenne
 * haptics.success();      // Succes
 * haptics.error();        // Erreur
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Types de feedback haptique disponibles
 */
export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

/**
 * Configuration pour desactiver les haptics si necessaire
 */
let hapticsEnabled = true;

/**
 * Active ou desactive les haptics globalement
 */
export const setHapticsEnabled = (enabled: boolean): void => {
  hapticsEnabled = enabled;
};

/**
 * Verifie si les haptics sont actives
 */
export const isHapticsEnabled = (): boolean => hapticsEnabled;

/**
 * Execute un feedback haptique de maniere securisee
 * Ne fait rien sur les plateformes non supportees
 */
const safeHaptic = async (callback: () => Promise<void>): Promise<void> => {
  if (!hapticsEnabled) return;

  // Les haptics ne fonctionnent que sur iOS et Android physiques
  if (Platform.OS === 'web') return;

  try {
    await callback();
  } catch {
    // Silently fail - haptics not critical
  }
};

/**
 * Collection de fonctions haptiques
 */
export const haptics = {
  /**
   * Impact leger - pour les interactions mineures
   * Ex: hover, scroll snap, toggle
   */
  light: () =>
    safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

  /**
   * Impact moyen - pour les actions standards
   * Ex: selection, ajout au panier, like
   */
  medium: () =>
    safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),

  /**
   * Impact fort - pour les actions importantes
   * Ex: suppression, action irreversible
   */
  heavy: () =>
    safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),

  /**
   * Notification de succes
   * Ex: validation formulaire, achat confirme
   */
  success: () =>
    safeHaptic(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    ),

  /**
   * Notification d'avertissement
   * Ex: limite atteinte, action risquee
   */
  warning: () =>
    safeHaptic(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    ),

  /**
   * Notification d'erreur
   * Ex: erreur de validation, echec action
   */
  error: () =>
    safeHaptic(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    ),

  /**
   * Selection - feedback le plus leger
   * Ex: changement d'onglet, selection dans liste
   */
  selection: () => safeHaptic(() => Haptics.selectionAsync()),

  /**
   * Execution conditionnelle selon le type
   */
  trigger: (type: HapticType) => {
    switch (type) {
      case 'light':
        return haptics.light();
      case 'medium':
        return haptics.medium();
      case 'heavy':
        return haptics.heavy();
      case 'success':
        return haptics.success();
      case 'warning':
        return haptics.warning();
      case 'error':
        return haptics.error();
      case 'selection':
        return haptics.selection();
    }
  },
};

export default haptics;
