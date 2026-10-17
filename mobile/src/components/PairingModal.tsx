// ============================================================================
// PAIRING INVITATION MODAL (Derived from PRD.md FR-010 to FR-014)
// Generates secure, short-lived 6-digit pairing code to link Child's device
// ============================================================================

import React, { useState } from 'react';
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

interface PairingModalProps {
  visible: boolean;
  onClose: () => void;
  pairingCode: string;
  onRegenerateCode: () => void;
  themeMode: 'light' | 'dark';
}

export const PairingModal: React.FC<PairingModalProps> = ({
  visible,
  onClose,
  pairingCode,
  onRegenerateCode,
  themeMode,
}) => {
  const theme = Palette[themeMode];
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                    <Ionicons name="link" size={20} color={Palette.primary} />
                  </View>
                  <Text style={[styles.title, { color: theme.textPrimary }]}>Pair Child Device</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Share this short-lived pairing code with your child. When they enter it during setup, their device will be linked and protected.
              </Text>

              {/* Pairing Code Display Box */}
              <View style={[styles.codeBox, { backgroundColor: theme.surfaceSecondary, borderColor: Palette.primary }]}>
                <Text style={[styles.codeText, { color: Palette.primary }]}>{pairingCode}</Text>
                <Text style={[styles.expiryText, { color: theme.textMuted }]}>
                  ⏱️ Expires in 14:59 • Single-use
                </Text>
              </View>

              {/* Instructions Steps */}
              <View style={styles.stepsBox}>
                <View style={styles.stepItem}>
                  <Text style={[styles.stepNum, { backgroundColor: Palette.primaryContainer, color: Palette.primary }]}>1</Text>
                  <Text style={[styles.stepDesc, { color: theme.textPrimary }]}>
                    Open ZenFocus on your child's phone.
                  </Text>
                </View>
                <View style={styles.stepItem}>
                  <Text style={[styles.stepNum, { backgroundColor: Palette.primaryContainer, color: Palette.primary }]}>2</Text>
                  <Text style={[styles.stepDesc, { color: theme.textPrimary }]}>
                    Select <Text style={{ fontWeight: '700' }}>"I am a Child"</Text> and enter this code.
                  </Text>
                </View>
                <View style={styles.stepItem}>
                  <Text style={[styles.stepNum, { backgroundColor: Palette.primaryContainer, color: Palette.primary }]}>3</Text>
                  <Text style={[styles.stepDesc, { color: theme.textPrimary }]}>
                    Device Policy Controller activates tamper-proof protection.
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.btnOutline, { borderColor: theme.surfaceBorder }]}
                  onPress={onRegenerateCode}
                >
                  <Ionicons name="refresh-outline" size={16} color={theme.textPrimary} />
                  <Text style={[styles.btnOutlineText, { color: theme.textPrimary }]}>New Code</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnPrimary, { backgroundColor: Palette.primary }]}
                  onPress={handleCopy}
                >
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color="#ffffff" />
                  <Text style={styles.btnPrimaryText}>{copied ? 'Copied!' : 'Copy Code'}</Text>
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
  codeBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: Radii.lg,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  expiryText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  stepsBox: {
    gap: 10,
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: Radii.full,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 11,
    fontWeight: '700',
  },
  stepDesc: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  btnOutlineText: {
    fontSize: 13,
    fontWeight: '600',
  },
  btnPrimary: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radii.md,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
