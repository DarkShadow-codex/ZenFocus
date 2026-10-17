// ============================================================================
// EXCEPTION REQUEST MODAL (Derived from PRD.md FR-070 to FR-074)
// Allows child to submit a reasoned exception request for parent approval
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
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radii } from '../theme';

interface ExceptionRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (targetPackage: string, appName: string, durationMinutes: number, reason: string) => void;
  themeMode: 'light' | 'dark';
  preselectedApp?: { appName: string; targetPackage: string };
}

export const ExceptionRequestModal: React.FC<ExceptionRequestModalProps> = ({
  visible,
  onClose,
  onSubmit,
  themeMode,
  preselectedApp,
}) => {
  const theme = Palette[themeMode];
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [reason, setReason] = useState<string>('');

  const appName = preselectedApp?.appName || 'TikTok';
  const targetPackage = preselectedApp?.targetPackage || 'com.zhiliaoapp.musically';

  const durations = [15, 30, 45, 60];

  const handleSubmit = () => {
    if (!reason.trim()) return;
    onSubmit(targetPackage, appName, selectedDuration, reason.trim());
    setReason('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="hand-right" size={20} color={Palette.primary} />
                </View>
                <Text style={[styles.title, { color: theme.textPrimary }]}>Request Study Exception</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Requesting temporary access to <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{appName}</Text>. Your parent will receive an instant notification.
            </Text>

            {/* Duration Selector */}
            <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>Select Duration</Text>
            <View style={styles.durationRow}>
              {durations.map((dur) => (
                <TouchableOpacity
                  key={dur}
                  style={[
                    styles.durPill,
                    { borderColor: theme.surfaceBorder, backgroundColor: theme.surfaceSecondary },
                    selectedDuration === dur && { backgroundColor: Palette.primary, borderColor: Palette.primary },
                  ]}
                  onPress={() => setSelectedDuration(dur)}
                >
                  <Text
                    style={[
                      styles.durText,
                      { color: theme.textPrimary },
                      selectedDuration === dur && { color: '#ffffff', fontWeight: '700' },
                    ]}
                  >
                    {dur}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Reason Input */}
            <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>Reason for Request</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.surfaceSecondary,
                  borderColor: theme.surfaceBorder,
                  color: theme.textPrimary,
                },
              ]}
              multiline
              numberOfLines={3}
              placeholder="e.g. Need to review French grammar tutorial for class assignment..."
              placeholderTextColor={theme.textMuted}
              value={reason}
              onChangeText={setReason}
            />

            {/* Submit Action */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: reason.trim() ? Palette.primary : theme.surfaceBorder },
              ]}
              disabled={!reason.trim()}
              onPress={handleSubmit}
            >
              <Text style={[styles.submitBtnText, { color: reason.trim() ? '#ffffff' : theme.textMuted }]}>
                Send Request to Parent
              </Text>
            </TouchableOpacity>

          </View>
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
    maxWidth: 420,
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
    marginBottom: 8,
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
    backgroundColor: Palette.primaryContainer,
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
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  durPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  durText: {
    fontSize: 13,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: 12,
    fontSize: 14,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
