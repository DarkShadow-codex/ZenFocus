// ============================================================================
// CHILD DEVICE SELECTOR COMPONENT
// Supports pairing and switching at least 5 child devices on one parent account
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radii } from '../theme';
import { ChildDevice } from '../types';

interface ChildDeviceSelectorProps {
  childDevices: ChildDevice[];
  selectedChildDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
  onPairDevicePress: () => void;
  themeMode: 'light' | 'dark';
}

export const ChildDeviceSelector: React.FC<ChildDeviceSelectorProps> = ({
  childDevices,
  selectedChildDeviceId,
  onSelectDevice,
  onPairDevicePress,
  themeMode,
}) => {
  const theme = Palette[themeMode];
  const selectedDevice =
    childDevices.find((d) => d.id === selectedChildDeviceId) || childDevices[0];

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <View style={styles.titleBadgeRow}>
            <Ionicons name="hardware-chip-outline" size={17} color={Palette.primary} />
            <Text style={[styles.title, { color: theme.textPrimary }]}>Paired Child Devices</Text>
            <View style={[styles.countBadge, { backgroundColor: Palette.primaryContainer }]}>
              <Text style={[styles.countText, { color: Palette.primary }]}>
                {childDevices.length} Connected
              </Text>
            </View>
          </View>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Viewing: <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{selectedDevice.childName}</Text> ({selectedDevice.deviceName} • {selectedDevice.platform === 'ios' ? 'Apple iOS' : 'Android DPC'})
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.pairBtn, { backgroundColor: Palette.primaryContainer, borderColor: Palette.secondary }]}
          onPress={onPairDevicePress}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={16} color={Palette.primary} />
          <Text style={[styles.pairBtnText, { color: Palette.primary }]}>+ Pair Child</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Carousel of Child Devices */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {childDevices.map((device) => {
          const isSelected = device.id === selectedChildDeviceId;
          const isIos = device.platform === 'ios';

          return (
            <TouchableOpacity
              key={device.id}
              style={[
                styles.deviceCard,
                {
                  backgroundColor: isSelected ? (isIos ? 'rgba(0, 122, 255, 0.08)' : 'rgba(81, 70, 229, 0.08)') : theme.surfaceSecondary,
                  borderColor: isSelected ? (isIos ? '#007aff' : Palette.primary) : theme.surfaceBorderSubtle,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => onSelectDevice(device.id)}
              activeOpacity={0.85}
            >
              {/* Top Row: Avatar & Status */}
              <View style={styles.cardTopRow}>
                <View
                  style={[
                    styles.platformAvatar,
                    { backgroundColor: isIos ? 'rgba(0, 122, 255, 0.15)' : 'rgba(53, 185, 138, 0.18)' },
                  ]}
                >
                  <Ionicons
                    name={isIos ? 'logo-apple' : 'logo-android'}
                    size={16}
                    color={isIos ? '#007aff' : '#2e9d73'}
                  />
                </View>

                <View style={styles.onlineBadge}>
                  <View style={[styles.onlineDot, { backgroundColor: device.isOnline ? Palette.success : theme.textMuted }]} />
                  <Text style={[styles.onlineText, { color: device.isOnline ? Palette.success : theme.textMuted }]}>
                    {device.isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>

              {/* Child & Device Name */}
              <Text style={[styles.childName, { color: theme.textPrimary }]} numberOfLines={1}>
                {device.childName}
              </Text>
              <Text style={[styles.deviceModel, { color: theme.textSecondary }]} numberOfLines={1}>
                {device.deviceName}
              </Text>

              {/* Status footer: Battery & Restrictions */}
              <View style={[styles.cardFooter, { borderTopColor: theme.surfaceBorderSubtle }]}>
                <View style={styles.statItem}>
                  <Ionicons name="battery-charging" size={13} color={Palette.success} />
                  <Text style={[styles.statText, { color: theme.textSecondary }]}>
                    {device.batteryLevel}%
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="shield-checkmark" size={13} color={isSelected ? Palette.primary : theme.textMuted} />
                  <Text style={[styles.statText, { color: theme.textSecondary }]}>
                    {device.activeRestrictionsCount ?? 0} rules
                  </Text>
                </View>
              </View>

              {isSelected && (
                <View style={[styles.activeIndicator, { backgroundColor: isIos ? '#007aff' : Palette.primary }]}>
                  <Ionicons name="checkmark-circle" size={12} color="#ffffff" />
                  <Text style={styles.activeIndicatorText}>Active Screen</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Quick Add Another Child Device Card */}
        <TouchableOpacity
          style={[styles.addCard, { borderColor: theme.surfaceBorder, backgroundColor: theme.surfaceSecondary }]}
          onPress={onPairDevicePress}
          activeOpacity={0.8}
        >
          <View style={[styles.addIconCircle, { backgroundColor: Palette.primaryContainer }]}>
            <Ionicons name="person-add-outline" size={20} color={Palette.primary} />
          </View>
          <Text style={[styles.addCardTitle, { color: theme.textPrimary }]}>Pair Child 6+</Text>
          <Text style={[styles.addCardSubtitle, { color: theme.textSecondary }]}>
            Connect another Android or iOS device
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: Radii.xl,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  titleCol: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  pairBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  pairBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollList: {
    gap: 12,
    paddingVertical: 4,
  },
  deviceCard: {
    width: 146,
    borderRadius: Radii.lg,
    padding: 12,
    justifyContent: 'space-between',
    position: 'relative',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  platformAvatar: {
    width: 28,
    height: 28,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: Radii.full,
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '600',
  },
  childName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  deviceModel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 10,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  activeIndicatorText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  addCard: {
    width: 130,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addIconCircle: {
    width: 34,
    height: 34,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  addCardSubtitle: {
    fontSize: 10,
    textAlign: 'center',
  },
});
