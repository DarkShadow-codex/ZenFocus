// ============================================================================
// IOS SCREEN TIME STATUS CARD COMPONENT
// Displays the status of Apple FamilyControls, ManagedSettings, and DeviceActivity
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radii } from '../theme';
import { IosScreenTimeCapabilities } from '../types';
import { ZenFocusIos } from '../native/ZenFocusIosBridge';

interface IosScreenTimeStatusCardProps {
  capabilities: IosScreenTimeCapabilities;
  themeMode: 'light' | 'dark';
  onRefresh?: () => void;
}

export const IosScreenTimeStatusCard: React.FC<IosScreenTimeStatusCardProps> = ({
  capabilities,
  themeMode,
  onRefresh,
}) => {
  const theme = Palette[themeMode];
  const [expanded, setExpanded] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const handleRequestAuth = async () => {
    setRequesting(true);
    try {
      const res = await ZenFocusIos.requestFamilyControlsAuthorization();
      Alert.alert(
        'Apple FamilyControls',
        res.familyControlsAuthorized
          ? 'FamilyControls authorization verified! Screen Time shields and schedules are active.'
          : 'Authorization was not completed. Please verify iCloud Family Sharing settings.'
      );
      if (onRefresh) onRefresh();
    } catch (e: any) {
      Alert.alert('Authorization Error', e.message);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.leftCol}>
          <View style={[styles.appleIconCircle, { backgroundColor: 'rgba(0, 122, 255, 0.12)' }]}>
            <Ionicons name="logo-apple" size={20} color="#007aff" />
          </View>
          <View>
            <View style={styles.titleWithBadge}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Apple Screen Time</Text>
              <View style={[styles.verifiedBadge, { backgroundColor: 'rgba(85, 214, 190, 0.15)' }]}>
                <Ionicons name="checkmark-circle" size={12} color={Palette.tertiary} />
                <Text style={[styles.verifiedText, { color: Palette.tertiary }]}>
                  {capabilities.familyControlsAuthorized ? 'Authorized' : 'Pending Auth'}
                </Text>
              </View>
            </View>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              FamilyControls • ManagedSettings • DeviceActivity
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.expandBtn}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Primary Capability Badges Grid */}
      <View style={styles.badgesGrid}>
        <View style={[styles.badgeItem, { backgroundColor: theme.surfaceSecondary }]}>
          <Ionicons
            name={capabilities.familyControlsAuthorized ? 'shield-checkmark' : 'shield-outline'}
            size={14}
            color={capabilities.familyControlsAuthorized ? Palette.tertiary : Palette.warning}
          />
          <Text style={[styles.badgeItemText, { color: theme.textPrimary }]}>
            FamilyControls: {capabilities.familyControlsAuthorized ? 'Active' : 'Unverified'}
          </Text>
        </View>

        <View style={[styles.badgeItem, { backgroundColor: theme.surfaceSecondary }]}>
          <Ionicons
            name={capabilities.managedSettingsShieldSupported ? 'layers' : 'layers-outline'}
            size={14}
            color={Palette.primary}
          />
          <Text style={[styles.badgeItemText, { color: theme.textPrimary }]}>
            ManagedSettings Shield
          </Text>
        </View>

        <View style={[styles.badgeItem, { backgroundColor: theme.surfaceSecondary }]}>
          <Ionicons
            name={capabilities.denyAppRemovalActive ? 'lock-closed' : 'lock-open-outline'}
            size={14}
            color={Palette.primary}
          />
          <Text style={[styles.badgeItemText, { color: theme.textPrimary }]}>
            {capabilities.denyAppRemovalActive ? 'Uninstall Blocked' : 'Removal Allowed'}
          </Text>
        </View>

        <View style={[styles.badgeItem, { backgroundColor: theme.surfaceSecondary }]}>
          <Ionicons name="time" size={14} color="#007aff" />
          <Text style={[styles.badgeItemText, { color: theme.textPrimary }]}>
            DeviceActivity Monitor
          </Text>
        </View>
      </View>

      {/* Expandable Technical Inspection Section */}
      {expanded && (
        <View style={[styles.expandedContent, { borderTopColor: theme.surfaceBorderSubtle }]}>
          <Text style={[styles.diagHeading, { color: theme.textSecondary }]}>
            iOS Screen Time Entitlement Verification
          </Text>

          <View style={styles.diagRow}>
            <Text style={[styles.diagKey, { color: theme.textSecondary }]}>Authorization Status:</Text>
            <Text style={[styles.diagVal, { color: capabilities.familyControlsAuthorized ? Palette.success : Palette.warning }]}>
              {capabilities.familyControlsAuthorized ? 'Approved (.approved)' : 'Awaiting Authorization'}
            </Text>
          </View>

          <View style={styles.diagRow}>
            <Text style={[styles.diagKey, { color: theme.textSecondary }]}>Shield Configuration:</Text>
            <Text style={[styles.diagVal, { color: Palette.primary }]}>
              ZenFocusShieldExtension (Active)
            </Text>
          </View>

          <View style={styles.diagRow}>
            <Text style={[styles.diagKey, { color: theme.textSecondary }]}>Background Monitor:</Text>
            <Text style={[styles.diagVal, { color: theme.textPrimary }]}>
              ZenFocusDeviceActivityMonitor
            </Text>
          </View>

          <View style={styles.diagRow}>
            <Text style={[styles.diagKey, { color: theme.textSecondary }]}>App Group Container:</Text>
            <Text style={[styles.diagVal, { color: theme.textPrimary }]}>
              group.com.zenfocus.app
            </Text>
          </View>

          <View style={styles.diagRow}>
            <Text style={[styles.diagKey, { color: theme.textSecondary }]}>OS Version:</Text>
            <Text style={[styles.diagVal, { color: theme.textPrimary }]}>{capabilities.osVersion}</Text>
          </View>

          {!capabilities.familyControlsAuthorized && (
            <TouchableOpacity
              style={[styles.btnAuth, { backgroundColor: '#007aff' }]}
              onPress={handleRequestAuth}
              disabled={requesting}
            >
              <Ionicons name="key-outline" size={16} color="#ffffff" />
              <Text style={styles.btnAuthText}>
                {requesting ? 'Requesting Authorization...' : 'Request FamilyControls Authorization'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radii.xl,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  appleIconCircle: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radii.full,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  expandBtn: {
    padding: 4,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
  },
  badgeItemText: {
    fontSize: 11,
    fontWeight: '500',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  diagHeading: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  diagKey: {
    fontSize: 12,
  },
  diagVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  btnAuth: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: Radii.md,
  },
  btnAuthText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
