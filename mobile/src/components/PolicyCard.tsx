// ============================================================================
// POLICY CARD COMPONENT (Derived from PRD.md Section 7.4 - 7.5)
// Enforces the Immutable Ownership Model: Parent-owned rules cannot be removed by Child
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radii } from '../theme';
import { RestrictionPolicy, UserRole } from '../types';

interface PolicyCardProps {
  policy: RestrictionPolicy;
  viewerRole: UserRole;
  themeMode: 'light' | 'dark';
  onToggle: (newState: boolean) => void;
  onRequestException?: () => void;
  onPress?: () => void;
}

export const PolicyCard: React.FC<PolicyCardProps> = ({
  policy,
  viewerRole,
  themeMode,
  onToggle,
  onRequestException,
  onPress,
}) => {
  const theme = Palette[themeMode];
  const isParentOwned = policy.ownerType === 'parent';
  const isActive = policy.desiredState === 'active';

  // Can the current viewer toggle this policy?
  // Only Parents can toggle PARENT-owned policies.
  // Children can only toggle CHILD-owned policies.
  const canModify = viewerRole === 'PARENT' ? isParentOwned : !isParentOwned;

  const CardContent = (
    <View style={styles.leftCol}>
      {/* App Icon */}
      <View style={[styles.appIcon, { backgroundColor: policy.iconBg }]}>
        <Text style={styles.appIconText}>{policy.appIcon}</Text>
      </View>

      {/* App details */}
      <View style={styles.details}>
        <View style={styles.nameRow}>
          <Text style={[styles.appName, { color: theme.textPrimary }]}>{policy.appName}</Text>
          {isParentOwned ? (
            <View style={[styles.badge, styles.badgeParent]}>
              <Ionicons name="lock-closed" size={10} color={Palette.primary} />
              <Text style={styles.badgeParentText}>Parent Locked</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.badgeChild]}>
              <Ionicons name="person" size={10} color="#6350db" />
              <Text style={styles.badgeChildText}>My Study Rule</Text>
            </View>
          )}
        </View>

        <Text style={[styles.packageName, { color: theme.textSecondary }]}>
          {policy.targetPackage}
        </Text>

        {policy.scheduleDescription && (
          <Text style={[styles.scheduleText, { color: theme.textMuted }]}>
            {policy.scheduleDescription}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
      {onPress ? (
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.7} onPress={onPress}>
          {CardContent}
        </TouchableOpacity>
      ) : (
        CardContent
      )}

      {/* Right Action: Switch or Request button */}
      <View style={styles.rightCol}>
        {canModify ? (
          <Switch
            value={isActive}
            onValueChange={onToggle}
            trackColor={{ false: theme.surfaceBorder, true: Palette.primary }}
            thumbColor="#ffffff"
          />
        ) : (
          <TouchableOpacity
            style={[styles.requestBtn, { backgroundColor: Palette.primaryContainer }]}
            onPress={onRequestException}
          >
            <Ionicons name="help-buoy-outline" size={14} color={Palette.primary} />
            <Text style={styles.requestBtnText}>Request</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: 10,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: {
    fontSize: 20,
  },
  details: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  appName: {
    fontSize: 15,
    fontWeight: '700',
  },
  packageName: {
    fontSize: 11,
    marginTop: 2,
  },
  scheduleText: {
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radii.full,
  },
  badgeParent: {
    backgroundColor: 'rgba(81, 70, 229, 0.12)',
  },
  badgeParentText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.primary,
    textTransform: 'uppercase',
  },
  badgeChild: {
    backgroundColor: 'rgba(169, 155, 255, 0.2)',
  },
  badgeChildText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6350db',
    textTransform: 'uppercase',
  },
  rightCol: {
    marginLeft: 8,
  },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radii.md,
  },
  requestBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.primary,
  },
});
