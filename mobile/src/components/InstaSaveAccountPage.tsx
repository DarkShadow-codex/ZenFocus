// ============================================================================
// INSTA-SAVE ACCOUNT PAGE
// Dedicated Parental Control Page: Parents select which child device to control
// and toggle app restrictions with instant auto-save and zero manual submit.
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useZenFocus } from '../store/ZenFocusContext';
import { Palette, Radii } from '../theme';
import { ChildDeviceSelector } from './ChildDeviceSelector';
import { PairingModal } from './PairingModal';
import { DevicePlatform } from '../types';

interface AppCatalogItem {
  targetPackage: string;
  appName: string;
  appCategory: 'Social' | 'Entertainment' | 'Gaming' | 'Productivity';
  appIcon: string;
  iconBg: string;
  platform: DevicePlatform;
  description: string;
}

const ANDROID_CATALOG: AppCatalogItem[] = [
  {
    targetPackage: 'com.zhiliaoapp.musically',
    appName: 'TikTok',
    appCategory: 'Social',
    appIcon: '🎵',
    iconBg: '#ff0050',
    platform: 'android',
    description: 'Short video feeds & algorithm distraction',
  },
  {
    targetPackage: 'com.instagram.android',
    appName: 'Instagram',
    appCategory: 'Social',
    appIcon: '📷',
    iconBg: '#e1306c',
    platform: 'android',
    description: 'Reels, stories, and social messaging',
  },
  {
    targetPackage: 'com.google.android.youtube',
    appName: 'YouTube',
    appCategory: 'Entertainment',
    appIcon: '▶',
    iconBg: '#ff0000',
    platform: 'android',
    description: 'Video streaming and YouTube Shorts',
  },
  {
    targetPackage: 'com.roblox.client',
    appName: 'Roblox',
    appCategory: 'Gaming',
    appIcon: '🎮',
    iconBg: '#e2231a',
    platform: 'android',
    description: 'Online multiplayer gaming sandbox',
  },
  {
    targetPackage: 'com.snapchat.android',
    appName: 'Snapchat',
    appCategory: 'Social',
    appIcon: '👻',
    iconBg: '#f0df00',
    platform: 'android',
    description: 'Snap streaks & ephemeral messaging',
  },
  {
    targetPackage: 'com.discord',
    appName: 'Discord',
    appCategory: 'Social',
    appIcon: '💬',
    iconBg: '#5865f2',
    platform: 'android',
    description: 'Voice chat servers and group channels',
  },
  {
    targetPackage: 'com.netflix.mediaclient',
    appName: 'Netflix',
    appCategory: 'Entertainment',
    appIcon: '🍿',
    iconBg: '#e50914',
    platform: 'android',
    description: 'Movie & TV show streaming',
  },
  {
    targetPackage: 'tv.twitch.android.app',
    appName: 'Twitch',
    appCategory: 'Entertainment',
    appIcon: '🎮',
    iconBg: '#9146ff',
    platform: 'android',
    description: 'Livestreaming and game broadcasts',
  },
  {
    targetPackage: 'com.reddit.frontpage',
    appName: 'Reddit',
    appCategory: 'Social',
    appIcon: '🤖',
    iconBg: '#ff4500',
    platform: 'android',
    description: 'Forums and endless scrolling feeds',
  },
  {
    targetPackage: 'com.spotify.music',
    appName: 'Spotify',
    appCategory: 'Entertainment',
    appIcon: '🎧',
    iconBg: '#1db954',
    platform: 'android',
    description: 'Music & podcast streaming',
  },
];

