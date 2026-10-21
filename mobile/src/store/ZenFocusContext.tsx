import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserRole,
  UserAccount,
  RestrictionPolicy,
  ApprovalRequest,
  AuditEvent,
  DevicePlatform,
  DeviceCapabilities,
  AndroidDpcCapabilities,
  IosScreenTimeCapabilities,
  CommandReceipt,
  Schedule,
  CompletedSession,
  TemporaryUnlock,
  ChildDevice,
  ParentTab,
  ScannedApp,
  ScanResult,
} from '../types';
import { ZenFocusDpc } from '../native/ZenFocusDpcBridge';
import { ZenFocusIos } from '../native/ZenFocusIosBridge';
import { ZenFocusNative } from '../native/ZenFocusNativeBridge';

const DEFAULT_SESSIONS: CompletedSession[] = [
  {
    id: 'sess_1',
    durationMinutes: 45,
    completedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    sessionType: 'Math Homework Focus',
  },
  {
    id: 'sess_2',
    durationMinutes: 25,
    completedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    sessionType: 'Science Reading',
  },
  {
    id: 'sess_3',
    durationMinutes: 30,
    completedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    sessionType: 'History Essay Draft',
  },
];

const DEFAULT_SCHEDULES: Schedule[] = [
  {
    id: 'sch_school',
    name: 'School Hours Block',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    startTime: '08:00',
    endTime: '15:30',
    active: true,
    category: 'School',
  },
  {
    id: 'sch_bedtime',
    name: 'Bedtime Downtime',
    days: ['Daily'],
    startTime: '21:00',
    endTime: '07:00',
    active: true,
    category: 'Bedtime',
  },
  {
    id: 'sch_homework',
    name: 'Evening Study Focus',
    days: ['Mon', 'Tue', 'Wed', 'Thu'],
    startTime: '17:00',
    endTime: '19:00',
    active: false,
    category: 'Study',
  },
];

export const DEFAULT_CHILD_DEVICES: ChildDevice[] = [
  {
    id: 'dev_leo_s24',
    childName: 'Leo',
    deviceName: '',
    platform: 'android',
    pairingCode: 'ZEN-8942',
    isOnline: true,
    batteryLevel: 84,
    lastSyncAt: new Date().toISOString(),
    appVersion: '1.0.4-dpc',
    osVersion: 'Android 14',
    activeRestrictionsCount: 2,
  },
  {
    id: 'dev_maya_iphone15',
    childName: 'Maya',
    deviceName: '',
    platform: 'ios',
    pairingCode: 'ZEN-3190',
    isOnline: true,
    batteryLevel: 92,
    lastSyncAt: new Date().toISOString(),
    appVersion: '1.0.0-screentime',
    osVersion: 'iOS 17.4',
    activeRestrictionsCount: 3,
  },
  {
    id: 'dev_sam_pixel8',
    childName: 'Sam',
    deviceName: '',
    platform: 'android',
    pairingCode: 'ZEN-5512',
    isOnline: true,
    batteryLevel: 67,
    lastSyncAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    appVersion: '1.0.4-dpc',
    osVersion: 'Android 14',
    activeRestrictionsCount: 1,
  },
  {
    id: 'dev_chloe_ipad',
    childName: 'Chloe',
    deviceName: '',
    platform: 'ios',
    pairingCode: 'ZEN-7734',
    isOnline: true,
    batteryLevel: 78,
    lastSyncAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    appVersion: '1.0.0-screentime',
    osVersion: 'iOS 17.5',
    activeRestrictionsCount: 2,
  },
  {
    id: 'dev_ethan_tab',
    childName: 'Ethan',
    deviceName: '',
    platform: 'android',
    pairingCode: 'ZEN-9021',
    isOnline: true,
    batteryLevel: 55,
    lastSyncAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    appVersion: '1.0.4-dpc',
    osVersion: 'Android 14',
    activeRestrictionsCount: 2,
  },
];

