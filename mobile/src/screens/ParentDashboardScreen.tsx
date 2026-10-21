// ============================================================================
// PARENT DASHBOARD SCREEN (Parent Guardian Portal)
// Derived from PRD.md Section 7.4 & 7.8, app_flow.md Section 4 & 7
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useZenFocus } from '../store/ZenFocusContext';
import { Palette, Radii } from '../theme';
import { PolicyCard } from '../components/PolicyCard';
import { DeviceStatusCard } from '../components/DeviceStatusCard';
import { IosScreenTimeStatusCard } from '../components/IosScreenTimeStatusCard';
import { ChildDeviceSelector } from '../components/ChildDeviceSelector';
import { PairingModal } from '../components/PairingModal';
import { AddRestrictionModal } from '../components/AddRestrictionModal';
import { IosActivityPickerModal } from '../components/IosActivityPickerModal';
import { AppScannerModal } from '../components/AppScannerModal';

export const ParentDashboardScreen: React.FC = () => {
  const {
    themeMode,
    policies,
    toggleParentPolicy,
    addParentPolicy,
    approvalRequests,
    decideApprovalRequest,
    auditEvents,
    capabilities,
    activePlatform,
    setActivePlatform,
    schedules,
    toggleSchedule,
    activePairingCode,
    generatePairingCode,
    childDevices,
    selectedChildDeviceId,
    selectChildDevice,
    selectedChildDevice,
    toggleAppRestrictionForChild,
    iosCapabilities,
    androidCapabilities,
    requestIosAuthorization,
  } = useZenFocus();

  const theme = Palette[themeMode];
  const [pairingModalVisible, setPairingModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [iosPickerVisible, setIosPickerVisible] = useState(false);
  const [appScannerVisible, setAppScannerVisible] = useState(false);
  const [autoSavedNotice, setAutoSavedNotice] = useState<string | null>(null);

  const isIos = selectedChildDevice.platform === 'ios';

  const childSpecificPolicies = policies.filter(
    (p) => p.ownerType === 'parent' && p.targetDeviceId === selectedChildDeviceId
  );
  const parentPolicies =
    childSpecificPolicies.length > 0
      ? childSpecificPolicies
      : policies.filter((p) => p.ownerType === 'parent');

  const pendingRequests = approvalRequests.filter((r) => r.status === 'pending');

  const handleToggle = async (policyId: string, currentState: 'active' | 'inactive') => {
    const nextState = currentState === 'active' ? 'inactive' : 'active';
    try {
      const receipt = await toggleParentPolicy(policyId, nextState);
      const notice = `${nextState === 'active' ? 'Blocked' : 'Allowed'} on ${selectedChildDevice.childName}'s device (auto-saved)`;
      setAutoSavedNotice(notice);
      setTimeout(() => setAutoSavedNotice(null), 3000);
    } catch (e: any) {
      Alert.alert('Command Error', e.message);
    }
  };

  // Preloaded popular apps for instant 1-tap toggling
  const androidQuickApps = [
    { targetPackage: 'com.zhiliaoapp.musically', appName: 'TikTok', appCategory: 'Social' as const, appIcon: '🎵', iconBg: '#ff0050' },
    { targetPackage: 'com.instagram.android', appName: 'Instagram', appCategory: 'Social' as const, appIcon: '📷', iconBg: '#e1306c' },
    { targetPackage: 'com.google.android.youtube', appName: 'YouTube', appCategory: 'Entertainment' as const, appIcon: '▶', iconBg: '#ff0000' },
    { targetPackage: 'com.roblox.client', appName: 'Roblox', appCategory: 'Gaming' as const, appIcon: '🎮', iconBg: '#e2231a' },
    { targetPackage: 'com.snapchat.android', appName: 'Snapchat', appCategory: 'Social' as const, appIcon: '👻', iconBg: '#f0df00' },
    { targetPackage: 'com.discord', appName: 'Discord', appCategory: 'Social' as const, appIcon: '💬', iconBg: '#5865f2' },
  ];

  const iosQuickApps = [
    { targetPackage: 'com.zhiliaoapp.musically.ios', appName: 'TikTok', appCategory: 'Social' as const, appIcon: '🎵', iconBg: '#ff0050' },
    { targetPackage: 'com.burbn.instagram', appName: 'Instagram', appCategory: 'Social' as const, appIcon: '📷', iconBg: '#e1306c' },
    { targetPackage: 'com.google.ios.youtube', appName: 'YouTube', appCategory: 'Entertainment' as const, appIcon: '▶', iconBg: '#ff0000' },
    { targetPackage: 'com.roblox.robloxmobile', appName: 'Roblox', appCategory: 'Gaming' as const, appIcon: '🎮', iconBg: '#e2231a' },
    { targetPackage: 'com.toyopagroup.picaboo', appName: 'Snapchat', appCategory: 'Social' as const, appIcon: '👻', iconBg: '#f0df00' },
    { targetPackage: 'com.hammerandchisel.discord', appName: 'Discord', appCategory: 'Social' as const, appIcon: '💬', iconBg: '#5865f2' },
  ];

  const quickApps = isIos ? iosQuickApps : androidQuickApps;

  const isAppBlocked = (pkg: string) => {
    const policy = policies.find(
      (p) => p.targetDeviceId === selectedChildDeviceId && p.targetPackage === pkg && p.ownerType === 'parent'
    );
    return policy ? policy.desiredState === 'active' : false;
  };

  const handleQuickAppToggle = async (app: typeof quickApps[0], currentlyBlocked: boolean) => {
    const nextBlocked = !currentlyBlocked;
    await toggleAppRestrictionForChild(
      selectedChildDeviceId,
      app.targetPackage,
      app.appName,
      app.appCategory,
      app.appIcon,
      app.iconBg,
      nextBlocked
    );
    const notice = `${app.appName} ${nextBlocked ? 'Blocked' : 'Allowed'} on ${selectedChildDevice.childName}'s device (auto-saved)`;
    setAutoSavedNotice(notice);
    setTimeout(() => setAutoSavedNotice(null), 3000);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.canvas }]} contentContainerStyle={styles.content}>
      
      {/* 5+ Paired Child Device Carousel Selector */}
      <ChildDeviceSelector
        childDevices={childDevices}
        selectedChildDeviceId={selectedChildDeviceId}
        onSelectDevice={selectChildDevice}
        onPairDevicePress={() => setPairingModalVisible(true)}
        themeMode={themeMode}
      />

      {/* STRICT PLATFORM SCREEN: Only iOS screen if child is iOS, only Android screen if child is Android */}
      {isIos ? (
        <IosScreenTimeStatusCard
          capabilities={iosCapabilities}
          themeMode={themeMode}
          onRefresh={requestIosAuthorization}
        />
      ) : (
        <DeviceStatusCard
          capabilities={androidCapabilities}
          themeMode={themeMode}
          activePlatform="android"
        />
      )}

      {/* Quick Action Buttons (Tailored to child's platform) */}
      <View style={styles.quickActionRow}>
        <TouchableOpacity
          style={[
            styles.quickBtn,
            {
              backgroundColor: isIos ? 'rgba(0,122,255,0.12)' : 'rgba(46,125,50,0.12)',
              borderColor: isIos ? '#007aff' : '#2e7d32',
            },
          ]}
          onPress={() => setAppScannerVisible(true)}
          testID="scan-child-apps-btn"
        >
          <Ionicons
            name="search-circle"
            size={18}
            color={isIos ? '#007aff' : '#2e7d32'}
          />
          <Text
            style={[
              styles.quickBtnText,
              { color: isIos ? '#007aff' : '#2e7d32', fontWeight: '700' },
            ]}
          >
            Scan Apps
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
          onPress={() => setPairingModalVisible(true)}
        >
          <Ionicons name="link-outline" size={18} color={Palette.primary} />
          <Text style={[styles.quickBtnText, { color: theme.textPrimary }]}>Pair Device</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickBtn,
            { backgroundColor: isIos ? '#007aff' : Palette.primary, borderColor: isIos ? '#007aff' : Palette.primary },
          ]}
          onPress={() => {
            if (isIos) {
              setIosPickerVisible(true);
            } else {
              setAddModalVisible(true);
            }
          }}
        >
          <Ionicons
            name={isIos ? 'apps-outline' : 'add-circle-outline'}
            size={18}
            color="#ffffff"
          />
          <Text style={[styles.quickBtnText, { color: '#ffffff' }]}>
            {isIos ? '+ Activities' : '+ Add Rule'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Approval Requests Inbox */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="mail-unread-outline" size={20} color={Palette.primary} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Approval Inbox</Text>
          </View>
          <View style={[styles.countBadge, { backgroundColor: pendingRequests.length > 0 ? Palette.warningBg : theme.surfaceSecondary }]}>
            <Text style={[styles.countBadgeText, { color: pendingRequests.length > 0 ? '#b87708' : theme.textSecondary }]}>
              {pendingRequests.length} Pending
            </Text>
          </View>
        </View>

        {pendingRequests.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="checkmark-done-circle-outline" size={30} color={Palette.success} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              All requests resolved. No pending student requests.
            </Text>
          </View>
        ) : (
          pendingRequests.map((req) => (
            <View key={req.id} style={[styles.requestItem, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder }]}>
              <View style={styles.reqTopRow}>
                <Text style={[styles.reqChildName, { color: theme.textPrimary }]}>
                  {req.childName} requested {req.durationMinutes}m for {req.appName}
                </Text>
                <Text style={[styles.reqTime, { color: theme.textMuted }]}>Just now</Text>
              </View>

              <View style={[styles.reasonBox, { backgroundColor: theme.surface, borderColor: theme.surfaceBorderSubtle }]}>
                <Text style={[styles.reasonText, { color: theme.textPrimary }]}>
                  "{req.reason}"
                </Text>
              </View>

              <View style={styles.reqActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => decideApprovalRequest(req.id, true)}
                >
                  <Ionicons name="checkmark" size={16} color={Palette.onTertiary} />
                  <Text style={styles.approveBtnText}>Approve +{req.durationMinutes}m</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn, { borderColor: theme.surfaceBorder }]}
                  onPress={() => decideApprovalRequest(req.id, false)}
                >
                  <Ionicons name="close" size={16} color={Palette.error} />
                  <Text style={[styles.rejectBtnText, { color: Palette.error }]}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Real-time Auto-Save Notification */}
      {autoSavedNotice && (
        <View style={[styles.autoSavedNoticeBanner, { backgroundColor: 'rgba(53, 185, 138, 0.12)', borderColor: Palette.success }]}>
          <Ionicons name="checkmark-circle" size={16} color={Palette.success} />
          <Text style={[styles.autoSavedNoticeText, { color: Palette.success }]}>
            {autoSavedNotice}
          </Text>
        </View>
      )}

      {/* Parental Restriction Rules Section for Selected Child */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            App Restrictions ({selectedChildDevice.childName}'s {selectedChildDevice.deviceName})
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity
              style={[
                styles.pillBadge,
                {
                  backgroundColor: isIos ? 'rgba(0,122,255,0.15)' : 'rgba(46,125,50,0.15)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 8,
                },
              ]}
              onPress={() => setAppScannerVisible(true)}
              testID="scan-apps-header-btn"
            >
              <Ionicons
                name="search"
                size={12}
                color={isIos ? '#007aff' : '#2e7d32'}
              />
              <Text
                style={[
                  styles.pillBadgeText,
                  { color: isIos ? '#007aff' : '#2e7d32', fontWeight: '700' },
                ]}
              >
                Scan Apps
              </Text>
            </TouchableOpacity>
            <View style={[styles.pillBadge, { backgroundColor: 'rgba(85, 214, 190, 0.15)' }]}>
              <Text style={[styles.pillBadgeText, { color: Palette.tertiary }]}>Auto-Saved</Text>
            </View>
          </View>
        </View>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          Enforced via {isIos ? 'Apple Screen Time & ManagedSettings' : 'Android Device Policy Controller'}. Toggles save and sync immediately.
        </Text>
      </View>

      {/* Active Rules for This Child */}
      {parentPolicies.map((policy) => (
        <PolicyCard
          key={policy.id}
          policy={policy}
          viewerRole="PARENT"
          themeMode={themeMode}
          onToggle={() => handleToggle(policy.id, policy.desiredState)}
        />
      ))}

      {/* Quick App Toggles (Auto-saves immediately to this child's device) */}
      <View style={[styles.quickAppsCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
        <View style={styles.quickAppsHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="apps" size={16} color={Palette.primary} />
            <Text style={[styles.quickAppsTitle, { color: theme.textPrimary }]}>
              Quick App Controls ({selectedChildDevice.childName})
            </Text>
          </View>
          <Text style={[styles.quickAppsSub, { color: theme.textMuted }]}>
            1-Tap Auto-Save
          </Text>
        </View>

        <View style={styles.quickAppsGrid}>
          {quickApps.map((app) => {
            const blocked = isAppBlocked(app.targetPackage);
            return (
              <View
                key={app.targetPackage}
                style={[
                  styles.quickAppItem,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderColor: blocked ? (isIos ? 'rgba(0, 122, 255, 0.4)' : 'rgba(81, 70, 229, 0.4)') : theme.surfaceBorderSubtle,
                  },
                ]}
              >
                <View style={[styles.quickAppIconBox, { backgroundColor: app.iconBg }]}>
                  <Text style={{ fontSize: 16 }}>{app.appIcon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.quickAppName, { color: theme.textPrimary }]} numberOfLines={1}>
                    {app.appName}
                  </Text>
                  <Text
                    style={[
                      styles.quickAppStatus,
                      { color: blocked ? Palette.error : Palette.success },
                    ]}
                  >
                    {blocked ? 'Blocked' : 'Allowed'}
                  </Text>
                </View>
                <Switch
                  value={blocked}
                  onValueChange={() => handleQuickAppToggle(app, blocked)}
                  trackColor={{
                    false: theme.surfaceBorder,
                    true: isIos ? '#007aff' : Palette.primary,
                  }}
                  thumbColor="#ffffff"
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* Scheduled Focus & Downtime Windows */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder, marginTop: 16 }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="calendar-outline" size={18} color={Palette.primary} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Scheduled Restrictions</Text>
          </View>
          <Text style={[styles.countBadgeText, { color: theme.textMuted }]}>Auto-Enforced</Text>
        </View>

        {schedules.map((sch) => (
          <View key={sch.id} style={[styles.scheduleItem, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.scheduleTitleRow}>
                <Text style={[styles.scheduleName, { color: theme.textPrimary }]}>{sch.name}</Text>
                <View style={[styles.schedulePill, { backgroundColor: 'rgba(81, 70, 229, 0.1)' }]}>
                  <Text style={[styles.schedulePillText, { color: Palette.primary }]}>{sch.days.join(', ')}</Text>
                </View>
              </View>
              <Text style={[styles.scheduleTime, { color: theme.textSecondary }]}>
                {sch.startTime} – {sch.endTime}
              </Text>
            </View>
            <Switch
              value={sch.active}
              onValueChange={(val) => toggleSchedule(sch.id, val)}
              trackColor={{ false: theme.surfaceBorder, true: Palette.primary }}
              thumbColor="#ffffff"
            />
          </View>
        ))}
      </View>

      {/* Security & Audit Trail */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder, marginTop: 12 }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="shield-outline" size={18} color={Palette.primary} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Security & Audit Events</Text>
          </View>
          <Text style={[styles.countBadgeText, { color: theme.textMuted }]}>Append-Only</Text>
        </View>

        {auditEvents.slice(0, 4).map((evt) => (
          <View key={evt.id} style={[styles.auditRow, { borderBottomColor: theme.surfaceBorderSubtle }]}>
            <View style={styles.auditIconCol}>
              <View style={[styles.auditDot, { backgroundColor: Palette.primary }]} />
            </View>
            <View style={styles.auditDetails}>
              <Text style={[styles.auditDesc, { color: theme.textPrimary }]}>{evt.description}</Text>
              <Text style={[styles.auditTime, { color: theme.textMuted }]}>
                {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {evt.actor}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Pairing Invitation Modal */}
      <PairingModal
        visible={pairingModalVisible}
        onClose={() => setPairingModalVisible(false)}
        pairingCode={activePairingCode || 'ZEN-8942'}
        onRegenerateCode={generatePairingCode}
        themeMode={themeMode}
      />

      {/* Add Custom Restriction Modal (Android DPC) */}
      <AddRestrictionModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAddPolicy={addParentPolicy}
        themeMode={themeMode}
      />

      {/* Apple FamilyActivityPicker Modal (iOS Screen Time) */}
      <IosActivityPickerModal
        visible={iosPickerVisible}
        onClose={() => setIosPickerVisible(false)}
        onConfirmSelection={(bundles, apps) => {
          apps.forEach((app) => {
            addParentPolicy({
              familyRelationshipId: 'fam_default',
              targetDeviceId: 'dev_iphone_15_pro',
              ownerType: 'parent',
              policyType: 'app_block',
              targetPackage: app.bundleId,
              appName: app.name,
              appCategory: app.category,
              appIcon: app.icon,
              iconBg: app.color,
              desiredState: 'active',
              scheduleDescription: 'Apple ManagedSettings Shield (iOS)',
            });
          });
          Alert.alert(
            'Apple Screen Time',
            `Applied ManagedSettings shields to ${bundles.length} selected applications.`
          );
        }}
        themeMode={themeMode}
      />

      {/* Cross-Platform App Scanner Modal (Android DPC & Apple Screen Time) */}
      <AppScannerModal
        visible={appScannerVisible}
        onClose={() => setAppScannerVisible(false)}
        childDevice={selectedChildDevice}
      />

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radii.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    borderWidth: 1,
    borderRadius: Radii.xl,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  countBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.full,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  requestItem: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: 12,
    marginBottom: 10,
  },
  reqTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reqChildName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  reqTime: {
    fontSize: 11,
  },
  reasonBox: {
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: 10,
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  reqActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  approveBtn: {
    backgroundColor: Palette.tertiary,
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.onTertiary,
  },
  rejectBtn: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  pillBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radii.full,
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: 8,
  },
  scheduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  scheduleName: {
    fontSize: 14,
    fontWeight: '700',
  },
  schedulePill: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radii.sm,
  },
  schedulePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  scheduleTime: {
    fontSize: 12,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 10,
  },
  auditIconCol: {
    paddingTop: 5,
  },
  auditDot: {
    width: 8,
    height: 8,
    borderRadius: Radii.full,
  },
  auditDetails: {
    flex: 1,
  },
  auditDesc: {
    fontSize: 12,
    fontWeight: '500',
  },
  auditTime: {
    fontSize: 10,
    marginTop: 2,
  },
  autoSavedNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  autoSavedNoticeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickAppsCard: {
    borderWidth: 1,
    borderRadius: Radii.xl,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
  },
  quickAppsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quickAppsTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickAppsSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  quickAppsGrid: {
    gap: 8,
  },
  quickAppItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: 10,
    gap: 10,
  },
  quickAppIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAppName: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickAppStatus: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
});
