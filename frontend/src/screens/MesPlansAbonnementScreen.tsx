import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { subscriptionPlanApi } from '../api/subscriptionPlan.api';
import type {
  SubscriptionPlanDto,
  CreateSubscriptionPlanRequest,
  UpdateSubscriptionPlanRequest,
} from '../types';
import { useTheme, type ThemeColors } from '../theme';

const MesPlansAbonnementScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const [plans, setPlans] = useState<SubscriptionPlanDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanDto | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationInDays, setDurationInDays] = useState('30');
  const [priceCredits, setPriceCredits] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchPlans = useCallback(async () => {
    try {
      const { data } = await subscriptionPlanApi.getMyPlans();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPlans();
    }, [fetchPlans])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPlans();
  }, [fetchPlans]);

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setDurationInDays('30');
    setPriceCredits('');
    setIsActive(true);
    setEditingPlan(null);
  }, []);

  const openCreateModal = useCallback(() => {
    resetForm();
    setModalVisible(true);
  }, [resetForm]);

  const openEditModal = useCallback((plan: SubscriptionPlanDto) => {
    setEditingPlan(plan);
    setTitle(plan.title);
    setDescription(plan.description ?? '');
    setDurationInDays(plan.durationInDays.toString());
    setPriceCredits(plan.priceCredits.toString());
    setIsActive(plan.isActive);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    resetForm();
  }, [resetForm]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est requis');
      return;
    }

    const duration = parseInt(durationInDays, 10);
    const price = parseInt(priceCredits, 10);

    if (isNaN(duration) || duration <= 0) {
      Alert.alert('Erreur', 'La durée doit être un nombre positif');
      return;
    }

    if (isNaN(price) || price <= 0) {
      Alert.alert('Erreur', 'Le prix doit être un nombre positif');
      return;
    }

    setSaving(true);
    try {
      if (editingPlan) {
        const request: UpdateSubscriptionPlanRequest = {
          title: title.trim(),
          description: description.trim() || undefined,
          durationInDays: duration,
          priceCredits: price,
          isActive,
        };
        await subscriptionPlanApi.update(editingPlan.id, request);
      } else {
        const request: CreateSubscriptionPlanRequest = {
          title: title.trim(),
          description: description.trim() || undefined,
          durationInDays: duration,
          priceCredits: price,
        };
        await subscriptionPlanApi.create(request);
      }
      closeModal();
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le plan');
    } finally {
      setSaving(false);
    }
  }, [title, description, durationInDays, priceCredits, isActive, editingPlan, closeModal, fetchPlans]);

  const handleDelete = useCallback(
    (plan: SubscriptionPlanDto) => {
      Alert.alert(
        'Supprimer le plan',
        `Voulez-vous vraiment supprimer "${plan.title}" ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                await subscriptionPlanApi.delete(plan.id);
                fetchPlans();
              } catch (error) {
                console.error('Error deleting plan:', error);
                Alert.alert('Erreur', 'Impossible de supprimer le plan');
              }
            },
          },
        ]
      );
    },
    [fetchPlans]
  );

  const formatDuration = (days: number): string => {
    if (days === 1) return '1 jour';
    if (days < 7) return `${days} jours`;
    if (days === 7) return '1 semaine';
    if (days === 30) return '1 mois';
    if (days === 90) return '3 mois';
    if (days === 365) return '1 an';
    return `${days} jours`;
  };

  const renderPlanCard = useCallback(
    ({ item }: { item: SubscriptionPlanDto }) => (
      <View style={styles.planCard}>
        <View style={styles.planHeader}>
          <View style={styles.planTitleRow}>
            <Text style={styles.planTitle}>{item.title}</Text>
            {!item.isActive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Inactif</Text>
              </View>
            )}
          </View>
          <View style={styles.planActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openEditModal(item)}
            >
              <Ionicons name="pencil" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {item.description && (
          <Text style={styles.planDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.planDetails}>
          <View style={styles.planDetailItem}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.planDetailText}>{formatDuration(item.durationInDays)}</Text>
          </View>
          <View style={styles.planDetailItem}>
            <Ionicons name="wallet-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.planDetailText}>{item.priceCredits} crédits</Text>
          </View>
        </View>
      </View>
    ),
    [colors, styles, openEditModal, handleDelete]
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyState}>
        <Ionicons name="pricetag-outline" size={64} color={colors.textTertiary} />
        <Text style={styles.emptyTitle}>{"Aucun plan d'abonnement"}</Text>
        <Text style={styles.emptySubtitle}>
          Créez votre premier plan pour que vos abonnés puissent vous suivre
        </Text>
      </View>
    ),
    [colors, styles]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        renderItem={renderPlanCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      {/* FAB to create new plan */}
      <TouchableOpacity style={styles.fab} onPress={openCreateModal} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color={colors.textOnPrimary} />
      </TouchableOpacity>

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPlan ? 'Modifier le plan' : 'Nouveau plan'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Titre *</Text>
                <TextInput
                  style={styles.textInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Ex: Abonnement Premium"
                  placeholderTextColor={colors.textTertiary}
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Décrivez ce que vos abonnés recevront..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.inputLabel}>Durée (jours) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={durationInDays}
                    onChangeText={setDurationInDays}
                    placeholder="30"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.inputLabel}>Prix (crédits) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={priceCredits}
                    onChangeText={setPriceCredits}
                    placeholder="100"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {editingPlan && (
                <View style={styles.switchRow}>
                  <View style={styles.switchLabel}>
                    <Text style={styles.inputLabel}>Actif</Text>
                    <Text style={styles.switchHint}>
                      Les plans inactifs ne sont pas visibles par les utilisateurs
                    </Text>
                  </View>
                  <Switch
                    value={isActive}
                    onValueChange={setIsActive}
                    trackColor={{ false: colors.separator, true: colors.primaryLight }}
                    thumbColor={isActive ? colors.primary : colors.textTertiary}
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingPlan ? 'Enregistrer' : 'Créer'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        },
        listContent: {
          padding: 16,
          paddingBottom: 100,
        },
        planCard: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        },
        planHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 8,
        },
        planTitleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          flex: 1,
        },
        planTitle: {
          fontSize: 18,
          fontWeight: '600',
          color: colors.text,
        },
        inactiveBadge: {
          backgroundColor: colors.textTertiary,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 8,
        },
        inactiveBadgeText: {
          fontSize: 11,
          fontWeight: '600',
          color: colors.textOnPrimary,
        },
        planActions: {
          flexDirection: 'row',
          gap: 8,
        },
        actionButton: {
          padding: 8,
        },
        planDescription: {
          fontSize: 14,
          color: colors.textSecondary,
          marginBottom: 12,
        },
        planDetails: {
          flexDirection: 'row',
          gap: 20,
        },
        planDetailItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        planDetailText: {
          fontSize: 14,
          color: colors.textSecondary,
        },
        emptyState: {
          alignItems: 'center',
          paddingVertical: 60,
          paddingHorizontal: 32,
        },
        emptyTitle: {
          fontSize: 18,
          fontWeight: '600',
          color: colors.text,
          marginTop: 16,
          marginBottom: 8,
        },
        emptySubtitle: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
        },
        fab: {
          position: 'absolute',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        },
        modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        },
        modalContent: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '90%',
        },
        modalHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 20,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.separator,
        },
        modalTitle: {
          fontSize: 20,
          fontWeight: '700',
          color: colors.text,
        },
        modalBody: {
          padding: 20,
        },
        inputGroup: {
          marginBottom: 20,
        },
        inputLabel: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 8,
        },
        textInput: {
          backgroundColor: colors.background,
          borderRadius: 12,
          padding: 14,
          fontSize: 16,
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.separator,
        },
        textArea: {
          height: 80,
          textAlignVertical: 'top',
        },
        rowInputs: {
          flexDirection: 'row',
          gap: 12,
        },
        halfInput: {
          flex: 1,
        },
        switchRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        },
        switchLabel: {
          flex: 1,
        },
        switchHint: {
          fontSize: 12,
          color: colors.textTertiary,
          marginTop: 2,
        },
        modalFooter: {
          flexDirection: 'row',
          padding: 20,
          gap: 12,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.separator,
        },
        cancelButton: {
          flex: 1,
          padding: 16,
          borderRadius: 12,
          backgroundColor: colors.background,
          alignItems: 'center',
        },
        cancelButtonText: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.text,
        },
        saveButton: {
          flex: 1,
          padding: 16,
          borderRadius: 12,
          backgroundColor: colors.primary,
          alignItems: 'center',
        },
        saveButtonDisabled: {
          opacity: 0.6,
        },
        saveButtonText: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.textOnPrimary,
        },
      }),
    [colors]
  );

export default MesPlansAbonnementScreen;
