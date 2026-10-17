// ============================================================================
// IOS FAMILY ACTIVITY PICKER MODAL
// Implements Apple FamilyActivityPicker design pattern for iOS Screen Time
// ============================================================================

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radii } from '../theme';

interface ActivityItem {
  id: string;
  name: string;
  bundleId: string;
  category: 'Social' | 'Entertainment' | 'Gaming' | 'Productivity';
  icon: string;
  color: string;
}

const IOS_APP_CATALOG: ActivityItem[] = [
  { id: 'app_tiktok', name: 'TikTok', bundleId: 'com.zhiliaoapp.musically', category: 'Social', icon: '🎵', color: '#ff0050' },
  { id: 'app_insta', name: 'Instagram', bundleId: 'com.burbn.instagram', category: 'Social', icon: '📷', color: '#e1306c' },
  { id: 'app_snap', name: 'Snapchat', bundleId: 'com.toyopagroup.picaboo', category: 'Social', icon: '👻', color: '#fffc00' },
  { id: 'app_yt', name: 'YouTube', bundleId: 'com.google.ios.youtube', category: 'Entertainment', icon: '▶', color: '#ff0000' },
  { id: 'app_netflix', name: 'Netflix', bundleId: 'com.netflix.Netflix', category: 'Entertainment', icon: '🎬', color: '#e50914' },
  { id: 'app_roblox', name: 'Roblox', bundleId: 'com.roblox.robloxmobile', category: 'Gaming', icon: '🧱', color: '#8b0000' },
  { id: 'app_discord', name: 'Discord', bundleId: 'com.hammerandchisel.discord', category: 'Social', icon: '💬', color: '#5865f2' },
  { id: 'app_safari', name: 'Safari Websites', bundleId: 'com.apple.mobilesafari', category: 'Productivity', icon: '🧭', color: '#007aff' },
];

interface IosActivityPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmSelection: (selectedBundles: string[], apps: ActivityItem[]) => void;
  themeMode: 'light' | 'dark';
}

export const IosActivityPickerModal: React.FC<IosActivityPickerModalProps> = ({
  visible,
  onClose,
  onConfirmSelection,
  themeMode,
}) => {
  const theme = Palette[themeMode];
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(['app_tiktok', 'app_insta']));
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Social' | 'Entertainment' | 'Gaming'>('All');

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredApps = IOS_APP_CATALOG.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'All' || app.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleDone = () => {
    const selectedApps = IOS_APP_CATALOG.filter((app) => selectedIds.has(app.id));
    const bundleIds = selectedApps.map((a) => a.bundleId);
    onConfirmSelection(bundleIds, selectedApps);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              
              {/* Apple-style Navigation Bar */}
              <View style={[styles.navBar, { borderBottomColor: theme.surfaceBorderSubtle }]}>
                <TouchableOpacity onPress={onClose}>
                  <Text style={[styles.navCancelText, { color: '#007aff' }]}>Cancel</Text>
                </TouchableOpacity>

                <View style={styles.navTitleBox}>
                  <Text style={[styles.navTitle, { color: theme.textPrimary }]}>Choose Activities</Text>
                  <Text style={[styles.navSubtitle, { color: theme.textSecondary }]}>
                    Apple FamilyActivityPicker
                  </Text>
                </View>

                <TouchableOpacity onPress={handleDone}>
                  <Text style={[styles.navDoneText, { color: '#007aff' }]}>Done</Text>
                </TouchableOpacity>
              </View>

              {/* Privacy Notice Banner */}
              <View style={[styles.privacyNotice, { backgroundColor: 'rgba(0, 122, 255, 0.08)' }]}>
                <Ionicons name="lock-closed" size={14} color="#007aff" />
                <Text style={[styles.privacyText, { color: theme.textPrimary }]}>
                  Apple FamilyControls tokens are opaque. ZenFocus shields apps without accessing personal app activity.
                </Text>
              </View>

              {/* Search Bar */}
              <View style={[styles.searchBox, { backgroundColor: theme.surfaceSecondary }]}>
                <Ionicons name="search" size={16} color={theme.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: theme.textPrimary }]}
                  placeholder="Search Apps & Categories"
                  placeholderTextColor={theme.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Category Filter Pills */}
              <View style={styles.categoriesRow}>
                {(['All', 'Social', 'Entertainment', 'Gaming'] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.categoryTab,
                      { backgroundColor: theme.surfaceSecondary },
                      activeTab === tab && { backgroundColor: '#007aff' },
                    ]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text
                      style={[
                        styles.categoryTabText,
                        { color: theme.textSecondary },
                        activeTab === tab && { color: '#ffffff', fontWeight: '700' },
                      ]}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Application Token List */}
              <ScrollView style={styles.appList}>
                {filteredApps.map((app) => {
                  const isSelected = selectedIds.has(app.id);
                  return (
                    <TouchableOpacity
                      key={app.id}
                      style={[
                        styles.appRow,
                        { borderBottomColor: theme.surfaceBorderSubtle },
                      ]}
                      onPress={() => toggleSelect(app.id)}
                    >
                      <View style={[styles.appIcon, { backgroundColor: app.color }]}>
                        <Text style={styles.appIconText}>{app.icon}</Text>
                      </View>

                      <View style={styles.appInfo}>
                        <Text style={[styles.appName, { color: theme.textPrimary }]}>{app.name}</Text>
                        <Text style={[styles.bundleId, { color: theme.textSecondary }]}>
                          {app.bundleId}
                        </Text>
                      </View>

                      {/* Apple-style Checkmark / Circle */}
                      <View
                        style={[
                          styles.checkbox,
                          { borderColor: theme.surfaceBorder },
                          isSelected && { backgroundColor: '#007aff', borderColor: '#007aff' },
                        ]}
                      >
                        {isSelected && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Selected Count Footer */}
              <View style={[styles.footer, { borderTopColor: theme.surfaceBorderSubtle }]}>
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                  {selectedIds.size} application(s) selected for ManagedSettings shield
                </Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    borderWidth: 1,
    maxHeight: '85%',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  navCancelText: {
    fontSize: 16,
  },
  navDoneText: {
    fontSize: 16,
    fontWeight: '700',
  },
  navTitleBox: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  navSubtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    borderRadius: Radii.md,
  },
  privacyText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
  },
  categoryTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  appList: {
    marginTop: 8,
    paddingHorizontal: 16,
    maxHeight: 320,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: {
    fontSize: 16,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 15,
    fontWeight: '600',
  },
  bundleId: {
    fontSize: 11,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radii.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
});
