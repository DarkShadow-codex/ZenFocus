// ============================================================================
// APP SHIELD MODAL (Simulated Native App Block Screen)
// Shows the student what happens when trying to open a DPC-suspended app
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
import { RestrictionPolicy } from '../types';

interface AppShieldModalProps {
  visible: boolean;
  onClose: () => void;
  policy: RestrictionPolicy | null;
  onRequestException: () => void;
  themeMode: 'light' | 'dark';
}

export const AppShieldModal: React.FC<AppShieldModalProps> = ({
  visible,
  onClose,
  policy,
  onRequestException,
  themeMode,
}) => {
  if (!policy) return null;
  const theme = Palette[themeMode];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.shieldCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              
              {/* Floating Shield Icon */}
              <View style={[styles.shieldHalo, { backgroundColor: 'rgba(239, 101, 116, 0.12)' }]}>
                <Ionicons name="shield" size={44} color={Palette.error} />
              </View>

              {/* App Badge */}
              <View style={[styles.appBadge, { backgroundColor: policy.iconBg }]}>
                <Text style={styles.appBadgeText}>{policy.appIcon}</Text>
              </View>

              <Text style={[styles.appTitle, { color: theme.textPrimary }]}>
                {policy.appName} is Suspended
              </Text>

              <View style={[styles.statusPill, { backgroundColor: 'rgba(81, 70, 229, 0.12)' }]}>
                <Ionicons name="lock-closed" size={12} color={Palette.primary} />
                <Text style={[styles.statusPillText, { color: Palette.primary }]}>
                  DPC Package Suspension Active
                </Text>
              </View>

              <Text style={[styles.explanationText, { color: theme.textSecondary }]}>
                This application is locked by your parent to protect your study focus. Notifications from this package are silenced.
              </Text>

              {policy.scheduleDescription && (
                <View style={[styles.scheduleBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorderSubtle }]}>
                  <Ionicons name="time-outline" size={16} color={Palette.primary} />
                  <Text style={[styles.scheduleText, { color: theme.textPrimary }]}>
                    {policy.scheduleDescription}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionsBox}>
                <TouchableOpacity
                  style={[styles.btnPrimary, { backgroundColor: Palette.primary }]}
                  onPress={() => {
                    onClose();
                    onRequestException();
                  }}
                >
                  <Ionicons name="hand-right-outline" size={18} color="#ffffff" />
                  <Text style={styles.btnPrimaryText}>Request Study Exception</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnSecondary, { borderColor: theme.surfaceBorder }]}
                  onPress={onClose}
                >
                  <Text style={[styles.btnSecondaryText, { color: theme.textPrimary }]}>
                    Return to Study Flow
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
  shieldCard: {
    width: '100%',
    maxWidth: 420,
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
  shieldHalo: {
    width: 80,
    height: 80,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -16,
    zIndex: 1,
  },
  appBadge: {
    width: 48,
    height: 48,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 12,
    zIndex: 2,
  },
  appBadgeText: {
    fontSize: 22,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.full,
    marginBottom: 14,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  explanationText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  scheduleBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    marginBottom: 20,
  },
  scheduleText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  actionsBox: {
    width: '100%',
    gap: 10,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radii.lg,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  btnSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
