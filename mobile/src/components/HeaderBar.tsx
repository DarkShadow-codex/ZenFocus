// ============================================================================
// ZENFOCUS HEADER BAR
// Role-Gated: Child account sees ONLY Child Dashboard. Parent account sees BOTH.
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radii } from '../theme';
import { UserAccount } from '../types';

interface HeaderBarProps {
  account: UserAccount | null;
  activeView: 'CHILD' | 'PARENT';
  onSwitchView: (view: 'CHILD' | 'PARENT') => void;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  onSignOut: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  account,
  activeView,
  onSwitchView,
  themeMode,
  onToggleTheme,
  onSignOut,
}) => {
  const theme = Palette[themeMode];
  const isParent = account?.role === 'PARENT';
  const isChild = account?.role === 'CHILD';

  const handleSignOutConfirm = () => {
    if (Platform.OS === 'web') {
      onSignOut();
      return;
    }
    Alert.alert(
      'Switch / Sign Out',
      `Are you sure you want to exit ${account?.name}'s account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: onSignOut },
      ]
    );
  };

  return (
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.surfaceBorder }]}>
      {/* Brand logo & title */}
      <View style={styles.brandRow}>
        <View style={styles.logoCircle}>
          <Ionicons name="infinite" size={18} color="#ffffff" />
        </View>
        <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>ZenFocus</Text>
      </View>

      {/* Role-Gated Middle Section */}
      {isParent && (
        // PARENT ACCOUNT: Both dashboards are accessible!
        <View style={[styles.roleSwitcher, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder }]}>
          <TouchableOpacity
            style={[styles.roleTab, activeView === 'PARENT' && [styles.roleTabActive, { backgroundColor: theme.surface }]]}
            onPress={() => onSwitchView('PARENT')}
          >
            <Text style={[styles.roleTabText, { color: activeView === 'PARENT' ? Palette.primary : theme.textSecondary }]}>
              🛡️ Parent Control
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, activeView === 'CHILD' && [styles.roleTabActive, { backgroundColor: theme.surface }]]}
            onPress={() => onSwitchView('CHILD')}
          >
            <Text style={[styles.roleTabText, { color: activeView === 'CHILD' ? Palette.primary : theme.textSecondary }]}>
              🧘 Child View
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isChild && (
        // CHILD ACCOUNT: Strictly Child Dashboard only! Switcher is hidden!
        <View style={[styles.studentBadge, { backgroundColor: 'rgba(169, 155, 255, 0.18)' }]}>
          <Ionicons name="school" size={13} color="#6350db" />
          <Text style={styles.studentBadgeText}>
            Student: {account?.name || 'Child'}
          </Text>
        </View>
      )}

      {/* Right Actions: Theme Toggle & Sign Out */}
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder }]}
          onPress={onToggleTheme}
          accessibilityLabel="Toggle Theme"
        >
          <Ionicons
            name={themeMode === 'light' ? 'moon-outline' : 'sunny-outline'}
            size={16}
            color={theme.textPrimary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder }]}
          onPress={handleSignOutConfirm}
          accessibilityLabel="Sign Out or Switch Account"
        >
          <Ionicons name="log-out-outline" size={16} color={Palette.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 30,
    height: 30,
    borderRadius: Radii.full,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  roleSwitcher: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: 2,
  },
  roleTab: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radii.sm,
  },
  roleTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  studentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radii.full,
  },
  studentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6350db',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
