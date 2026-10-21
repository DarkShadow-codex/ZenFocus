// ============================================================================
// ZENFOCUS APP SCANNER MODAL (Cross-Platform Android DPC & iOS Screen Time)
// Scans, categorizes, and controls installed applications on a child's device
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radii } from '../theme';
import { ChildDevice, ScannedApp, ScanResult, UserRole } from '../types';
import { useZenFocus } from '../store/ZenFocusContext';

interface AppScannerModalProps {
  visible: boolean;
  onClose: () => void;
  childDevice: ChildDevice;
  viewerRole?: UserRole;
}

type CategoryFilter = 'All' | 'New' | 'Social' | 'Gaming' | 'Entertainment' | 'Productivity';

export const AppScannerModal: React.FC<AppScannerModalProps> = ({
  visible,
  onClose,
  childDevice,
  viewerRole,
}) => {
  const {
    themeMode,
    scannedAppsByDevice,
    isScanningApps,
    scanChildDeviceApps,
    toggleAppRestrictionForChild,
    policies,
    toggleChildSelfPolicy,
  } = useZenFocus();

  const theme = Palette[themeMode];
  const [selectedFilter, setSelectedFilter] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Load or trigger scan when opened
  useEffect(() => {
    if (visible && childDevice) {
      const existing = scannedAppsByDevice[childDevice.id];
      if (!existing || existing.length === 0) {
        scanChildDeviceApps(childDevice.id).catch(console.error);
      }
    }
  }, [visible, childDevice?.id]);

  const apps: ScannedApp[] = (childDevice && scannedAppsByDevice[childDevice.id]) || [];

  const handleToggleApp = async (app: ScannedApp, nextState: boolean) => {
    try {
      // If viewer is CHILD, enforce Immutable Ownership rule
      if (viewerRole === 'CHILD') {
        const parentPolicy = policies.find(
          (p) => p.targetPackage === app.targetPackage && p.ownerType === 'parent' && p.desiredState === 'active'
        );
        if (parentPolicy && !nextState) {
          Alert.alert(
            'Parent Locked',
            `Access to ${app.appName} is restricted by your parent guardian and cannot be unblocked from a child account.`
          );
          return;
        }

        toggleChildSelfPolicy(app.targetPackage, app.appName, nextState);
        setFeedbackToast(
          nextState
            ? `🔒 ${app.appName} self-blocked for study focus`
            : `🔓 ${app.appName} self-restriction removed`
        );
        setTimeout(() => setFeedbackToast(null), 2500);
        return;
      }

      // Viewer is PARENT: full management
      const res = await toggleAppRestrictionForChild(
        childDevice.id,
        app.targetPackage,
        app.appName,
        app.appCategory,
        app.appIcon,
        app.iconBg,
        nextState
      );
      setFeedbackToast(
        nextState
          ? `🔒 ${app.appName} blocked on ${childDevice.childName}'s device`
          : `🔓 ${app.appName} allowed on ${childDevice.childName}'s device`
      );
      setTimeout(() => setFeedbackToast(null), 2500);
    } catch (e) {
      console.error('Failed to toggle app restriction:', e);
    }
  };

  const handleBlockAllDistractions = async () => {
    const distractionApps = apps.filter(
      (a) => (a.appCategory === 'Social' || a.appCategory === 'Gaming') && !a.isRestricted
    );
    for (const app of distractionApps) {
      await toggleAppRestrictionForChild(
        childDevice.id,
        app.targetPackage,
        app.appName,
        app.appCategory,
        app.appIcon,
        app.iconBg,
        true
      );
    }
    setFeedbackToast(`🔒 Blocked ${distractionApps.length} social & gaming apps`);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleRescan = () => {
    if (childDevice) {
      scanChildDeviceApps(childDevice.id).catch(console.error);
    }
  };

  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.targetPackage.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'New') return !!app.isNewlyDiscovered;
    return app.appCategory === selectedFilter;
  });

  const totalScanned = apps.length;
  const restrictedCount = apps.filter((a) => a.isRestricted).length;
  const newCount = apps.filter((a) => a.isNewlyDiscovered).length;

  const isIos = childDevice?.platform === 'ios';
  const platformColor = isIos ? '#007aff' : '#3ddc84';

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.surfaceBorder }]}>
            <View style={styles.headerTitleRow}>
              <View
                style={[
                  styles.platformIconBadge,
                  { backgroundColor: isIos ? 'rgba(0,122,255,0.12)' : 'rgba(61,220,132,0.15)' },
                ]}
              >
                <Ionicons
                  name={isIos ? 'logo-apple' : 'logo-android'}
                  size={22}
                  color={platformColor}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={styles.deviceMetaRow}>
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                    Scan {childDevice?.childName}'s Apps
                  </Text>
                  <View
                    style={[
                      styles.platformPill,
                      { backgroundColor: isIos ? '#007aff' : '#2e7d32' },
                    ]}
                  >
                    <Text style={styles.platformPillText}>
                      {isIos ? 'Apple Screen Time' : 'Android DPC'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  {childDevice?.platform === 'ios' ? 'Apple iOS' : 'Android DPC'} • {childDevice?.osVersion}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: theme.surfaceSecondary }]}
                testID="close-app-scanner-btn"
              >
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Platform Scan Diagnostics Banner */}
            <View
              style={[
                styles.diagnosticBanner,
                {
                  backgroundColor: isIos ? 'rgba(0,122,255,0.08)' : 'rgba(46,125,50,0.08)',
                  borderColor: isIos ? 'rgba(0,122,255,0.25)' : 'rgba(46,125,50,0.25)',
                },
              ]}
            >
              <Ionicons
                name={isIos ? 'shield-checkmark-outline' : 'hardware-chip-outline'}
                size={16}
                color={platformColor}
              />
              <Text
                style={[
                  styles.diagnosticBannerText,
                  { color: isIos ? '#0066cc' : '#2e7d32' },
                ]}
              >
                {isIos
                  ? 'Scanning via Apple FamilyControls API & ManagedSettings application tokens'
                  : 'Scanning via Android PackageManager & DevicePolicyManager suspension engine'}
              </Text>
            </View>
          </View>

          {/* Feedback Toast */}
          {feedbackToast && (
            <View style={styles.toastBanner}>
              <Text style={styles.toastBannerText}>{feedbackToast}</Text>
            </View>
          )}

          {isScanningApps ? (
            /* Scanning In-Progress State */
            <View style={styles.scanningStateContainer}>
              <ActivityIndicator size="large" color={platformColor} />
              <Text style={[styles.scanningTitle, { color: theme.textPrimary }]}>
                Scanning {childDevice?.childName}'s device...
              </Text>
              <Text style={[styles.scanningSubtitle, { color: theme.textSecondary }]}>
                {isIos
                  ? 'Querying Apple Screen Time FamilyActivitySelection & Shield configurations'
                  : 'Querying Android PackageManager & DPC package suspension registry'}
              </Text>
              <View style={styles.scanningProgressBar}>
                <View style={[styles.scanningProgressFill, { backgroundColor: platformColor }]} />
              </View>
            </View>
          ) : (
            /* Scanned Content */
            <View style={{ flex: 1 }}>
              {/* Stats Bar */}
              <View style={[styles.statsRow, { backgroundColor: themeMode === 'dark' ? '#181b26' : '#f5f7fc' }]}>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: theme.textPrimary }]}>{totalScanned}</Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Apps</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: '#ff4d4f' }]}>{restrictedCount}</Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Blocked</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <View style={styles.newStatHeader}>
                    <Text style={[styles.statValue, { color: '#faad14' }]}>{newCount}</Text>
                    {newCount > 0 && <View style={styles.glowingDot} />}
                  </View>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>New Installs</Text>
                </View>
                <View style={styles.statDivider} />
                <TouchableOpacity
                  style={[styles.rescanButton, { borderColor: theme.surfaceBorder }]}
                  onPress={handleRescan}
                  testID="rescan-device-btn"
                >
                  <Ionicons name="refresh-outline" size={16} color={theme.textPrimary} />
                  <Text style={[styles.rescanButtonText, { color: theme.textPrimary }]}>Rescan</Text>
                </TouchableOpacity>
              </View>

              {/* Search & Filter */}
              <View style={styles.controlsRow}>
                <View
                  style={[
                    styles.searchInputContainer,
                    { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
                  ]}
                >
                  <Ionicons name="search" size={16} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.textPrimary }]}
                    placeholder="Search apps or package IDs..."
                    placeholderTextColor={theme.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Filter Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterPillsContainer}
              >
                {(['All', 'New', 'Social', 'Gaming', 'Entertainment', 'Productivity'] as CategoryFilter[]).map(
                  (filter) => {
                    const isSelected = selectedFilter === filter;
                    return (
                      <TouchableOpacity
                        key={filter}
                        onPress={() => setSelectedFilter(filter)}
                        style={[
                          styles.filterPill,
                          {
                            backgroundColor: isSelected
                              ? Palette.primary
                              : themeMode === 'dark'
                              ? '#222736'
                              : '#eaedf6',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            { color: isSelected ? '#ffffff' : theme.textSecondary },
                          ]}
                        >
                          {filter === 'New' ? `⚡ New (${newCount})` : filter}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </ScrollView>

              {/* Quick Actions Bar */}
              <View style={styles.quickActionsBar}>
                <TouchableOpacity
                  style={styles.blockDistractionsBtn}
                  onPress={handleBlockAllDistractions}
                  testID="block-all-distractions-btn"
                >
                  <Ionicons name="shield-outline" size={14} color="#ffffff" />
                  <Text style={styles.blockDistractionsBtnText}>Block All Social & Gaming</Text>
                </TouchableOpacity>
                <Text style={[styles.realtimeAutoSaveTag, { color: theme.textSecondary }]}>
                  ⚡ Instant Auto-Save
                </Text>
              </View>

              {/* Scanned Apps List */}
              <ScrollView style={styles.appsList} contentContainerStyle={{ paddingBottom: 20 }}>
                {filteredApps.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="file-tray-outline" size={48} color={theme.textSecondary} />
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                      No applications match "{searchQuery}"
                    </Text>
                  </View>
                ) : (
                  filteredApps.map((app) => {
                    return (
                      <View
                        key={app.targetPackage}
                        style={[
                          styles.appItem,
                          {
                            backgroundColor: app.isRestricted
                              ? themeMode === 'dark'
                                ? 'rgba(255,77,79,0.08)'
                                : 'rgba(255,77,79,0.04)'
                              : theme.surface,
                            borderColor: app.isRestricted
                              ? 'rgba(255,77,79,0.3)'
                              : theme.surfaceBorder,
                          },
                        ]}
                      >
                        <View style={[styles.appIconBox, { backgroundColor: app.iconBg || '#6366f1' }]}>
                          <Text style={styles.appIconEmoji}>{app.appIcon || '📱'}</Text>
                        </View>

                        <View style={styles.appInfoBox}>
                          <View style={styles.appNameRow}>
                            <Text style={[styles.appName, { color: theme.textPrimary }]}>
                              {app.appName}
                            </Text>
                            {app.isNewlyDiscovered && (
                              <View style={styles.newAppBadge}>
                                <Text style={styles.newAppBadgeText}>NEW</Text>
                              </View>
                            )}
                          </View>
                          <Text
                            style={[styles.appPackage, { color: theme.textSecondary }]}
                            numberOfLines={1}
                          >
                            {app.targetPackage}
                          </Text>

                          <View style={styles.appMetaRow}>
                            <View
                              style={[
                                styles.categoryTag,
                                {
                                  backgroundColor:
                                    app.appCategory === 'Gaming'
                                      ? 'rgba(226,35,26,0.1)'
                                      : app.appCategory === 'Social'
                                      ? 'rgba(88,101,242,0.1)'
                                      : 'rgba(20,191,150,0.1)',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.categoryTagText,
                                  {
                                    color:
                                      app.appCategory === 'Gaming'
                                        ? '#e2231a'
                                        : app.appCategory === 'Social'
                                        ? '#5865f2'
                                        : '#14bf96',
                                  },
                                ]}
                              >
                                {app.appCategory}
                              </Text>
                            </View>
                            {app.sizeMb && (
                              <Text style={[styles.appMetaText, { color: theme.textSecondary }]}>
                                {app.sizeMb} MB
                              </Text>
                            )}
                            {app.isSystemApp && (
                              <Text style={[styles.systemAppTag, { color: theme.textSecondary }]}>
                                System
                              </Text>
                            )}
                          </View>
                        </View>

                        {/* Instant 1-tap Restriction Switch */}
                        {(() => {
                          const isParentLocked =
                            viewerRole === 'CHILD' &&
                            policies.some(
                              (p) =>
                                p.targetPackage === app.targetPackage &&
                                p.ownerType === 'parent' &&
                                p.desiredState === 'active'
                            );

                          return (
                            <View style={styles.switchContainer}>
                              {isParentLocked ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <Ionicons name="lock-closed" size={12} color={Palette.primary} />
                                  <Text
                                    style={[
                                      styles.switchLabel,
                                      { color: Palette.primary, fontWeight: '700' },
                                    ]}
                                  >
                                    LOCKED
                                  </Text>
                                </View>
                              ) : (
                                <Text
                                  style={[
                                    styles.switchLabel,
                                    {
                                      color: app.isRestricted ? '#ff4d4f' : theme.textSecondary,
                                      fontWeight: app.isRestricted ? '700' : '500',
                                    },
                                  ]}
                                >
                                  {app.isRestricted ? 'BLOCKED' : 'ALLOWED'}
                                </Text>
                              )}
                              <Switch
                                value={app.isRestricted}
                                disabled={isParentLocked}
                                onValueChange={(val) => handleToggleApp(app, val)}
                                trackColor={{ false: theme.surfaceBorder, true: isParentLocked ? Palette.primary : '#ff4d4f' }}
                                thumbColor="#ffffff"
                                testID={`scan-toggle-${app.appName.toLowerCase().replace(/\s+/g, '-')}`}
                              />
                            </View>
                          );
                        })()}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}

          {/* Footer */}
          <View style={[styles.modalFooter, { borderTopColor: theme.surfaceBorder }]}>
            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: Palette.primary }]}
              onPress={onClose}
              testID="scanner-done-btn"
            >
              <Text style={styles.doneButtonText}>Done Reviewing Apps</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 26, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '92%',
    height: 640,
    borderRadius: Radii.lg,
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformIconBadge: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  platformPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.sm,
  },
  platformPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diagnosticBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    borderWidth: 1,
    gap: 8,
  },
  diagnosticBannerText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  toastBanner: {
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  toastBannerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  scanningStateContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 18,
  },
  scanningSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 400,
  },
  scanningProgressBar: {
    width: 240,
    height: 6,
    backgroundColor: 'rgba(100,100,100,0.2)',
    borderRadius: 3,
    marginTop: 24,
    overflow: 'hidden',
  },
  scanningProgressFill: {
    width: '70%',
    height: '100%',
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  newStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  glowingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#faad14',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(150,150,150,0.25)',
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    borderWidth: 1,
    gap: 4,
  },
  rescanButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  controlsRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  filterPillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.full,
    alignSelf: 'center',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  blockDistractionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e11d48',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    gap: 6,
  },
  blockDistractionsBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  realtimeAutoSaveTag: {
    fontSize: 11,
    fontWeight: '600',
  },
  appsList: {
    flex: 1,
    paddingHorizontal: 16,
    minHeight: 250,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    marginBottom: 8,
  },
  appIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIconEmoji: {
    fontSize: 22,
  },
  appInfoBox: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
  },
  newAppBadge: {
    backgroundColor: '#faad14',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  newAppBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  appPackage: {
    fontSize: 11,
    marginTop: 2,
  },
  appMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  categoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  appMetaText: {
    fontSize: 10,
    fontWeight: '500',
  },
  systemAppTag: {
    fontSize: 10,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  switchContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  switchLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  modalFooter: {
    padding: 14,
    borderTopWidth: 1,
  },
  doneButton: {
    paddingVertical: 12,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
