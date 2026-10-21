// ============================================================================
// ZENFOCUS HEADER BAR
// - Top-left: ZenFocus brand alone
// - Top-right: Three dots menu button (Dark mode, Switch paired devices, Settings, Log out)
// - Sub-bar below (Parent account only): Parent Control | Child View switcher
// - Child account: Child view only, with matching clean top bar UI
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radii } from '../theme';
import { UserAccount, ChildDevice } from '../types';
import { useZenFocus } from '../store/ZenFocusContext';
import { SettingsModal } from './SettingsModal';
import { PairingModal } from './PairingModal';

interface HeaderBarProps {
  account: UserAccount | null;
  activeView: 'CHILD' | 'PARENT';
  onSwitchView: (view: 'CHILD' | 'PARENT') => void;
  activeParentTab?: 'DASHBOARD' | 'INSTA_SAVE';
  onSwitchParentTab?: (tab: 'DASHBOARD' | 'INSTA_SAVE') => void;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  onSignOut: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  account,
  activeView,
  onSwitchView,
  activeParentTab = 'DASHBOARD',
  onSwitchParentTab,
  themeMode,
  onToggleTheme,
  onSignOut,
}) => {
  const theme = Palette[themeMode];
  const {
    childDevices,
    selectedChildDeviceId,
    selectChildDevice,
    selectedChildDevice,
    activePairingCode,
    generatePairingCode,
  } = useZenFocus();

  const isParent = account?.role === 'PARENT';
  const isChild = account?.role === 'CHILD';

  // Three-dots menu dropdown modal
  const [menuVisible, setMenuVisible] = useState(false);
  // Full native settings modal
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  // Pairing modal
  const [pairingModalVisible, setPairingModalVisible] = useState(false);

  const handleSignOutConfirm = () => {
    setMenuVisible(false);
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
    <View style={[styles.wrapper, { backgroundColor: theme.surface, borderBottomColor: theme.surfaceBorder }]}>
      {/* 1. TOP HEADER ROW: ZenFocus alone on left, Three-dots on right */}
      <View style={styles.topRow}>
        {/* Brand Logo & Title Alone */}
        <View style={styles.brandContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>ZenFocus</Text>
        </View>

        {/* Three Dots Menu Button (⋮) Horizontally Aligned */}
        <TouchableOpacity
          style={[styles.threeDotsButton, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder }]}
          onPress={() => setMenuVisible(true)}
          accessibilityLabel="Open Menu and Settings"
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* 2. SUB-BAR: In Parent Account, placed just below the ZenFocus bar according to phone */}
      {isParent && (
        <View style={[styles.subBarContainer, { backgroundColor: theme.surface }]}>
          <View
            style={[
              styles.phoneSegmentContainer,
              { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorderSubtle },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.phoneSegmentTab,
                activeView === 'PARENT' && [styles.phoneSegmentTabActive, { backgroundColor: theme.surface }],
              ]}
              onPress={() => onSwitchView('PARENT')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="shield-checkmark"
                size={14}
                color={activeView === 'PARENT' ? Palette.primary : theme.textSecondary}
              />
              <Text
                style={[
                  styles.phoneSegmentText,
                  {
                    color: activeView === 'PARENT' ? Palette.primary : theme.textSecondary,
                    fontWeight: activeView === 'PARENT' ? '700' : '600',
                  },
                ]}
              >
                Parent Control
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.phoneSegmentTab,
                activeView === 'CHILD' && [styles.phoneSegmentTabActive, { backgroundColor: theme.surface }],
              ]}
              onPress={() => onSwitchView('CHILD')}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 13 }}>🧘</Text>
              <Text
                style={[
                  styles.phoneSegmentText,
                  {
                    color: activeView === 'CHILD' ? Palette.primary : theme.textSecondary,
                    fontWeight: activeView === 'CHILD' ? '700' : '600',
                  },
                ]}
              >
                Child View
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 3. THREE-DOTS CONTEXTUAL MENU MODAL */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity
          style={styles.menuBackdrop}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={[
              styles.menuDropdown,
              { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
            ]}
          >
            {/* Header / Account preview */}
            <View style={styles.menuHeader}>
              <View style={styles.menuAccountRow}>
                <View
                  style={[
                    styles.menuAvatar,
                    { backgroundColor: isParent ? Palette.primary : '#6350db' },
                  ]}
                >
                  <Text style={styles.menuAvatarText}>
                    {account?.name ? account.name.charAt(0).toUpperCase() : 'Z'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuAccountName, { color: theme.textPrimary }]} numberOfLines={1}>
                    {account?.name || 'ZenFocus User'}
                  </Text>
                  <Text style={[styles.menuAccountRole, { color: theme.textSecondary }]}>
                    {isParent ? '🛡️ Parent Guardian' : '🧘 Student Account'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.menuDivider, { backgroundColor: theme.surfaceBorderSubtle }]} />

            {/* Quick Option 1: Dark Mode Toggle */}
            <View style={styles.menuItemRow}>
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name={themeMode === 'dark' ? 'moon' : 'sunny'}
                  size={18}
                  color={Palette.primary}
                />
                <Text style={[styles.menuItemText, { color: theme.textPrimary }]}>Dark Mode</Text>
              </View>
              <Switch
                value={themeMode === 'dark'}
                onValueChange={onToggleTheme}
                trackColor={{ false: theme.surfaceBorder, true: Palette.primary }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Quick Option 2: Switch Paired Devices (Parent Only) */}
            {isParent && (
              <>
                <View style={[styles.menuDivider, { backgroundColor: theme.surfaceBorderSubtle }]} />
                <View style={styles.deviceSectionHeader}>
                  <Text style={[styles.deviceSectionTitle, { color: theme.textMuted }]}>
                    SWITCH PAIRED DEVICE ({childDevices.length})
                  </Text>
                </View>
                {childDevices.slice(0, 5).map((device) => {
                  const isSelected = device.id === selectedChildDeviceId;
                  const isIos = device.platform === 'ios';
                  return (
                    <TouchableOpacity
                      key={device.id}
                      style={[
                        styles.devicePickerRow,
                        isSelected && { backgroundColor: isIos ? 'rgba(0, 122, 255, 0.08)' : 'rgba(81, 70, 229, 0.08)' },
                      ]}
                      onPress={() => {
                        selectChildDevice(device.id);
                        setMenuVisible(false);
                      }}
                    >
                      <Ionicons
                        name={isIos ? 'logo-apple' : 'logo-android'}
                        size={15}
                        color={isIos ? '#007aff' : '#35b98a'}
                      />
                      <Text
                        style={[
                          styles.devicePickerName,
                          {
                            color: isSelected ? (isIos ? '#007aff' : Palette.primary) : theme.textPrimary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {device.childName} ({device.deviceName})
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={isIos ? '#007aff' : Palette.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={styles.pairNewRow}
                  onPress={() => {
                    setMenuVisible(false);
                    setPairingModalVisible(true);
                  }}
                >
                  <Ionicons name="add-circle-outline" size={16} color={Palette.primary} />
                  <Text style={[styles.pairNewText, { color: Palette.primary }]}>+ Pair Child Device</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={[styles.menuDivider, { backgroundColor: theme.surfaceBorderSubtle }]} />

            {/* Option 3: Full Settings Page */}
            <TouchableOpacity
              style={styles.menuActionBtn}
              onPress={() => {
                setMenuVisible(false);
                setSettingsModalVisible(true);
              }}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="settings-outline" size={18} color={theme.textPrimary} />
                <Text style={[styles.menuItemText, { color: theme.textPrimary }]}>Settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: theme.surfaceBorderSubtle }]} />

            {/* Option 4: Log Out */}
            <TouchableOpacity style={styles.menuActionBtn} onPress={handleSignOutConfirm}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="log-out-outline" size={18} color={Palette.error} />
                <Text style={[styles.menuItemText, { color: Palette.error, fontWeight: '700' }]}>
                  Log Out
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 4. COMPREHENSIVE SETTINGS MODAL */}
      <SettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        account={account}
        themeMode={themeMode}
        onToggleTheme={onToggleTheme}
        childDevices={childDevices}
        selectedChildDeviceId={selectedChildDeviceId}
        onSelectChildDevice={selectChildDevice}
        onOpenPairingModal={() => setPairingModalVisible(true)}
        onSignOut={onSignOut}
      />

      {/* 5. PAIRING INVITATION MODAL */}
      <PairingModal
        visible={pairingModalVisible}
        onClose={() => setPairingModalVisible(false)}
        pairingCode={activePairingCode || 'ZEN-8942'}
        onRegenerateCode={generatePairingCode}
        themeMode={themeMode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
  },
  topRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: Radii.sm,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  threeDotsButton: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 2,
  },
  phoneSegmentContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: 3,
  },
  phoneSegmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: Radii.md,
  },
  phoneSegmentTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  phoneSegmentText: {
    fontSize: 12,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingRight: 16,
  },
  menuDropdown: {
    width: 280,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuHeader: {
    paddingVertical: 4,
  },
  menuAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuAvatar: {
    width: 34,
    height: 34,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAvatarText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  menuAccountName: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuAccountRole: {
    fontSize: 11,
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    marginVertical: 8,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deviceSectionHeader: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  deviceSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  devicePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: Radii.md,
    marginVertical: 1,
  },
  devicePickerName: {
    fontSize: 12,
    flex: 1,
  },
  pairNewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  pairNewText: {
    fontSize: 12,
    fontWeight: '700',
  },
  menuActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
});
