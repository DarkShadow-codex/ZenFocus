// ============================================================================
// WELCOME & AUTHENTICATION SCREEN
// Supports:
// 1. "Sign In" for existing Parent and Student accounts
// 2. "Create Account" for new Parent and Student accounts
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
  onLoginAccount?: (nameOrEmail: string, role: UserRole, customName?: string) => Promise<void>;
  themeMode: 'light' | 'dark';
}

type AuthMode = 'SIGN_IN' | 'REGISTER_ROLE_CHOICE' | 'REGISTER_FORM';

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onRegisterAccount,
  onLoginAccount,
  themeMode,
}) => {
  const theme = Palette[themeMode];

  // Auth Modes: 'SIGN_IN' | 'REGISTER_ROLE_CHOICE' | 'REGISTER_FORM'
  const [authMode, setAuthMode] = useState<AuthMode>('SIGN_IN');
  const [selectedRole, setSelectedRole] = useState<UserRole>('PARENT');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pairingCode, setPairingCode] = useState('');

  // Sign In Form Fields
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInRole, setSignInRole] = useState<UserRole>('PARENT');

  const handleSelectRegisterRole = (role: UserRole) => {
    setSelectedRole(role);
    setAuthMode('REGISTER_FORM');
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

  const handleSignIn = async (overrideIdentifier?: string, overrideRole?: UserRole) => {
    const targetIdentifier = overrideIdentifier || signInIdentifier.trim();
    const targetRole = overrideRole || signInRole;

    if (!targetIdentifier) {
      Alert.alert('Required Field', 'Please enter your email or username to sign in.');
      return;
    }

    try {
      if (onLoginAccount) {
        await onLoginAccount(targetIdentifier, targetRole);
      } else {
        await onRegisterAccount(targetIdentifier, targetIdentifier, targetRole);
      }
    } catch (e: any) {
      Alert.alert('Sign In Error', e.message);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.canvas }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
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

          {/* Mode Switcher Tabs: Sign In vs Create Account */}
          <View style={[styles.authTabContainer, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder }]}>
            <TouchableOpacity
              style={[
                styles.authTab,
                authMode === 'SIGN_IN' && [styles.authTabActive, { backgroundColor: theme.surface }],
              ]}
              onPress={() => setAuthMode('SIGN_IN')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.authTabText,
                  { color: authMode === 'SIGN_IN' ? Palette.primary : theme.textSecondary, fontWeight: authMode === 'SIGN_IN' ? '700' : '500' },
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.authTab,
                authMode !== 'SIGN_IN' && [styles.authTabActive, { backgroundColor: theme.surface }],
              ]}
              onPress={() => setAuthMode('REGISTER_ROLE_CHOICE')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.authTabText,
                  { color: authMode !== 'SIGN_IN' ? Palette.primary : theme.textSecondary, fontWeight: authMode !== 'SIGN_IN' ? '700' : '500' },
                ]}
              >
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* ===============================================================
              MODE 1: SIGN IN (Account Already Exists)
              =============================================================== */}
          {authMode === 'SIGN_IN' && (
            <View style={[styles.popupCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <Text style={[styles.promptTitle, { color: theme.textPrimary }]}>
                Sign In to ZenFocus
              </Text>
              <Text style={[styles.promptDesc, { color: theme.textSecondary }]}>
                Welcome back! Sign in with your existing parent or student profile.
              </Text>

              {/* Role Picker for Sign In */}
              <View style={styles.rolePickerRow}>
                <TouchableOpacity
                  style={[
                    styles.rolePickBtn,
                    signInRole === 'PARENT' && [styles.rolePickBtnActive, { borderColor: Palette.primary, backgroundColor: Palette.primaryContainer }],
                  ]}
                  onPress={() => setSignInRole('PARENT')}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={16}
                    color={signInRole === 'PARENT' ? Palette.primary : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.rolePickText,
                      { color: signInRole === 'PARENT' ? Palette.primary : theme.textSecondary, fontWeight: signInRole === 'PARENT' ? '700' : '500' },
                    ]}
                  >
                    Parent
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.rolePickBtn,
                    signInRole === 'CHILD' && [styles.rolePickBtnActive, { borderColor: '#6350db', backgroundColor: 'rgba(99, 80, 219, 0.15)' }],
                  ]}
                  onPress={() => setSignInRole('CHILD')}
                >
                  <Ionicons
                    name="school"
                    size={16}
                    color={signInRole === 'CHILD' ? '#6350db' : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.rolePickText,
                      { color: signInRole === 'CHILD' ? '#6350db' : theme.textSecondary, fontWeight: signInRole === 'CHILD' ? '700' : '500' },
                    ]}
                  >
                    Child / Student
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Input: Email or Username */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Email or Username</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder, color: theme.textPrimary }]}
                  placeholder={signInRole === 'PARENT' ? 'e.g. shivram@example.com' : 'e.g. leo.student'}
                  placeholderTextColor={theme.textMuted}
                  value={signInIdentifier}
                  onChangeText={setSignInIdentifier}
                  autoCapitalize="none"
                />
              </View>

              {/* Input: Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Password</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder, color: theme.textPrimary }]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textMuted}
                  value={signInPassword}
                  onChangeText={setSignInPassword}
                  secureTextEntry
                />
              </View>

              {/* Submit Sign In */}
              <TouchableOpacity
                style={[styles.createAccountBtn, { backgroundColor: signInRole === 'PARENT' ? Palette.primary : '#6350db' }]}
                onPress={() => handleSignIn()}
              >
                <Text style={styles.createAccountBtnText}>
                  {signInRole === 'PARENT' ? 'Sign In as Parent' : 'Sign In as Student'}
                </Text>
              </TouchableOpacity>

              {/* Quick One-Tap Sign In Demo Buttons */}
              <View style={[styles.quickDemoDivider, { borderTopColor: theme.surfaceBorderSubtle }]}>
                <Text style={[styles.quickDemoTitle, { color: theme.textMuted }]}>
                  QUICK ONE-TAP DEMO SIGN IN
                </Text>
              </View>

              <View style={styles.quickDemoRow}>
                <TouchableOpacity
                  style={[styles.quickDemoBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder }]}
                  onPress={() => handleSignIn('Shivram', 'PARENT')}
                >
                  <Ionicons name="shield-checkmark" size={14} color={Palette.primary} />
                  <Text style={[styles.quickDemoBtnText, { color: theme.textPrimary }]}>
                    Parent: <Text style={{ fontWeight: '700' }}>Shivram</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickDemoBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder }]}
                  onPress={() => handleSignIn('Leo', 'CHILD')}
                >
                  <Ionicons name="school" size={14} color="#6350db" />
                  <Text style={[styles.quickDemoBtnText, { color: theme.textPrimary }]}>
                    Child: <Text style={{ fontWeight: '700' }}>Leo</Text>
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Switch to Register */}
              <TouchableOpacity
                style={styles.switchAuthModeBtn}
                onPress={() => setAuthMode('REGISTER_ROLE_CHOICE')}
              >
                <Text style={[styles.switchAuthModeText, { color: theme.textSecondary }]}>
                  Don't have an account? <Text style={{ color: Palette.primary, fontWeight: '700' }}>Create Account</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ===============================================================
              MODE 2 (STEP A): ROLE CHOICE FOR NEW ACCOUNT
              =============================================================== */}
          {authMode === 'REGISTER_ROLE_CHOICE' && (
            <View style={[styles.popupCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <Text style={[styles.promptTitle, { color: theme.textPrimary }]}>
                Create New Account
              </Text>
              <Text style={[styles.promptDesc, { color: theme.textSecondary }]}>
                Who is setting up this account?
              </Text>

              {/* Option 1: I am a Parent */}
              <TouchableOpacity
                style={[styles.roleOptionCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder }]}
                onPress={() => handleSelectRegisterRole('PARENT')}
              >
                <View style={[styles.roleIconCircle, { backgroundColor: Palette.primaryContainer }]}>
                  <Ionicons name="shield-checkmark" size={24} color={Palette.primary} />
                </View>
                <View style={styles.roleCardText}>
                  <Text style={[styles.roleCardTitle, { color: theme.textPrimary }]}>I am a Parent</Text>
                  <Text style={[styles.roleCardDesc, { color: theme.textSecondary }]}>
                    Create a fresh parent account. You can pair and manage your child devices.
                  </Text>
                  <Text style={[styles.roleCardFootnote, { color: Palette.primary }]}>
                    ✓ Only Pair Child Device option will be shown
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
              </TouchableOpacity>

              {/* Option 2: I am a Child */}
              <TouchableOpacity
                style={[styles.roleOptionCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder }]}
                onPress={() => handleSelectRegisterRole('CHILD')}
              >
                <View style={[styles.roleIconCircle, { backgroundColor: 'rgba(169, 155, 255, 0.25)' }]}>
                  <Ionicons name="school" size={24} color="#6350db" />
                </View>
                <View style={styles.roleCardText}>
                  <Text style={[styles.roleCardTitle, { color: theme.textPrimary }]}>I am a Child</Text>
                  <Text style={[styles.roleCardDesc, { color: theme.textSecondary }]}>
                    Set up your student focus profile and pair with your parent's rules.
                  </Text>
                  <Text style={[styles.roleCardFootnote, { color: '#6350db' }]}>
                    ✓ Child focus view only (Account by your name)
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
              </TouchableOpacity>

              {/* Switch to Sign In */}
              <TouchableOpacity
                style={styles.switchAuthModeBtn}
                onPress={() => setAuthMode('SIGN_IN')}
              >
                <Text style={[styles.switchAuthModeText, { color: theme.textSecondary }]}>
                  Already have an account? <Text style={{ color: Palette.primary, fontWeight: '700' }}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ===============================================================
              MODE 2 (STEP B): CREATE ACCOUNT FORM
              =============================================================== */}
          {authMode === 'REGISTER_FORM' && (
            <View style={[styles.popupCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              {/* Back Row */}
              <TouchableOpacity style={styles.backRow} onPress={() => setAuthMode('REGISTER_ROLE_CHOICE')}>
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
                    {selectedRole === 'PARENT' ? 'New Parent Account' : 'New Student Account'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.promptTitle, { color: theme.textPrimary, marginTop: 4 }]}>
                {selectedRole === 'PARENT' ? 'Create Parent Account' : 'Create Student Account'}
              </Text>
              <Text style={[styles.promptDesc, { color: theme.textSecondary }]}>
                {selectedRole === 'PARENT'
                  ? 'Your account is identified by your name. You can pair child devices next.'
                  : 'Your student account is identified by your name. No device hardware name required.'}
              </Text>

              {/* Input: Full Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Your Name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder, color: theme.textPrimary }]}
                  placeholder={selectedRole === 'PARENT' ? 'e.g. Shivram' : 'e.g. Leo'}
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
                    placeholder="e.g. ZEN-8942"
                    placeholderTextColor={theme.textMuted}
                    value={pairingCode}
                    onChangeText={setPairingCode}
                    autoCapitalize="characters"
                  />
                  <Text style={[styles.inputHelp, { color: theme.textMuted }]}>
                    Enter the code provided by your parent to link your profile.
                  </Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.createAccountBtn, { backgroundColor: selectedRole === 'PARENT' ? Palette.primary : '#6350db' }]}
                onPress={handleCreateAccount}
              >
                <Text style={styles.createAccountBtnText}>
                  {selectedRole === 'PARENT' ? 'Create Parent Account & Enter' : 'Create Student Account & Enter'}
                </Text>
              </TouchableOpacity>

              {/* Switch to Sign In */}
              <TouchableOpacity
                style={styles.switchAuthModeBtn}
                onPress={() => setAuthMode('SIGN_IN')}
              >
                <Text style={[styles.switchAuthModeText, { color: theme.textSecondary }]}>
                  Already have an account? <Text style={{ color: Palette.primary, fontWeight: '700' }}>Sign In</Text>
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
    marginBottom: 16,
  },
  heroLogoImage: {
    width: 72,
    height: 72,
    borderRadius: Radii.lg,
    marginBottom: 10,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
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
  authTabContainer: {
    flexDirection: 'row',
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: 3,
    marginBottom: 16,
  },
  authTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
  },
  authTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  authTabText: {
    fontSize: 13,
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
    marginBottom: 18,
    lineHeight: 18,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  rolePickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rolePickBtnActive: {
    borderWidth: 1.5,
  },
  rolePickText: {
    fontSize: 12,
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
    paddingVertical: 13,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
  quickDemoDivider: {
    borderTopWidth: 1,
    marginTop: 18,
    paddingTop: 12,
    alignItems: 'center',
  },
  quickDemoTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  quickDemoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickDemoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  quickDemoBtnText: {
    fontSize: 12,
  },
  switchAuthModeBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchAuthModeText: {
    fontSize: 13,
  },
});
