// ============================================================================
// ADD RESTRICTION MODAL (Derived from PRD.md FR-030 & FR-035)
// Allows parent to select supported apps or custom packages for DPC suspension
// ============================================================================

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radii } from '../theme';
import { RestrictionPolicy } from '../types';

interface AddRestrictionModalProps {
  visible: boolean;
  onClose: () => void;
  onAddPolicy: (newPolicy: Omit<RestrictionPolicy, 'id' | 'version' | 'createdAt' | 'updatedAt'>) => void;
  themeMode: 'light' | 'dark';
}

const PRESET_APPS = [
  { name: 'Snapchat', pkg: 'com.snapchat.android', category: 'Social' as const, icon: '👻', bg: '#e6c800' },
  { name: 'Roblox', pkg: 'com.roblox.client', category: 'Gaming' as const, icon: '🎮', bg: '#2b2b2b' },
  { name: 'Netflix', pkg: 'com.netflix.mediaclient', category: 'Entertainment' as const, icon: '🎬', bg: '#e50914' },
  { name: 'Minecraft', pkg: 'com.mojang.minecraftpe', category: 'Gaming' as const, icon: '⛏️', bg: '#4a7c2a' },
  { name: 'Twitch', pkg: 'tv.twitch.android.app', category: 'Entertainment' as const, icon: '👾', bg: '#9146ff' },
];

export const AddRestrictionModal: React.FC<AddRestrictionModalProps> = ({
  visible,
  onClose,
  onAddPolicy,
  themeMode,
}) => {
  const theme = Palette[themeMode];

  const [selectedPreset, setSelectedPreset] = useState<typeof PRESET_APPS[0] | null>(null);
  const [customName, setCustomName] = useState('');
  const [customPkg, setCustomPkg] = useState('');
  const [customCategory, setCustomCategory] = useState<'Social' | 'Entertainment' | 'Gaming' | 'Productivity'>('Social');

  const handleSelectPreset = (preset: typeof PRESET_APPS[0]) => {
    setSelectedPreset(preset);
    setCustomName(preset.name);
    setCustomPkg(preset.pkg);
    setCustomCategory(preset.category);
  };

  const handleSave = () => {
    const finalName = customName.trim();
    const finalPkg = customPkg.trim();
    if (!finalName || !finalPkg) return;

    onAddPolicy({
      familyRelationshipId: 'fam_default',
      targetDeviceId: 'dev_galaxy_s24',
      ownerType: 'parent',
      policyType: 'app_block',
      targetPackage: finalPkg,
      appName: finalName,
      appCategory: customCategory,
      appIcon: selectedPreset?.icon || '📱',
      iconBg: selectedPreset?.bg || Palette.primary,
      desiredState: 'active',
      scheduleDescription: 'Blocked by Parent (DPC Suspension)',
    });

    // Reset and close
    setCustomName('');
    setCustomPkg('');
    setSelectedPreset(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: Palette.primaryContainer }]}>
                    <Ionicons name="add" size={22} color={Palette.primary} />
                  </View>
                  <Text style={[styles.title, { color: theme.textPrimary }]}>Add App Restriction</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  Quick Popular Presets
                </Text>

                {/* Presets Grid */}
                <View style={styles.presetsGrid}>
                  {PRESET_APPS.map((item) => {
                    const isSelected = selectedPreset?.pkg === item.pkg;
                    return (
                      <TouchableOpacity
                        key={item.pkg}
                        style={[
                          styles.presetChip,
                          { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder },
                          isSelected && { backgroundColor: Palette.primaryContainer, borderColor: Palette.primary },
                        ]}
                        onPress={() => handleSelectPreset(item)}
                      >
                        <Text style={styles.presetIcon}>{item.icon}</Text>
                        <Text
                          style={[
                            styles.presetName,
                            { color: theme.textPrimary },
                            isSelected && { color: Palette.primary, fontWeight: '700' },
                          ]}
                        >
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Form Inputs */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textPrimary }]}>App Display Name</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder, color: theme.textPrimary }]}
                    placeholder="e.g. Clash of Clans"
                    placeholderTextColor={theme.textMuted}
                    value={customName}
                    onChangeText={setCustomName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textPrimary }]}>Android Package Name</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder, color: theme.textPrimary }]}
                    placeholder="e.g. com.supercell.clashofclans"
                    placeholderTextColor={theme.textMuted}
                    value={customPkg}
                    onChangeText={setCustomPkg}
                    autoCapitalize="none"
                  />
                  <Text style={[styles.helpText, { color: theme.textMuted }]}>
                    Exact identifier for DevicePolicyManager package suspension.
                  </Text>
                </View>

                {/* Category Selector */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textPrimary }]}>Category</Text>
                  <View style={styles.catRow}>
                    {(['Social', 'Gaming', 'Entertainment', 'Productivity'] as const).map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.catPill,
                          { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder },
                          customCategory === cat && { backgroundColor: Palette.primary, borderColor: Palette.primary },
                        ]}
                        onPress={() => setCustomCategory(cat)}
                      >
                        <Text
                          style={[
                            styles.catText,
                            { color: theme.textPrimary },
                            customCategory === cat && { color: '#ffffff', fontWeight: '700' },
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Submit Action */}
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    { backgroundColor: customName.trim() && customPkg.trim() ? Palette.primary : theme.surfaceBorder },
                  ]}
                  disabled={!customName.trim() || !customPkg.trim()}
                  onPress={handleSave}
                >
                  <Text style={[styles.submitText, { color: customName.trim() && customPkg.trim() ? '#ffffff' : theme.textMuted }]}>
                    Apply Parent Restriction (DPC)
                  </Text>
                </TouchableOpacity>
              </ScrollView>

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 19, 31, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  presetIcon: {
    fontSize: 14,
  },
  presetName: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  helpText: {
    fontSize: 11,
    marginTop: 4,
  },
  catRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  catPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  catText: {
    fontSize: 11,
    fontWeight: '600',
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