const IOS_CATALOG: AppCatalogItem[] = [
  {
    targetPackage: 'com.zhiliaoapp.musically.ios',
    appName: 'TikTok',
    appCategory: 'Social',
    appIcon: '🎵',
    iconBg: '#ff0050',
    platform: 'ios',
    description: 'ManagedSettings Shield for iOS Screen Time',
  },
  {
    targetPackage: 'com.burbn.instagram',
    appName: 'Instagram',
    appCategory: 'Social',
    appIcon: '📷',
    iconBg: '#e1306c',
    platform: 'ios',
    description: 'Apple FamilyActivityPicker restricted',
  },
  {
    targetPackage: 'com.google.ios.youtube',
    appName: 'YouTube',
    appCategory: 'Entertainment',
    appIcon: '▶',
    iconBg: '#ff0000',
    platform: 'ios',
    description: 'iOS video feeds & short form clips',
  },
  {
    targetPackage: 'com.roblox.robloxmobile',
    appName: 'Roblox',
    appCategory: 'Gaming',
    appIcon: '🎮',
    iconBg: '#e2231a',
    platform: 'ios',
    description: 'FamilyControls token shield applied',
  },
  {
    targetPackage: 'com.toyopagroup.picaboo',
    appName: 'Snapchat',
    appCategory: 'Social',
    appIcon: '👻',
    iconBg: '#f0df00',
    platform: 'ios',
    description: 'Camera and story shields',
  },
  {
    targetPackage: 'com.hammerandchisel.discord',
    appName: 'Discord',
    appCategory: 'Social',
    appIcon: '💬',
    iconBg: '#5865f2',
    platform: 'ios',
    description: 'Screen Time social media category shield',
  },
  {
    targetPackage: 'com.apple.facetime',
    appName: 'FaceTime',
    appCategory: 'Social',
    appIcon: '📹',
    iconBg: '#34c759',
    platform: 'ios',
    description: 'Built-in iOS video calling shield',
  },
  {
    targetPackage: 'com.netflix.Netflix',
    appName: 'Netflix',
    appCategory: 'Entertainment',
    appIcon: '🍿',
    iconBg: '#e50914',
    platform: 'ios',
    description: 'ManagedSettings entertainment category',
  },
  {
    targetPackage: 'tv.twitch',
    appName: 'Twitch',
    appCategory: 'Entertainment',
    appIcon: '🎮',
    iconBg: '#9146ff',
    platform: 'ios',
    description: 'iOS livestream and game viewing',
  },
  {
    targetPackage: 'com.apple.MobileSMS',
    appName: 'iMessage',
    appCategory: 'Social',
    appIcon: '💬',
    iconBg: '#34c759',
    platform: 'ios',
    description: 'Bedtime downtime shield for texts',
  },
];