const DEFAULT_POLICIES: RestrictionPolicy[] = [
  // Leo (Android - Galaxy S24)
  {
    id: 'pol_tiktok_leo',
    familyRelationshipId: 'fam_default',
    targetDeviceId: 'dev_leo_s24',
    ownerType: 'parent',
    policyType: 'app_block',
    targetPackage: 'com.zhiliaoapp.musically',
    appName: 'TikTok',
    appCategory: 'Social',
    appIcon: '🎵',
    iconBg: '#ff0050',
    desiredState: 'active',
    version: 4,
    scheduleDescription: 'Blocked during school hours (8am - 4pm)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pol_instagram_leo',
    familyRelationshipId: 'fam_default',
    targetDeviceId: 'dev_leo_s24',
    ownerType: 'parent',
    policyType: 'app_block',
    targetPackage: 'com.instagram.android',
    appName: 'Instagram',
    appCategory: 'Social',
    appIcon: '📷',
    iconBg: '#e1306c',
    desiredState: 'active',
    version: 3,
    scheduleDescription: 'Blocked until 7:00 PM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pol_youtube_leo',
    familyRelationshipId: 'fam_default',
    targetDeviceId: 'dev_leo_s24',
    ownerType: 'parent',
    policyType: 'app_block',
    targetPackage: 'com.google.android.youtube',
    appName: 'YouTube',
    appCategory: 'Entertainment',
    appIcon: '▶',
    iconBg: '#ff0000',
    desiredState: 'inactive',
    version: 2,
    scheduleDescription: 'Allowed for educational study tutorials',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Maya (iOS - iPhone 15 Pro)
  {
    id: 'pol_tiktok_maya',
    familyRelationshipId: 'fam_default',
    targetDeviceId: 'dev_maya_iphone15',
    ownerType: 'parent',
    policyType: 'app_block',
    targetPackage: 'com.zhiliaoapp.musically.ios',
    appName: 'TikTok',
    appCategory: 'Social',
    appIcon: '🎵',
    iconBg: '#ff0050',
    desiredState: 'active',
    version: 2,
    scheduleDescription: 'Apple Screen Time Shield Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pol_roblox_maya',
    familyRelationshipId: 'fam_default',
    targetDeviceId: 'dev_maya_iphone15',
    ownerType: 'parent',
    policyType: 'app_block',
    targetPackage: 'com.roblox.robloxmobile',
    appName: 'Roblox',
    appCategory: 'Gaming',
    appIcon: '🎮',
    iconBg: '#e2231a',
    desiredState: 'active',
    version: 1,
    scheduleDescription: 'Shielded via FamilyActivitySelection',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pol_instagram_maya',
    familyRelationshipId: 'fam_default',
    targetDeviceId: 'dev_maya_iphone15',
    ownerType: 'parent',
    policyType: 'app_block',
    targetPackage: 'com.burbn.instagram',
    appName: 'Instagram',
    appCategory: 'Social',
    appIcon: '📷',
    iconBg: '#e1306c',
    desiredState: 'active',
    version: 3,
    scheduleDescription: 'ManagedSettings Shield applied',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Sam (Android - Pixel 8)
  {
    id: 'pol_snapchat_sam',
    familyRelationshipId: 'fam_default',
    targetDeviceId: 'dev_sam_pixel8',
    ownerType: 'parent',
    policyType: 'app_block',
    targetPackage: 'com.snapchat.android',
    appName: 'Snapchat',
    appCategory: 'Social',
    appIcon: '👻',
    iconBg: '#fffc00',
    desiredState: 'active',
    version: 1,
    scheduleDescription: 'DPC Package suspended',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Chloe (iOS - iPad Air)
  {
    id: 'pol_youtube_chloe',
    familyRelationshipId: 'fam_default',
    targetDeviceId: 'dev_chloe_ipad',
    ownerType: 'parent',
    policyType: 'app_block',
    targetPackage: 'com.google.ios.youtube',
    appName: 'YouTube',
    appCategory: 'Entertainment',
    appIcon: '▶',
    iconBg: '#ff0000',
    desiredState: 'active',
    version: 2,
    scheduleDescription: 'Screen Time restricted',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pol_roblox_chloe',
    familyRelationshipId: 'fam_default',
    targetDeviceId: 'dev_chloe_ipad',
    ownerType: 'parent',
    policyType: 'app_block',
    targetPackage: 'com.roblox.robloxmobile',
    appName: 'Roblox',
    appCategory: 'Gaming',
    appIcon: '🎮',
    iconBg: '#e2231a',
    desiredState: 'active',
    version: 1,
    scheduleDescription: 'Shielded during study hours',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Ethan (Android - Galaxy Tab S9)
  {
    id: 'pol_discord_ethan',
    familyRelationshipId: 'fam_default',
    targetDeviceId: 'dev_ethan_tab',
    ownerType: 'parent',
    policyType: 'app_block',
    targetPackage: 'com.discord',
    appName: 'Discord',
    appCategory: 'Social',
    appIcon: '💬',
    iconBg: '#5865f2',
    desiredState: 'active',
    version: 1,
    scheduleDescription: 'Suspended during study time',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pol_tiktok_ethan',
    familyRelationshipId: 'fam_default',
    targetDeviceId: 'dev_ethan_tab',
    ownerType: 'parent',
    policyType: 'app_block',
    targetPackage: 'com.zhiliaoapp.musically',
    appName: 'TikTok',
    appCategory: 'Social',
    appIcon: '🎵',
    iconBg: '#ff0050',
    desiredState: 'active',
    version: 2,
    scheduleDescription: 'Blocked by parent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_APPROVALS: ApprovalRequest[] = [
  {
    id: 'req_001',
    childUserId: 'usr_leo_child',
    childName: 'Leo',
    targetDeviceId: 'dev_leo_s24',
    targetPackage: 'com.duolingo',
    appName: 'Duolingo',
    durationMinutes: 30,
    reason: 'Need 30 min to complete my French homework streak before dinner!',
    status: 'pending',
    requestedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

interface TimerState {
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  streakDays: number;
  sessionName?: string;
}

interface ZenFocusContextType {
  account: UserAccount | null;
  activeView: 'CHILD' | 'PARENT';
  setActiveView: (view: 'CHILD' | 'PARENT') => void;
  registerAccount: (name: string, email: string, role: UserRole, pairingCode?: string) => Promise<void>;
  loginAccount: (nameOrEmail: string, role: UserRole, customName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  themeMode: 'light' | 'dark';
  toggleTheme: () => void;
  capabilities: DeviceCapabilities;
  activePlatform: DevicePlatform;
  setActivePlatform: (platform: DevicePlatform) => void;
  androidCapabilities: AndroidDpcCapabilities;
  iosCapabilities: IosScreenTimeCapabilities;
  requestIosAuthorization: () => Promise<void>;
  policies: RestrictionPolicy[];
  effectiveRestrictions: RestrictionPolicy[];
  approvalRequests: ApprovalRequest[];
  auditEvents: AuditEvent[];
  schedules: Schedule[];
  toggleSchedule: (scheduleId: string, active: boolean) => void;
  activePairingCode: string | null;
  generatePairingCode: () => string;
  lastDecisionNotice: { appName: string; approved: boolean; durationMinutes: number } | null;
  dismissDecisionNotice: () => void;
  timer: TimerState;
  studyHistory: CompletedSession[];
  temporaryUnlocks: TemporaryUnlock[];
  isCelebrationOpen: boolean;
  setIsCelebrationOpen: (open: boolean) => void;
  lastCompletedMinutes: number;
  takeBreak: (minutes?: number) => void;
  recordCompletedSession: (durationMinutes: number, sessionType?: string) => void;

  // Multi-child management (By child's name, no device names)
  childDevices: ChildDevice[];
  selectedChildDeviceId: string;
  selectedChildDevice: ChildDevice;
  selectChildDevice: (deviceId: string) => void;
  pairNewChildDevice: (childName: string, deviceNameOrPlatform?: string, platform?: DevicePlatform) => ChildDevice;
  removeChildDevice: (deviceId: string) => void;
  toggleAppRestrictionForChild: (
    childDeviceId: string,
    targetPackage: string,
    appName: string,
    appCategory: 'Social' | 'Entertainment' | 'Gaming' | 'Productivity' | 'Utilities',
    appIcon: string,
    iconBg: string,
    active: boolean
  ) => Promise<{ success: boolean; diagnostic: string }>;

  // Parent Dashboard Navigation Tab ('DASHBOARD' | 'INSTA_SAVE')
  activeParentTab: ParentTab;
  setActiveParentTab: (tab: ParentTab) => void;

  // App scanner (Android PackageManager & iOS ScreenTime FamilyActivity)
  scannedAppsByDevice: Record<string, ScannedApp[]>;
  isScanningApps: boolean;
  scanChildDeviceApps: (childDeviceId: string) => Promise<ScanResult>;

  // Policy actions
  toggleParentPolicy: (policyId: string, desiredState: 'active' | 'inactive') => Promise<CommandReceipt>;
  toggleChildSelfPolicy: (targetPackage: string, appName: string, active: boolean) => void;
  addParentPolicy: (newPolicy: Omit<RestrictionPolicy, 'id' | 'version' | 'createdAt' | 'updatedAt'>) => void;
  // Approval actions
  submitExceptionRequest: (targetPackage: string, appName: string, durationMinutes: number, reason: string) => void;
  decideApprovalRequest: (requestId: string, approved: boolean) => void;
  // Timer actions
  setTimerPreset: (minutes: number) => void;
  setCustomTimer: (minutes: number, sessionName?: string) => void;
  adjustTimer: (deltaMinutes: number) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
}

const ZenFocusContext = createContext<ZenFocusContextType | undefined>(undefined);

export const ZenFocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [activeView, setActiveViewState] = useState<'CHILD' | 'PARENT'>('CHILD');
  const [activeParentTab, setActiveParentTab] = useState<ParentTab>('DASHBOARD');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [policies, setPolicies] = useState<RestrictionPolicy[]>(DEFAULT_POLICIES);
  const [childDevices, setChildDevices] = useState<ChildDevice[]>(DEFAULT_CHILD_DEVICES);
  const [selectedChildDeviceId, setSelectedChildDeviceId] = useState<string>('dev_leo_s24');
  const [scannedAppsByDevice, setScannedAppsByDevice] = useState<Record<string, ScannedApp[]>>({});
  const [isScanningApps, setIsScanningApps] = useState<boolean>(false);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(DEFAULT_APPROVALS);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([
    {
      id: 'aud_1',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      actor: 'System DPC',
      actorRole: 'CHILD',
      eventType: 'DPC_ENROLLED',
      description: 'Galaxy S24 DPC provisioning active (Device Owner verified).',
    },
    {
      id: 'aud_2',
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      actor: 'Apple ScreenTime',
      actorRole: 'PARENT',
      eventType: 'POLICY_APPLIED',
      description: 'Maya (iOS) FamilyControls authorization verified.',
    },
  ]);

  const [schedules, setSchedules] = useState<Schedule[]>(DEFAULT_SCHEDULES);
  const [activePairingCode, setActivePairingCode] = useState<string | null>('ZEN-8942');
  const [lastDecisionNotice, setLastDecisionNotice] = useState<{
    appName: string;
    approved: boolean;
    durationMinutes: number;
  } | null>(null);

  const [studyHistory, setStudyHistory] = useState<CompletedSession[]>(DEFAULT_SESSIONS);
  const [temporaryUnlocks, setTemporaryUnlocks] = useState<TemporaryUnlock[]>([]);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState<boolean>(false);
  const [lastCompletedMinutes, setLastCompletedMinutes] = useState<number>(25);

  const [activePlatform, setActivePlatformState] = useState<DevicePlatform>(
    Platform.OS === 'ios' ? 'ios' : 'android'
  );

  const [androidCapabilities, setAndroidCapabilities] = useState<AndroidDpcCapabilities>({
    platform: 'android',
    isDeviceOwner: true,
    isProfileOwner: false,
    dpcEnrolled: true,
    setPackagesSuspendedSupported: true,
    setUninstallBlockedSupported: true,
    dndAccessGranted: true,
    batteryOptimizationIgnored: true,
    osVersion: 'Android 14',
    appVersion: '1.0.4-dpc',
  });

  const [iosCapabilities, setIosCapabilities] = useState<IosScreenTimeCapabilities>({
    platform: 'ios',
    familyControlsAuthorized: true,
    managedSettingsShieldSupported: true,
    deviceActivityScheduled: true,
    denyAppRemovalSupported: true,
    shieldCustomizationActive: true,
    shieldsCurrentlyApplied: true,
    denyAppRemovalActive: true,
    osVersion: 'iOS 17.4',
    appVersion: '1.0.0-screentime',
  });

  const selectedChildDevice: ChildDevice =
    childDevices.find((d) => d.id === selectedChildDeviceId) ||
    childDevices[0] || {
      id: 'dev_none',
      childName: 'No Child Paired',
      deviceName: '',
      platform: 'android',
      pairingCode: 'ZEN-0000',
      isOnline: false,
      batteryLevel: 0,
      lastSyncAt: new Date().toISOString(),
      appVersion: '1.0.0',
      osVersion: 'Android',
      activeRestrictionsCount: 0,
    };

  const setActivePlatform = (platform: DevicePlatform) => {
    setActivePlatformState(platform);
    ZenFocusNative.setActivePlatformOverride(platform);
  };

  const selectChildDevice = (deviceId: string) => {
    setSelectedChildDeviceId(deviceId);
    const found = childDevices.find((d) => d.id === deviceId);
    if (found) {
      setActivePlatform(found.platform);
    }
    AsyncStorage.setItem('zenfocus_selected_child_id', deviceId).catch(console.error);
  };

  const pairNewChildDevice = (
    childName: string,
    deviceNameOrPlatform?: string,
    platformArg?: DevicePlatform
  ): ChildDevice => {
    let platform: DevicePlatform = 'android';
    if (platformArg) {
      platform = platformArg;
    } else if (deviceNameOrPlatform === 'ios' || deviceNameOrPlatform === 'android') {
      platform = deviceNameOrPlatform;
    }
    const newDevice: ChildDevice = {
      id: `dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      childName: childName.trim(),
      deviceName: '',
      platform,
      pairingCode: `ZEN-${Math.floor(1000 + Math.random() * 9000)}`,
      isOnline: true,
      batteryLevel: 100,
      lastSyncAt: new Date().toISOString(),
      appVersion: platform === 'ios' ? '1.0.0-screentime' : '1.0.4-dpc',
      osVersion: platform === 'ios' ? 'iOS 17.5' : 'Android 14',
      activeRestrictionsCount: 0,
    };
    const updated = [...childDevices, newDevice];
    setChildDevices(updated);
    setSelectedChildDeviceId(newDevice.id);
    setActivePlatform(newDevice.platform);
    AsyncStorage.setItem('zenfocus_child_devices', JSON.stringify(updated)).catch(console.error);
    AsyncStorage.setItem('zenfocus_selected_child_id', newDevice.id).catch(console.error);

    const auditItem: AuditEvent = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Parent Account',
      actorRole: 'PARENT',
      eventType: 'DPC_ENROLLED',
      description: `Paired new child: ${childName} (${platform.toUpperCase()}) successfully.`,
      safeDiagnostic: `Child paired with PIN ${newDevice.pairingCode}. Total paired children: ${updated.length}`,
    };
    setAuditEvents((prev) => [auditItem, ...prev]);
    return newDevice;
  };

  const removeChildDevice = (deviceId: string) => {
    const updated = childDevices.filter((d) => d.id !== deviceId);
    setChildDevices(updated);
    if (selectedChildDeviceId === deviceId && updated.length > 0) {
      setSelectedChildDeviceId(updated[0].id);
      setActivePlatform(updated[0].platform);
    }
    AsyncStorage.setItem('zenfocus_child_devices', JSON.stringify(updated)).catch(console.error);
  };

  // Instant save app restriction toggle for a specific child device
  const toggleAppRestrictionForChild = async (
    childDeviceId: string,
    targetPackage: string,
    appName: string,
    appCategory: 'Social' | 'Entertainment' | 'Gaming' | 'Productivity' | 'Utilities',
    appIcon: string,
    iconBg: string,
    active: boolean
  ): Promise<{ success: boolean; diagnostic: string }> => {
    const child = childDevices.find((d) => d.id === childDeviceId);
    const childName = child ? child.childName : 'Child';
    const deviceName = child ? child.deviceName : 'Device';
    const platform = child ? child.platform : 'android';

    // 1. Invoke native bridge with platform awareness
    const receipt = await ZenFocusNative.applyAppRestriction(targetPackage, active);

    // 2. Update policies with monotonic version and persist immediately to AsyncStorage
    let nextCount = 0;
    setPolicies((prev) => {
      const existingIndex = prev.findIndex(
        (p) => p.targetDeviceId === childDeviceId && p.targetPackage === targetPackage
      );
      let updated: RestrictionPolicy[];
      if (existingIndex >= 0) {
        updated = prev.map((p, idx) =>
          idx === existingIndex
            ? {
                ...p,
                desiredState: (active ? 'active' : 'inactive') as 'active' | 'inactive',
                version: p.version + 1,
                updatedAt: new Date().toISOString(),
              }
            : p
        );
      } else {
        const newPolicy: RestrictionPolicy = {
          id: `pol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          familyRelationshipId: 'fam_default',
          targetDeviceId: childDeviceId,
          ownerType: 'parent',
          policyType: 'app_block',
          targetPackage,
          appName,
          appCategory,
          appIcon,
          iconBg,
          desiredState: active ? 'active' : 'inactive',
          version: 1,
          scheduleDescription: platform === 'ios' ? 'Apple Screen Time Shield Active' : 'Enforced via Android DPC',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        updated = [...prev, newPolicy];
      }
      // Instant save to persistent storage
      AsyncStorage.setItem('zenfocus_policies', JSON.stringify(updated)).catch(console.error);
      nextCount = updated.filter(
        (p) => p.targetDeviceId === childDeviceId && p.desiredState === 'active'
      ).length;
      return updated;
    });

    // 3. Update child devices counter & sync timestamp
    setChildDevices((prev) => {
      const updated = prev.map((d) =>
        d.id === childDeviceId
          ? {
              ...d,
              activeRestrictionsCount: nextCount,
              lastSyncAt: new Date().toISOString(),
            }
          : d
      );
      AsyncStorage.setItem('zenfocus_child_devices', JSON.stringify(updated)).catch(console.error);
      return updated;
    });

    // 4. Update scanned apps list for this device if loaded
    setScannedAppsByDevice((prev) => {
      const devApps = prev[childDeviceId];
      if (!devApps) return prev;
      const updated = devApps.map((a) =>
        a.targetPackage === targetPackage ? { ...a, isRestricted: active } : a
      );
      AsyncStorage.setItem(`zenfocus_scanned_apps_${childDeviceId}`, JSON.stringify(updated)).catch(console.error);
      return {
        ...prev,
        [childDeviceId]: updated,
      };
    });

    // 5. Record audit event
    const auditItem: AuditEvent = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Parent Account',
      actorRole: 'PARENT',
      eventType: active ? 'POLICY_APPLIED' : 'POLICY_REMOVED',
      description: `⚡ Insta-Saved: ${appName} (${targetPackage}) set to ${active ? 'BLOCKED' : 'ALLOWED'} for ${childName}.`,
      safeDiagnostic: receipt.safeDiagnostic || (platform === 'ios' ? 'Screen Time shield applied' : 'DPC package suspended'),
    };
    setAuditEvents((prev) => [auditItem, ...prev]);

    return {
      success: receipt.status === 'applied' || receipt.status === 'queued',
      diagnostic: receipt.safeDiagnostic || `Insta-Saved to ${childName}'s device.`,
    };
  };

  /**
   * Scans installed applications on the selected child device.
   * - Uses Android PackageManager / DPC on Android devices
   * - Uses Apple Screen Time FamilyControls / ManagedSettings on iOS devices
   * - Returns comprehensive ScanResult with categorization and newly discovered app flags
   */
  const scanChildDeviceApps = async (childDeviceId: string): Promise<ScanResult> => {
    setIsScanningApps(true);
    const child = childDevices.find((d) => d.id === childDeviceId);
    const childName = child ? child.childName : 'Child';
    const deviceName = child ? child.deviceName : 'Device';
    const platform = child ? child.platform : activePlatform;

    try {
      // Simulate slight network/hardware scan delay for realistic UI feedback
      await new Promise((r) => setTimeout(r, 650));

      const rawScanned = await ZenFocusNative.scanInstalledApps(platform);

      // Correlate with current policies for this device
      const correlated: ScannedApp[] = rawScanned.map((app) => {
        const pol = policies.find(
          (p) => p.targetDeviceId === childDeviceId && p.targetPackage === app.targetPackage
        );
        return {
          ...app,
          isRestricted: pol ? pol.desiredState === 'active' : app.isRestricted,
        };
      });

      setScannedAppsByDevice((prev) => ({
        ...prev,
        [childDeviceId]: correlated,
      }));

      await AsyncStorage.setItem(
        `zenfocus_scanned_apps_${childDeviceId}`,
        JSON.stringify(correlated)
      );

      const scanResult: ScanResult = {
        childDeviceId,
        childName,
        platform,
        scannedAt: new Date().toISOString(),
        totalApps: correlated.length,
        restrictedCount: correlated.filter((a) => a.isRestricted).length,
        newlyDiscoveredCount: correlated.filter((a) => a.isNewlyDiscovered).length,
        apps: correlated,
        summary: {
          socialCount: correlated.filter((a) => a.appCategory === 'Social').length,
          gamingCount: correlated.filter((a) => a.appCategory === 'Gaming').length,
          entertainmentCount: correlated.filter((a) => a.appCategory === 'Entertainment').length,
          productivityCount: correlated.filter((a) => a.appCategory === 'Productivity').length,
          utilitiesCount: correlated.filter((a) => a.appCategory === 'Utilities').length,
          blockedCount: correlated.filter((a) => a.isRestricted).length,
        },
      };

      const auditItem: AuditEvent = {
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: 'App Scanner',
        actorRole: 'PARENT',
        eventType: 'DPC_ENROLLED',
        description: `Scanned ${correlated.length} apps for ${childName} (${platform.toUpperCase()}). ${scanResult.newlyDiscoveredCount} newly discovered.`,
        safeDiagnostic: `Platform scan completed via ${platform === 'ios' ? 'Apple FamilyControls / Screen Time' : 'Android PackageManager / DPC'}.`,
      };
      setAuditEvents((prev) => [auditItem, ...prev]);

      return scanResult;
    } finally {
      setIsScanningApps(false);
    }
  };

  const capabilities: DeviceCapabilities =
    activePlatform === 'ios' ? iosCapabilities : androidCapabilities;

  const requestIosAuthorization = async () => {
    await ZenFocusIos.requestFamilyControlsAuthorization();
    const updatedCaps = await ZenFocusIos.getCapabilities();
    setIosCapabilities(updatedCaps);
  };

  const [timer, setTimer] = useState<TimerState>({
    totalSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    isRunning: false,
    streakDays: 4,
  });

  // Load capabilities from both native engines on mount
  useEffect(() => {
    ZenFocusDpc.getCapabilities().then(setAndroidCapabilities);
    ZenFocusIos.getCapabilities().then(setIosCapabilities);
    loadPersistedData();
  }, []);

  // Timer interval effect
  useEffect(() => {
    let interval: any = null;
    if (timer.isRunning) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev.remainingSeconds <= 1) {
            clearInterval(interval);
            ZenFocusNative.stopStudySession();
            const completedMins = Math.max(1, Math.round(prev.totalSeconds / 60));
            setLastCompletedMinutes(completedMins);
            setIsCelebrationOpen(true);
            const sessionType = prev.sessionName || (completedMins >= 60 ? 'Mastery Study Flow' : 'Deep Work Session');
            const newSess: CompletedSession = {
              id: `sess_${Date.now()}`,
              durationMinutes: completedMins,
              completedAt: new Date().toISOString(),
              sessionType,
            };
            setStudyHistory((hist) => [newSess, ...hist]);
            return {
              ...prev,
              remainingSeconds: 0,
              isRunning: false,
              streakDays: prev.streakDays + 1,
            };
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning]);

  const loadPersistedData = async () => {
    try {
      const savedAccountStr = await AsyncStorage.getItem('zenfocus_user_account');
      if (savedAccountStr) {
        const parsed = JSON.parse(savedAccountStr) as UserAccount;
        setAccount(parsed);
        setActiveViewState(parsed.role === 'PARENT' ? 'PARENT' : 'CHILD');
      }

      const savedTheme = await AsyncStorage.getItem('zenfocus_theme');
      if (savedTheme) setThemeMode(savedTheme as 'light' | 'dark');

      const savedDevicesStr = await AsyncStorage.getItem('zenfocus_child_devices');
      if (savedDevicesStr) {
        const parsedDevices = JSON.parse(savedDevicesStr) as ChildDevice[];
        if (Array.isArray(parsedDevices) && parsedDevices.length > 0) {
          setChildDevices(parsedDevices);
        }
      }

      const savedSelectedId = await AsyncStorage.getItem('zenfocus_selected_child_id');
      if (savedSelectedId) {
        setSelectedChildDeviceId(savedSelectedId);
      }

      const savedPoliciesStr = await AsyncStorage.getItem('zenfocus_policies');
      if (savedPoliciesStr) {
        const parsedPolicies = JSON.parse(savedPoliciesStr) as RestrictionPolicy[];
        if (Array.isArray(parsedPolicies) && parsedPolicies.length > 0) {
          setPolicies(parsedPolicies);
        }
      }

      // Load cached scanned apps for each child device
      for (const d of DEFAULT_CHILD_DEVICES) {
        try {
          const cachedAppsStr = await AsyncStorage.getItem(`zenfocus_scanned_apps_${d.id}`);
          if (cachedAppsStr) {
            const parsedApps = JSON.parse(cachedAppsStr) as ScannedApp[];
            if (Array.isArray(parsedApps) && parsedApps.length > 0) {
              setScannedAppsByDevice((prev) => ({ ...prev, [d.id]: parsedApps }));
            }
          }
        } catch (_) {}
      }
    } catch (e) {
      // Ignore initial load error
    }
  };

  const registerAccount = async (name: string, email: string, role: UserRole, pairingCode?: string) => {
    const newAccount: UserAccount = {
      id: `usr_${Date.now()}`,
      name,
      email,
      role,
      pairingCode,
      createdAt: new Date().toISOString(),
    };
    setAccount(newAccount);
    setActiveViewState(role === 'PARENT' ? 'PARENT' : 'CHILD');
    if (role === 'PARENT') {
      // New parent account starts with zero child devices so only "+ Pair Child Device" is shown!
      setChildDevices([]);
      setSelectedChildDeviceId('');
      await AsyncStorage.setItem('zenfocus_child_devices', JSON.stringify([]));
      await AsyncStorage.removeItem('zenfocus_selected_child_id');
    } else {
      // On child account: strictly enforce host device platform
      setActivePlatform(Platform.OS === 'ios' ? 'ios' : 'android');
    }
    await AsyncStorage.setItem('zenfocus_user_account', JSON.stringify(newAccount));
  };

  const loginAccount = async (nameOrEmail: string, role: UserRole, customName?: string) => {
    const rawName = customName || (nameOrEmail.includes('@') ? nameOrEmail.split('@')[0] : nameOrEmail);
    const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const loggedInAccount: UserAccount = {
      id: `usr_${Date.now()}`,
      name: formattedName,
      email: nameOrEmail,
      role,
      createdAt: new Date().toISOString(),
    };
    setAccount(loggedInAccount);
    setActiveViewState(role === 'PARENT' ? 'PARENT' : 'CHILD');

    if (role === 'PARENT') {
      const savedDevicesStr = await AsyncStorage.getItem('zenfocus_child_devices');
      if (savedDevicesStr) {
        try {
          const parsed = JSON.parse(savedDevicesStr) as ChildDevice[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setChildDevices(parsed);
            setSelectedChildDeviceId(parsed[0].id);
            setActivePlatform(parsed[0].platform);
          }
        } catch (_) {}
      }
    } else {
      setActivePlatform(Platform.OS === 'ios' ? 'ios' : 'android');
    }
    await AsyncStorage.setItem('zenfocus_user_account', JSON.stringify(loggedInAccount));
  };

  const signOut = async () => {
    setAccount(null);
    setActiveViewState('CHILD');
    await AsyncStorage.removeItem('zenfocus_user_account');
  };

  const setActiveView = (view: 'CHILD' | 'PARENT') => {
    // Strict enforcement: A Child account CANNOT switch to Parent dashboard
    if (account?.role === 'CHILD' && view === 'PARENT') {
      console.warn('[ZenFocus] Security violation: Child accounts cannot access Parent dashboard');
      return;
    }
    setActiveViewState(view);
  };

  const toggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    AsyncStorage.setItem('zenfocus_theme', next);
  };

  const toggleSchedule = (scheduleId: string, active: boolean) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === scheduleId ? { ...s, active } : s))
    );
  };

  const generatePairingCode = () => {
    const randomCode = `ZEN-${Math.floor(1000 + Math.random() * 9000)}`;
    setActivePairingCode(randomCode);
    return randomCode;
  };

  const dismissDecisionNotice = () => {
    setLastDecisionNotice(null);
  };

  // Toggle Parent Policy: Executes native platform restriction (Android DPC or iOS Screen Time)
  const toggleParentPolicy = async (policyId: string, desiredState: 'active' | 'inactive'): Promise<CommandReceipt> => {
    const targetPolicy = policies.find((p) => p.id === policyId);
    if (!targetPolicy) throw new Error('Policy not found');

    const isSuspended = desiredState === 'active';
    const receipt = await ZenFocusNative.applyAppRestriction(targetPolicy.targetPackage, isSuspended);

    // Update policies with monotonic version increment
    const updated = policies.map((p) =>
      p.id === policyId
        ? {
            ...p,
            desiredState,
            version: p.version + 1,
            updatedAt: new Date().toISOString(),
          }
        : p
    );
    setPolicies(updated);
    AsyncStorage.setItem('zenfocus_policies', JSON.stringify(updated)).catch(console.error);

    // Append to immutable audit log
    const auditItem: AuditEvent = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Parent Account',
      actorRole: 'PARENT',
      eventType: isSuspended ? 'POLICY_APPLIED' : 'POLICY_REMOVED',
      description: `${targetPolicy.appName} (${targetPolicy.targetPackage}) set to ${desiredState} by Parent.`,
      safeDiagnostic: receipt.safeDiagnostic,
    };
    setAuditEvents((prev) => [auditItem, ...prev]);

    return receipt;
  };

  // Child Self-Imposed Policy: Student can only modify CHILD-owned policies
  const toggleChildSelfPolicy = (targetPackage: string, appName: string, active: boolean) => {
    // Check if locked by parent
    const parentRule = policies.find((p) => p.targetPackage === targetPackage && p.ownerType === 'parent');
    if (parentRule && parentRule.desiredState === 'active') {
      console.warn(`[ZenFocus] Child cannot override parent-owned restriction on ${appName}`);
      return;
    }

    setPolicies((prev) => {
      const existing = prev.find((p) => p.targetPackage === targetPackage && p.ownerType === 'child');
      let updated: RestrictionPolicy[];
      if (existing) {
        updated = prev.map((p) =>
          p.id === existing.id ? { ...p, desiredState: active ? 'active' : 'inactive', updatedAt: new Date().toISOString() } : p
        );
      } else {
        const newChildRule: RestrictionPolicy = {
          id: `pol_child_${Date.now()}`,
          familyRelationshipId: 'fam_default',
          targetDeviceId: selectedChildDeviceId,
          ownerType: 'child',
          policyType: 'focus_session',
          targetPackage,
          appName,
          appCategory: 'Productivity',
          appIcon: '🧘',
          iconBg: '#a99bff',
          desiredState: active ? 'active' : 'inactive',
          version: 1,
          scheduleDescription: 'Self-imposed for study focus',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        updated = [...prev, newChildRule];
      }
      AsyncStorage.setItem('zenfocus_policies', JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  };

  const addParentPolicy = (newPolicyData: Omit<RestrictionPolicy, 'id' | 'version' | 'createdAt' | 'updatedAt'>) => {
    const newPolicy: RestrictionPolicy = {
      ...newPolicyData,
      id: `pol_${Date.now()}`,
      targetDeviceId: newPolicyData.targetDeviceId || selectedChildDeviceId,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...policies, newPolicy];
    setPolicies(updated);
    AsyncStorage.setItem('zenfocus_policies', JSON.stringify(updated)).catch(console.error);
  };

  // Student submits an exception request
  const submitExceptionRequest = (targetPackage: string, appName: string, durationMinutes: number, reason: string) => {
    const newReq: ApprovalRequest = {
      id: `req_${Date.now()}`,
      childUserId: 'usr_leo_child',
      childName: selectedChildDevice.childName,
      targetDeviceId: selectedChildDeviceId,
      targetPackage,
      appName,
      durationMinutes,
      reason,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    setApprovalRequests((prev) => [newReq, ...prev]);

    const audit: AuditEvent = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: `${selectedChildDevice.childName} (Child)`,
      actorRole: 'CHILD',
      eventType: 'EXCEPTION_REQUESTED',
      description: `Requested ${durationMinutes}m for ${appName}: "${reason}"`,
    };
    setAuditEvents((prev) => [audit, ...prev]);
  };

  // Parent decides on an exception request
  const decideApprovalRequest = (requestId: string, approved: boolean) => {
    setApprovalRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: approved ? 'approved' : 'rejected',
              decisionBy: 'Parent (Verified)',
              decisionAt: new Date().toISOString(),
            }
          : r
      )
    );

    const targetReq = approvalRequests.find((r) => r.id === requestId);
    if (targetReq) {
      setLastDecisionNotice({
        appName: targetReq.appName,
        approved,
        durationMinutes: targetReq.durationMinutes,
      });

      if (approved) {
        const unlock: TemporaryUnlock = {
          targetPackage: targetReq.targetPackage,
          appName: targetReq.appName,
          expiresAt: new Date(Date.now() + targetReq.durationMinutes * 60 * 1000).toISOString(),
          durationMinutes: targetReq.durationMinutes,
        };
        setTemporaryUnlocks((prev) => [
          unlock,
          ...prev.filter((u) => u.targetPackage !== targetReq.targetPackage),
        ]);
        ZenFocusNative.applyAppRestriction(targetReq.targetPackage, false);
      }
    }

    const audit: AuditEvent = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Parent Account',
      actorRole: 'PARENT',
      eventType: approved ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED',
      description: `${approved ? 'Approved' : 'Rejected'} request for ${targetReq?.appName || 'App'}.`,
    };
    setAuditEvents((prev) => [audit, ...prev]);
  };

  // Timer controls
  const setTimerPreset = (minutes: number) => {
    const totalSecs = Math.max(60, Math.round(minutes * 60));
    const name = minutes >= 60 ? 'Extended Deep Study' : 'Focused Study';
    setTimer((prev) => ({
      ...prev,
      totalSeconds: totalSecs,
      remainingSeconds: totalSecs,
      isRunning: false,
      sessionName: name,
    }));
  };

  const setCustomTimer = (minutes: number, sessionName: string = 'Custom Study Session') => {
    const totalSecs = Math.max(60, Math.round(minutes * 60));
    setTimer((prev) => ({
      ...prev,
      totalSeconds: totalSecs,
      remainingSeconds: totalSecs,
      isRunning: false,
      sessionName,
    }));
  };

  const adjustTimer = (deltaMinutes: number) => {
    const deltaSecs = deltaMinutes * 60;
    setTimer((prev) => {
      let newRemaining: number;
      let newTotal: number;

      if (prev.isRunning) {
        newRemaining = Math.max(60, prev.remainingSeconds + deltaSecs);
        newTotal = Math.max(newRemaining, prev.totalSeconds + (deltaSecs > 0 ? deltaSecs : 0));
        ZenFocusNative.adjustStudySession(deltaMinutes);
      } else {
        newTotal = Math.max(300, prev.totalSeconds + deltaSecs);
        newRemaining = newTotal;
      }

      return {
        ...prev,
        totalSeconds: newTotal,
        remainingSeconds: newRemaining,
      };
    });
  };

  const startTimer = () => {
    const durationMins = Math.max(1, Math.round(timer.totalSeconds / 60));
    ZenFocusNative.startStudySession(durationMins, timer.sessionName || 'Focused Study');
    setTimer((prev) => ({ ...prev, isRunning: true }));
  };

  const pauseTimer = () => {
    setTimer((prev) => ({ ...prev, isRunning: false }));
  };

  const resetTimer = () => {
    if (timer.isRunning) {
      ZenFocusNative.stopStudySession();
    }
    setTimer((prev) => ({ ...prev, isRunning: false, remainingSeconds: prev.totalSeconds }));
  };

  const takeBreak = (minutes: number = 5) => {
    setIsCelebrationOpen(false);
    setTimer({
      totalSeconds: minutes * 60,
      remainingSeconds: minutes * 60,
      isRunning: true,
      streakDays: timer.streakDays,
    });
  };

  const recordCompletedSession = (durationMinutes: number, sessionType: string = 'Focused Study') => {
    const newSess: CompletedSession = {
      id: `sess_${Date.now()}`,
      durationMinutes,
      completedAt: new Date().toISOString(),
      sessionType,
    };
    setStudyHistory((prev) => [newSess, ...prev]);
  };

  // Effective restrictions calculation: UNION of active parent rules & active child rules
  const effectiveRestrictions = policies.filter((p) => p.desiredState === 'active');

  return (
    <ZenFocusContext.Provider
      value={{
        account,
        activeView,
        setActiveView,
        registerAccount,
        loginAccount,
        signOut,
        themeMode,
        toggleTheme,
        capabilities,
        activePlatform,
        setActivePlatform,
        androidCapabilities,
        iosCapabilities,
        requestIosAuthorization,
        policies,
        effectiveRestrictions,
        approvalRequests,
        auditEvents,
        schedules,
        toggleSchedule,
        activePairingCode,
        generatePairingCode,
        lastDecisionNotice,
        dismissDecisionNotice,
        timer,
        studyHistory,
        temporaryUnlocks,
        isCelebrationOpen,
        setIsCelebrationOpen,
        lastCompletedMinutes,
        takeBreak,
        recordCompletedSession,
        childDevices,
        selectedChildDeviceId,
        selectedChildDevice,
        selectChildDevice,
        pairNewChildDevice,
        removeChildDevice,
        toggleAppRestrictionForChild,
        activeParentTab,
        setActiveParentTab,
        scannedAppsByDevice,
        isScanningApps,
        scanChildDeviceApps,
        toggleParentPolicy,
        toggleChildSelfPolicy,
        addParentPolicy,
        submitExceptionRequest,
        decideApprovalRequest,
        setTimerPreset,
        setCustomTimer,
        adjustTimer,
        startTimer,
        pauseTimer,
        resetTimer,
      }}
    >
      {children}
    </ZenFocusContext.Provider>
  );
};

export const useZenFocus = () => {
  const context = useContext(ZenFocusContext);
  if (!context) throw new Error('useZenFocus must be used within a ZenFocusProvider');
  return context;
};
