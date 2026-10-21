// ============================================================================
// WELCOME & ACCOUNT REGISTRATION SCREEN
// First-launch pop-up for role choice + account creation flow
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radii } from '../theme';
import { UserRole } from '../types';

interface WelcomeScreenProps {
  onRegisterAccount: (name: string, email: string, role: UserRole, pairingCode?: string) => Promise<void>;
  themeMode: 'light' | 'dark';
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onRegisterAccount, themeMode }) => {
  const theme = Palette[themeMode];

  // Step 1: 'ROLE_CHOICE' | Step 2: 'CREATE_ACCOUNT'
  const [step, setStep] = useState<'ROLE_CHOICE' | 'CREATE_ACCOUNT'>('ROLE_CHOICE');
  const [selectedRole, setSelectedRole] = useState<UserRole>('CHILD');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pairingCode, setPairingCode] = useState('');

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setStep('CREATE_ACCOUNT');
  };

  const handleCreateAccount = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your name.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Required Field', 'Please enter your email or username.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Required Field', 'Please enter a password.');
      return;
    }

    try {
      await onRegisterAccount(name.trim(), email.trim(), selectedRole, pairingCode.trim() || undefined);
    } catch (e: any) {
      Alert.alert('Registration Error', e.message);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.canvas }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Brand Header */}
          <View style={styles.brandHero}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.heroLogoImage}
              resizeMode="contain"
            />
            <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>ZenFocus</Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Study Focus & Parental Control Ecosystem
            </Text>
          </View>

          {/* ===============================================================
              STEP 1: FIRST-TIME POP-UP / ROLE SELECTION
              =============================================================== */}
          {step === 'ROLE_CHOICE' && (
            <View style={[styles.popupCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <Text style={[styles.promptTitle, { color: theme.textPrimary }]}>
                Welcome! Who is using this device?
              </Text>
              <Text style={[styles.promptDesc, { color: theme.textSecondary }]}>
                Select your account role to configure the correct device controls.
              </Text>

              {/* Option 1: I am a Parent */}
              <TouchableOpacity
                style={[styles.roleOptionCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder }]}
                onPress={() => handleSelectRole('PARENT')}
              >
                <View style={[styles.roleIconCircle, { backgroundColor: Palette.primaryContainer }]}>
                  <Ionicons name="shield-checkmark" size={24} color={Palette.primary} />
                </View>
                <View style={styles.roleCardText}>
                  <Text style={[styles.roleCardTitle, { color: theme.textPrimary }]}>I am a Parent</Text>
                  <Text style={[styles.roleCardDesc, { color: theme.textSecondary }]}>
                    Set app restrictions, receive exception requests, and verify device-level enforcement.
                  </Text>
                  <Text style={[styles.roleCardFootnote, { color: Palette.primary }]}>
                    ✓ Access to both Parent Control & Child Preview
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
              </TouchableOpacity>

              {/* Option 2: I am a Child */}
              <TouchableOpacity
                style={[styles.roleOptionCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder }]}
                onPress={() => handleSelectRole('CHILD')}
              >
                <View style={[styles.roleIconCircle, { backgroundColor: 'rgba(169, 155, 255, 0.25)' }]}>
                  <Ionicons name="school" size={24} color="#6350db" />
                </View>
                <View style={styles.roleCardText}>
                  <Text style={[styles.roleCardTitle, { color: theme.textPrimary }]}>I am a Child</Text>
                  <Text style={[styles.roleCardDesc, { color: theme.textSecondary }]}>
                    Start focus sessions with the Zen Ring, block personal distractions, and request study time.
                  </Text>
                  <Text style={[styles.roleCardFootnote, { color: '#6350db' }]}>
                    ✓ Dedicated Student Focus Dashboard
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
              </TouchableOpacity>

              {/* Privacy Footer */}
              <View style={styles.privacyNote}>
                <Ionicons name="lock-closed-outline" size={13} color={theme.textMuted} />
                <Text style={[styles.privacyText, { color: theme.textMuted }]}>
                  Privacy First: ZenFocus never monitors private messages or notification contents.
                </Text>
              </View>
            </View>
          )}

          {/* ===============================================================
              STEP 2: CREATE ACCOUNT FORM
              =============================================================== */}
          {step === 'CREATE_ACCOUNT' && (
            <View style={[styles.popupCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              
              {/* Back Row */}
              <TouchableOpacity style={styles.backRow} onPress={() => setStep('ROLE_CHOICE')}>
                <Ionicons name="arrow-back" size={18} color={Palette.primary} />
                <Text style={[styles.backText, { color: Palette.primary }]}>Change Role</Text>
              </TouchableOpacity>

              {/* Account Role Banner */}
              <View style={styles.roleBanner}>
                <View
                  style={[
                    styles.roleBadge,
                    { backgroundColor: selectedRole === 'PARENT' ? Palette.primaryContainer : 'rgba(169, 155, 255, 0.2)' },
                  ]}
                >
                  <Ionicons
                    name={selectedRole === 'PARENT' ? 'shield-checkmark' : 'school'}
                    size={16}
                    color={selectedRole === 'PARENT' ? Palette.primary : '#6350db'}
                  />
                  <Text
                    style={[
                      styles.roleBadgeText,
                      { color: selectedRole === 'PARENT' ? Palette.primary : '#6350db' },
                    ]}
                  >
                    {selectedRole === 'PARENT' ? 'Parent Account Setup' : 'Child Student Account Setup'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.promptTitle, { color: theme.textPrimary, marginTop: 4 }]}>
                {selectedRole === 'PARENT' ? 'Create Parent Account' : 'Create Student Account'}
              </Text>
              <Text style={[styles.promptDesc, { color: theme.textSecondary }]}>
                {selectedRole === 'PARENT'
                  ? 'Manage household study rules and approve exception requests.'
                  : 'Start focused study sessions with tamper-proof parent protection.'}
              </Text>

              {/* Input: Full Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Full Name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder, color: theme.textPrimary }]}
                  placeholder={selectedRole === 'PARENT' ? 'e.g. Sarah Miller' : 'e.g. Leo Miller'}
                  placeholderTextColor={theme.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              {/* Input: Email or Username */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Email or Username</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder, color: theme.textPrimary }]}
                  placeholder={selectedRole === 'PARENT' ? 'parent@example.com' : 'leo.student@example.com'}
                  placeholderTextColor={theme.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Input: Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Password</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder, color: theme.textPrimary }]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {/* Optional: Pairing Code for Child */}
              {selectedRole === 'CHILD' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                    Family Pairing Code <Text style={{ fontWeight: '400', color: theme.textMuted }}>(Optional)</Text>
                  </Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder, color: theme.textPrimary }]}
                    placeholder="e.g. ZEN-7492"
                    placeholderTextColor={theme.textMuted}
                    value={pairingCode}
                    onChangeText={setPairingCode}
                    autoCapitalize="characters"
                  />
                  <Text style={[styles.inputHelp, { color: theme.textMuted }]}>
                    Enter the code provided by your parent to link your device.
                  </Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.createAccountBtn, { backgroundColor: Palette.primary }]}
                onPress={handleCreateAccount}
              >
                <Text style={styles.createAccountBtnText}>
                  {selectedRole === 'PARENT' ? 'Create Parent Account & Enter' : 'Create Student Account & Enter'}
                </Text>
              </TouchableOpacity>

            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroLogoImage: {
    width: 80,
    height: 80,
    borderRadius: Radii.lg,
    marginBottom: 12,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  heroIconBox: {
    width: 60,
    height: 60,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },
  popupCard: {
    borderWidth: 1,
    borderRadius: Radii.xl,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  promptDesc: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  roleOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  roleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardText: {
    flex: 1,
  },
  roleCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  roleCardDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  roleCardFootnote: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  privacyText: {
    fontSize: 11,
    textAlign: 'center',
    flex: 1,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
  },
  roleBanner: {
    alignItems: 'center',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.full,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  inputHelp: {
    fontSize: 11,
    marginTop: 4,
  },
  createAccountBtn: {
    paddingVertical: 14,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createAccountBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