export const InstaSaveAccountPage: React.FC = () => {
  const {
    themeMode,
    childDevices,
    selectedChildDeviceId,
    selectChildDevice,
    selectedChildDevice,
    pairNewChildDevice,
    policies,
    toggleAppRestrictionForChild,
    activePairingCode,
    generatePairingCode,
  } = useZenFocus();

  const theme = Palette[themeMode];
  const [pairingModalOpen, setPairingModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [instaSaveToast, setInstaSaveToast] = useState<{
    text: string;
    subtext: string;
    appName: string;
    blocked: boolean;
  } | null>(null);

  // New Custom App Modal state
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customAppName, setCustomAppName] = useState('');
  const [customPackage, setCustomPackage] = useState('');
  const [customCategory, setCustomCategory] = useState<'Social' | 'Entertainment' | 'Gaming' | 'Productivity'>('Social');

  // Pair New Device Modal state
  const [pairNewDeviceModalOpen, setPairNewDeviceModalOpen] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDevicePlatform, setNewDevicePlatform] = useState<DevicePlatform>('android');

  const isIos = selectedChildDevice.platform === 'ios';
  const catalog = isIos ? IOS_CATALOG : ANDROID_CATALOG;

  // Filter catalog based on category and search
  const filteredCatalog = catalog.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.appCategory === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.targetPackage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Check if an app is restricted for the selected child
  const isAppRestricted = (targetPackage: string) => {
    const policy = policies.find(
      (p) =>
        p.targetDeviceId === selectedChildDeviceId &&
        p.targetPackage === targetPackage &&
        p.ownerType === 'parent'
    );
    return policy ? policy.desiredState === 'active' : false;
  };

  // Instant save handler
  const handleToggle = async (item: AppCatalogItem, currentRestricted: boolean) => {
    const nextActive = !currentRestricted;
    const res = await toggleAppRestrictionForChild(
      selectedChildDeviceId,
      item.targetPackage,
      item.appName,
      item.appCategory,
      item.appIcon,
      item.iconBg,
      nextActive
    );

    // Flash the Insta-Save Banner
    const toastState = {
      text: `⚡ Insta-Saved to ${selectedChildDevice.childName}'s ${selectedChildDevice.deviceName}`,
      subtext: nextActive
        ? `Blocked ${item.appName} • ${isIos ? 'Apple Screen Time Shield Active' : 'Android DPC Package Suspended'}`
        : `Allowed ${item.appName} • Restriction lifted immediately`,
      appName: item.appName,
      blocked: nextActive,
    };
    setInstaSaveToast(toastState);
    setTimeout(() => {
      setInstaSaveToast((prev) => (prev?.appName === item.appName ? null : prev));
    }, 3500);
  };

  const handleAddCustomApp = async () => {
    if (!customAppName.trim() || !customPackage.trim()) return;

    await toggleAppRestrictionForChild(
      selectedChildDeviceId,
      customPackage.trim(),
      customAppName.trim(),
      customCategory,
      '📱',
      '#5146e5',
      true
    );

    setInstaSaveToast({
      text: `⚡ Insta-Saved to ${selectedChildDevice.childName}'s device`,
      subtext: `Custom app ${customAppName} blocked and synced`,
      appName: customAppName,
      blocked: true,
    });
    setCustomModalOpen(false);
    setCustomAppName('');
    setCustomPackage('');
  };

  const handlePairNewDeviceSubmit = () => {
    if (!newChildName.trim() || !newDeviceName.trim()) return;
    const paired = pairNewChildDevice(newChildName.trim(), newDeviceName.trim(), newDevicePlatform);
    selectChildDevice(paired.id);
    setPairNewDeviceModalOpen(false);
    setNewChildName('');
    setNewDeviceName('');
    setInstaSaveToast({
      text: `🎉 Paired New Device for ${paired.childName}!`,
      subtext: `${paired.deviceName} (${paired.platform.toUpperCase()}) added to your parent account.`,
      appName: paired.deviceName,
      blocked: false,
    });
  };

  const categories = ['All', 'Social', 'Entertainment', 'Gaming', 'Productivity'];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.canvas }]} contentContainerStyle={styles.content}>
      
      {/* Hero Title & Explanation */}
      <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
        <View style={styles.heroHeader}>
          <View style={[styles.lightningCircle, { backgroundColor: 'rgba(85, 214, 190, 0.16)' }]}>
            <Ionicons name="flash" size={20} color={Palette.tertiary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.heroTitleRow}>
              <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
                Insta-Save Control Center
              </Text>
              <View style={[styles.instantPill, { backgroundColor: 'rgba(85, 214, 190, 0.2)' }]}>
                <View style={styles.instantDot} />
                <Text style={styles.instantPillText}>Real-Time Sync</Text>
              </View>
            </View>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Pick any child device below. Every toggle saves and enforces immediately on their phone with no manual submission required.
            </Text>
          </View>
        </View>
      </View>

      {/* Child Device Selector Carousel (At least 5 devices support) */}
      <ChildDeviceSelector
        childDevices={childDevices}
        selectedChildDeviceId={selectedChildDeviceId}
        onSelectDevice={selectChildDevice}
        onPairDevicePress={() => setPairNewDeviceModalOpen(true)}
        themeMode={themeMode}
      />

      {/* Real-time Insta-Save Toast Notification */}
      {instaSaveToast && (
        <View
          style={[
            styles.toastCard,
            {
              backgroundColor: instaSaveToast.blocked ? 'rgba(239, 101, 116, 0.12)' : 'rgba(53, 185, 138, 0.12)',
              borderColor: instaSaveToast.blocked ? Palette.error : Palette.success,
            },
          ]}
        >
          <Ionicons
            name={instaSaveToast.blocked ? 'shield' : 'shield-outline'}
            size={20}
            color={instaSaveToast.blocked ? Palette.error : Palette.success}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.toastTitle,
                { color: instaSaveToast.blocked ? Palette.error : Palette.success },
              ]}
            >
              {instaSaveToast.text}
            </Text>
            <Text style={[styles.toastSubtext, { color: theme.textPrimary }]}>
              {instaSaveToast.subtext}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setInstaSaveToast(null)}>
            <Ionicons name="close" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Controlling Child Overview Banner */}
      <View
        style={[
          styles.controlBanner,
          {
            backgroundColor: isIos ? 'rgba(0, 122, 255, 0.08)' : 'rgba(81, 70, 229, 0.08)',
            borderColor: isIos ? '#007aff' : Palette.primary,
          },
        ]}
      >
        <View style={styles.controlBannerLeft}>
          <View
            style={[
              styles.platformIconBox,
              { backgroundColor: isIos ? '#007aff' : Palette.primary },
            ]}
          >
            <Ionicons
              name={isIos ? 'logo-apple' : 'logo-android'}
              size={18}
              color="#ffffff"
            />
          </View>
          <View>
            <Text style={[styles.controllingLabel, { color: isIos ? '#007aff' : Palette.primary }]}>
              Controlling Device Restrictions
            </Text>
            <Text style={[styles.controllingName, { color: theme.textPrimary }]}>
              {selectedChildDevice.childName} • {selectedChildDevice.deviceName}
            </Text>
            <Text style={[styles.controllingSub, { color: theme.textSecondary }]}>
              {isIos ? 'Apple Screen Time & FamilyControls Engine' : 'Android DPC Device Policy Controller (Device Owner)'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.customAppBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
          onPress={() => setCustomModalOpen(true)}
        >
          <Ionicons name="add" size={16} color={Palette.primary} />
          <Text style={[styles.customAppBtnText, { color: Palette.primary }]}>+ Add App</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Category Filter Section */}
      <View style={[styles.filterCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
        <View style={[styles.searchBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorderSubtle }]}>
          <Ionicons name="search" size={16} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder={`Search ${isIos ? 'iOS apps or bundle IDs' : 'Android apps or packages'}...`}
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

        {/* Category Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => {
            const isCatActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isCatActive ? Palette.primary : theme.surfaceSecondary,
                    borderColor: isCatActive ? Palette.primary : theme.surfaceBorderSubtle,
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: isCatActive ? '#ffffff' : theme.textSecondary, fontWeight: isCatActive ? '700' : '500' },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* App Restrictions List with Instant Toggles */}
      <View style={styles.listHeaderRow}>
        <Text style={[styles.listHeaderTitle, { color: theme.textPrimary }]}>
          App Restrictions ({filteredCatalog.length})
        </Text>
        <Text style={[styles.listHeaderSub, { color: theme.textMuted }]}>
          Changes save automatically
        </Text>
      </View>

      {filteredCatalog.map((item) => {
        const restricted = isAppRestricted(item.targetPackage);

        return (
          <View
            key={item.targetPackage}
            style={[
              styles.appRowCard,
              {
                backgroundColor: theme.surface,
                borderColor: restricted ? (isIos ? 'rgba(0, 122, 255, 0.4)' : 'rgba(81, 70, 229, 0.4)') : theme.surfaceBorder,
              },
            ]}
          >
            {/* App Icon */}
            <View style={[styles.appIconBox, { backgroundColor: item.iconBg }]}>
              <Text style={styles.appIconEmoji}>{item.appIcon}</Text>
            </View>

            {/* App Info */}
            <View style={styles.appInfoCol}>
              <View style={styles.appNameRow}>
                <Text style={[styles.appName, { color: theme.textPrimary }]}>
                  {item.appName}
                </Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: restricted ? 'rgba(239, 101, 116, 0.12)' : 'rgba(53, 185, 138, 0.12)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: restricted ? Palette.error : Palette.success },
                    ]}
                  >
                    {restricted ? 'BLOCKED' : 'ALLOWED'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.packageText, { color: theme.textMuted }]} numberOfLines={1}>
                {item.targetPackage}
              </Text>
              <Text style={[styles.appDescription, { color: theme.textSecondary }]} numberOfLines={1}>
                {item.description}
              </Text>
            </View>

            {/* Instant Toggle Switch */}
            <View style={styles.switchCol}>
              <Switch
                value={restricted}
                onValueChange={() => handleToggle(item, restricted)}
                trackColor={{
                  false: theme.surfaceBorder,
                  true: isIos ? '#007aff' : Palette.primary,
                }}
                thumbColor="#ffffff"
              />
              <Text style={[styles.switchLabel, { color: restricted ? Palette.error : theme.textMuted }]}>
                {restricted ? 'Blocked' : 'Allow'}
              </Text>
            </View>
          </View>
        );
      })}

      {/* Device Pairing / Multi-device Action Card */}
      <View style={[styles.pairingHero, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
        <View style={styles.pairingHeroLeft}>
          <Ionicons name="phone-portrait-outline" size={24} color={Palette.primary} />
          <View>
            <Text style={[styles.pairingHeroTitle, { color: theme.textPrimary }]}>
              Multi-Child Devices ({childDevices.length} Connected)
            </Text>
            <Text style={[styles.pairingHeroSub, { color: theme.textSecondary }]}>
              Control up to 10 child devices from your single parent account.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.heroPairBtn, { backgroundColor: Palette.primary }]}
          onPress={() => setPairNewDeviceModalOpen(true)}
        >
          <Ionicons name="add" size={16} color="#ffffff" />
          <Text style={styles.heroPairBtnText}>+ Connect Device 6+</Text>
        </TouchableOpacity>
      </View>

      {/* Add Custom App Modal */}
      <Modal visible={customModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Add App to Insta-Save
              </Text>
              <TouchableOpacity onPress={() => setCustomModalOpen(false)}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Target Device: {selectedChildDevice.childName} ({selectedChildDevice.deviceName})
            </Text>

            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>App Name</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.surfaceBorder }]}
              placeholder="e.g. Candy Crush, Brawl Stars"
              placeholderTextColor={theme.textMuted}
              value={customAppName}
              onChangeText={setCustomAppName}
            />

            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
              {isIos ? 'Bundle Identifier' : 'Package Name'}
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.surfaceBorder }]}
              placeholder={isIos ? 'e.g. com.king.candycrushsaga' : 'e.g. com.supercell.brawlstars'}
              placeholderTextColor={theme.textMuted}
              value={customPackage}
              onChangeText={setCustomPackage}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtnCancel, { borderColor: theme.surfaceBorder }]}
                onPress={() => setCustomModalOpen(false)}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtnSave, { backgroundColor: Palette.primary }]}
                onPress={handleAddCustomApp}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700' }}>⚡ Add & Block</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pair New Device Modal */}
      <Modal visible={pairNewDeviceModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Pair New Child Device
              </Text>
              <TouchableOpacity onPress={() => setPairNewDeviceModalOpen(false)}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Add device 6+ to your parent account. Both Android and iOS are supported.
            </Text>

            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Child's Name</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.surfaceBorder }]}
              placeholder="e.g. Lucas, Sophia"
              placeholderTextColor={theme.textMuted}
              value={newChildName}
              onChangeText={setNewChildName}
            />

            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Device Model</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.surfaceBorder }]}
              placeholder="e.g. Pixel 7, iPhone 14, iPad Mini"
              placeholderTextColor={theme.textMuted}
              value={newDeviceName}
              onChangeText={setNewDeviceName}
            />

            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Device Platform</Text>
            <View style={styles.platformPickRow}>
              <TouchableOpacity
                style={[
                  styles.platformPickBtn,
                  {
                    backgroundColor: newDevicePlatform === 'android' ? 'rgba(53, 185, 138, 0.15)' : theme.surfaceSecondary,
                    borderColor: newDevicePlatform === 'android' ? Palette.success : theme.surfaceBorder,
                  },
                ]}
                onPress={() => setNewDevicePlatform('android')}
              >
                <Ionicons name="logo-android" size={18} color={newDevicePlatform === 'android' ? Palette.success : theme.textSecondary} />
                <Text style={[styles.platformPickText, { color: newDevicePlatform === 'android' ? Palette.success : theme.textSecondary }]}>
                  Android DPC
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.platformPickBtn,
                  {
                    backgroundColor: newDevicePlatform === 'ios' ? 'rgba(0, 122, 255, 0.15)' : theme.surfaceSecondary,
                    borderColor: newDevicePlatform === 'ios' ? '#007aff' : theme.surfaceBorder,
                  },
                ]}
                onPress={() => setNewDevicePlatform('ios')}
              >
                <Ionicons name="logo-apple" size={18} color={newDevicePlatform === 'ios' ? '#007aff' : theme.textSecondary} />
                <Text style={[styles.platformPickText, { color: newDevicePlatform === 'ios' ? '#007aff' : theme.textSecondary }]}>
                  Apple iOS
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtnCancel, { borderColor: theme.surfaceBorder }]}
                onPress={() => setPairNewDeviceModalOpen(false)}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtnSave, { backgroundColor: Palette.primary }]}
                onPress={handlePairNewDeviceSubmit}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700' }}>Confirm Pairing</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Standard Pairing Invitation Modal */}
      <PairingModal
        visible={pairingModalOpen}
        onClose={() => setPairingModalOpen(false)}
        pairingCode={activePairingCode || 'ZEN-8942'}
        onRegenerateCode={generatePairingCode}
        themeMode={themeMode}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: Radii.xl,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  lightningCircle: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  instantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  instantDot: {
    width: 6,
    height: 6,
    borderRadius: Radii.full,
    backgroundColor: Palette.tertiary,
  },
  instantPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.onTertiary,
  },
  heroSubtitle: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  toastSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  controlBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  controlBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  platformIconBox: {
    width: 34,
    height: 34,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controllingLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  controllingName: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  controllingSub: {
    fontSize: 10,
    marginTop: 1,
  },
  customAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  customAppBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterCard: {
    borderWidth: 1,
    borderRadius: Radii.xl,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginTop: 10,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 12,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  listHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  listHeaderSub: {
    fontSize: 11,
  },
  appRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 12,
  },
  appIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconEmoji: {
    fontSize: 18,
  },
  appInfoCol: {
    flex: 1,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  packageText: {
    fontSize: 10,
    marginTop: 2,
  },
  appDescription: {
    fontSize: 11,
    marginTop: 2,
  },
  switchCol: {
    alignItems: 'center',
    gap: 2,
  },
  switchLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  pairingHero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radii.xl,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  pairingHeroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pairingHeroTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  pairingHeroSub: {
    fontSize: 11,
    marginTop: 2,
  },
  heroPairBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  heroPairBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderWidth: 1,
    borderRadius: Radii.xl,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  platformPickRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  platformPickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingVertical: 10,
  },
  platformPickText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  modalBtnCancel: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalBtnSave: {
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
