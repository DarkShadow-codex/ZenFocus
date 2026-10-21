// ============================================================================
// CUSTOM STUDY TIMER MODAL
// Allows the student to self-set and fine-tune study focus sessions > 1 hour
// Synced across Android DPC and iOS Apple Screen Time
// ============================================================================

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radii } from '../theme';
import { DevicePlatform } from '../types';

interface CustomStudyTimerModalProps {
  visible: boolean;
  onClose: () => void;
  onSetTimer: (minutes: number, sessionName: string) => void;
  currentMinutes?: number;
  themeMode: 'light' | 'dark';
  activePlatform: DevicePlatform;
}

export const CustomStudyTimerModal: React.FC<CustomStudyTimerModalProps> = ({
  visible,
  onClose,
  onSetTimer,
  currentMinutes = 90,
  themeMode,
  activePlatform,
}) => {
  const theme = Palette[themeMode];

  // Initialize with current minutes (defaulting to 90 min = 1.5 hr)
  const initialHours = Math.floor(currentMinutes / 60);
  const initialMins = currentMinutes % 60;

  const [hours, setHours] = useState<number>(initialHours >= 1 ? initialHours : 1);
  const [minutes, setMinutes] = useState<number>(initialHours >= 1 ? initialMins : 30);
  const [selectedSubject, setSelectedSubject] = useState<string>('📐 Math & STEM');

  const multiHourPresets = [
    { label: '75m (1h 15m)', mins: 75, subtitle: 'Standard Deep Flow' },
    { label: '90m (1h 30m)', mins: 90, subtitle: 'Exam & Test Prep' },
    { label: '120m (2h 00m)', mins: 120, subtitle: 'Extended Block' },
    { label: '150m (2h 30m)', mins: 150, subtitle: 'Project Sprint' },
    { label: '180m (3h 00m)', mins: 180, subtitle: 'Weekend Marathon' },
  ];

  const subjects = [
    '📐 Math & STEM',
    '📖 Reading & Essay',
    '🔬 Science Lab',
    '💻 Coding & Tech',
    '📝 Exam Prep',
    '🎯 General Study',
  ];

  const totalMinutes = hours * 60 + minutes;

  const handleApplyPreset = (mins: number) => {
    setHours(Math.floor(mins / 60));
    setMinutes(mins % 60);
  };

  const adjustMinutes = (delta: number) => {
    let newTotal = totalMinutes + delta;
    if (newTotal < 5) newTotal = 5;
    if (newTotal > 480) newTotal = 480; // max 8 hours

    setHours(Math.floor(newTotal / 60));
    setMinutes(newTotal % 60);
  };

  const handleConfirm = () => {
    if (totalMinutes < 1) return;
    onSetTimer(totalMinutes, selectedSubject);
    onClose();
  };

  const finishDate = new Date(Date.now() + totalMinutes * 60 * 1000);
  const finishTimeStr = finishDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              
              {/* Header */}
              <View style={styles.header}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: theme.textPrimary }]}>Self-Set Study Timer</Text>
                  <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    Customize focus duration for deep sessions &gt; 1 hour
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Cross-Platform Synced Pill */}
              <View style={[styles.platformPill, { backgroundColor: 'rgba(99, 102, 241, 0.08)' }]}>
                <Ionicons
                  name={activePlatform === 'ios' ? 'logo-apple' : 'logo-android'}
                  size={14}
                  color={Palette.primary}
                />
                <Text style={[styles.platformPillText, { color: Palette.primary }]}>
                  {activePlatform === 'ios'
                    ? 'Synced with iOS Apple Screen Time & DeviceActivity'
                    : 'Synced with Android Device Policy Controller (DPC)'}
                </Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {/* Total Duration Display */}
                <View style={[styles.durationDisplayBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder }]}>
                  <Text style={[styles.durationSub, { color: theme.textSecondary }]}>Total Study Goal</Text>
                  <Text style={[styles.durationBig, { color: Palette.primary }]}>
                    {hours > 0 ? `${hours} hr ` : ''}{minutes > 0 ? `${minutes} min` : (hours > 0 ? '' : '0 min')}
                  </Text>
                  <Text style={[styles.durationMinsNotice, { color: theme.textMuted }]}>
                    ({totalMinutes} minutes • Ends at {finishTimeStr})
                  </Text>

                  {/* Fine Adjustment Steppers */}
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={[styles.stepperBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
                      onPress={() => adjustMinutes(-15)}
                    >
                      <Text style={[styles.stepperBtnText, { color: theme.textPrimary }]}>-15m</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.stepperBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
                      onPress={() => adjustMinutes(-5)}
                    >
                      <Text style={[styles.stepperBtnText, { color: theme.textPrimary }]}>-5m</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.stepperBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
                      onPress={() => adjustMinutes(5)}
                    >
                      <Text style={[styles.stepperBtnText, { color: theme.textPrimary }]}>+5m</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.stepperBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
                      onPress={() => adjustMinutes(15)}
                    >
                      <Text style={[styles.stepperBtnText, { color: theme.textPrimary }]}>+15m</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.stepperBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
                      onPress={() => adjustMinutes(30)}
                    >
                      <Text style={[styles.stepperBtnText, { color: Palette.primary, fontWeight: '700' }]}>+30m</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Extended Multi-Hour Presets */}
                <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>
                  Extended Multi-Hour Presets (&gt; 1 Hour)
                </Text>
                <View style={styles.presetsGrid}>
                  {multiHourPresets.map((p) => {
                    const isSelected = totalMinutes === p.mins;
                    return (
                      <TouchableOpacity
                        key={p.mins}
                        style={[
                          styles.presetCard,
                          { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder },
                          isSelected && { backgroundColor: 'rgba(99, 102, 241, 0.12)', borderColor: Palette.primary },
                        ]}
                        onPress={() => handleApplyPreset(p.mins)}
                      >
                        <Text
                          style={[
                            styles.presetCardTitle,
                            { color: theme.textPrimary },
                            isSelected && { color: Palette.primary, fontWeight: '700' },
                          ]}
                        >
                          {p.label}
                        </Text>
                        <Text style={[styles.presetCardSub, { color: theme.textMuted }]}>{p.subtitle}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Hours Selector */}
                <Text style={[styles.sectionLabel, { color: theme.textPrimary, marginTop: 12 }]}>
                  Select Hours
                </Text>
                <View style={styles.chipsRow}>
                  {[0, 1, 2, 3, 4, 5].map((h) => {
                    const isSelected = hours === h;
                    return (
                      <TouchableOpacity
                        key={h}
                        style={[
                          styles.chip,
                          { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder },
                          isSelected && { backgroundColor: Palette.primary, borderColor: Palette.primary },
                        ]}
                        onPress={() => setHours(h)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: theme.textPrimary },
                            isSelected && { color: '#ffffff', fontWeight: '700' },
                          ]}
                        >
                          {h} {h === 1 ? 'Hour' : 'Hours'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Minutes Selector */}
                <Text style={[styles.sectionLabel, { color: theme.textPrimary, marginTop: 12 }]}>
                  Select Minutes
                </Text>
                <View style={styles.chipsRow}>
                  {[0, 15, 30, 45].map((m) => {
                    const isSelected = minutes === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.chip,
                          { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder },
                          isSelected && { backgroundColor: Palette.primary, borderColor: Palette.primary },
                        ]}
                        onPress={() => setMinutes(m)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: theme.textPrimary },
                            isSelected && { color: '#ffffff', fontWeight: '700' },
                          ]}
                        >
                          {m} Min
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Study Subject Intent */}
                <Text style={[styles.sectionLabel, { color: theme.textPrimary, marginTop: 12 }]}>
                  Study Subject / Goal Tag
                </Text>
                <View style={styles.chipsRow}>
                  {subjects.map((sub) => {
                    const isSelected = selectedSubject === sub;
                    return (
                      <TouchableOpacity
                        key={sub}
                        style={[
                          styles.chip,
                          { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder },
                          isSelected && { backgroundColor: Palette.secondary, borderColor: Palette.secondary },
                        ]}
                        onPress={() => setSelectedSubject(sub)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: theme.textPrimary },
                            isSelected && { color: '#ffffff', fontWeight: '700' },
                          ]}
                        >
                          {sub}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Actions */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.btnCancel, { borderColor: theme.surfaceBorder }]}
                  onPress={onClose}
                >
                  <Text style={[styles.btnCancelText, { color: theme.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.btnConfirm,
                    { backgroundColor: Palette.primary },
                    totalMinutes < 1 && { opacity: 0.5 },
                  ]}
                  disabled={totalMinutes < 1}
                  onPress={handleConfirm}
                >
                  <Ionicons name="timer" size={18} color="#ffffff" />
                  <Text style={styles.btnConfirmText}>
                    Set {totalMinutes}m Study Goal
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
        </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 19, 31, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  platformPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
    marginBottom: 14,
  },
  platformPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  durationDisplayBox: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: 14,
  },
  durationSub: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  durationBig: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  durationMinsNotice: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  stepperBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  stepperBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  presetCard: {
    width: '48%',
    padding: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  presetCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  presetCardSub: {
    fontSize: 11,
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  btnCancel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  btnConfirm: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radii.lg,
  },
  btnConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
