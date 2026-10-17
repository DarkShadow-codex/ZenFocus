// ============================================================================
// CELEBRATION MODAL
// Congratulates the student upon completing a study focus interval
// ============================================================================

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radii } from '../theme';

interface CelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  minutesCompleted: number;
  streakDays: number;
  onTakeBreak: () => void;
  themeMode: 'light' | 'dark';
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  visible,
  onClose,
  minutesCompleted,
  streakDays,
  onTakeBreak,
  themeMode,
}) => {
  const theme = Palette[themeMode];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              
              {/* Flame / Trophy Circle */}
              <View style={[styles.trophyCircle, { backgroundColor: Palette.tertiaryContainer }]}>
                <Text style={styles.trophyEmoji}>🎉</Text>
              </View>

              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Session Complete!
              </Text>

              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Incredible dedication! You stayed in deep flow for{' '}
                <Text style={{ fontWeight: '700', color: Palette.primary }}>{minutesCompleted} minutes</Text>.
              </Text>

              {/* Streak Badge Box */}
              <View style={[styles.streakBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorderSubtle }]}>
                <Ionicons name="flame" size={24} color={Palette.warning} />
                <View>
                  <Text style={[styles.streakNum, { color: theme.textPrimary }]}>
                    {streakDays} Day Streak!
                  </Text>
                  <Text style={[styles.streakSub, { color: theme.textMuted }]}>
                    You're building an unstoppable study habit.
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionsBox}>
                <TouchableOpacity
                  style={[styles.btnBreak, { backgroundColor: Palette.tertiary }]}
                  onPress={() => {
                    onClose();
                    onTakeBreak();
                  }}
                >
                  <Ionicons name="cafe-outline" size={18} color={Palette.onTertiary} />
                  <Text style={styles.btnBreakText}>Take a 5m Mindful Break</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnDone, { borderColor: theme.surfaceBorder }]}
                  onPress={onClose}
                >
                  <Text style={[styles.btnDoneText, { color: theme.textPrimary }]}>
                    Back to Study Hub
                  </Text>
                </TouchableOpacity>
              </View>

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
    backgroundColor: 'rgba(17, 19, 31, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  trophyCircle: {
    width: 72,
    height: 72,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  trophyEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  streakBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: 20,
  },
  streakNum: {
    fontSize: 15,
    fontWeight: '700',
  },
  streakSub: {
    fontSize: 11,
    marginTop: 2,
  },
  actionsBox: {
    width: '100%',
    gap: 10,
  },
  btnBreak: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radii.lg,
  },
  btnBreakText: {
    color: Palette.onTertiary,
    fontSize: 14,
    fontWeight: '700',
  },
  btnDone: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  btnDoneText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
