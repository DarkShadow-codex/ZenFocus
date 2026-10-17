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

interface TimerState {
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  streakDays: number;
}

interface ZenFocusContextType {
  account: UserAccount | null;
  activeView: 'CHILD' | 'PARENT';
  setActiveView: (view: 'CHILD' | 'PARENT') => void;
  registerAccount: (name: string, email: string, role: UserRole, pairingCode?: string) => Promise<void>;
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
  // Policy actions
  toggleParentPolicy: (policyId: string, desiredState: 'active' | 'inactive') => Promise<CommandReceipt>;
  toggleChildSelfPolicy: (targetPackage: string, appName: string, active: boolean) => void;
  addParentPolicy: (newPolicy: Omit<RestrictionPolicy, 'id' | 'version' | 'createdAt' | 'updatedAt'>) => void;
  // Approval actions
  submitExceptionRequest: (targetPackage: string, appName: string, durationMinutes: number, reason: string) => void;
  decideApprovalRequest: (requestId: string, approved: boolean) => void;
  // Timer actions
  setTimerPreset: (minutes: number) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
}

const DEFAULT_POLICIES: RestrictionPolicy[] = [
  {
    id: 'pol_tiktok',
    familyRelationshipId: 'fam_default',
    targetDeviceId: 'dev_galaxy_s24',
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
    id: 'pol_instagram',
    familyRelationshipId: 'fam_default',
    targetDeviceId: 'dev_galaxy_s24',
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
    id: 'pol_youtube',
    familyRelationshipId: 'fam_default',
    targetDeviceId: 'dev_galaxy_s24',
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
];

const DEFAULT_APPROVALS: ApprovalRequest[] = [
  {
    id: 'req_001',
    childUserId: 'usr_leo_child',
    childName: 'Leo',
    targetDeviceId: 'dev_galaxy_s24',
    targetPackage: 'com.duolingo',
    appName: 'Duolingo',
    durationMinutes: 30,
    reason: 'Need 30 min to complete my French homework streak before dinner!',
    status: 'pending',
    requestedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

const ZenFocusContext = createContext<ZenFocusContextType | undefined>(undefined);

export const ZenFocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [activeView, setActiveViewState] = useState<'CHILD' | 'PARENT'>('CHILD');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [policies, setPolicies] = useState<RestrictionPolicy[]>(DEFAULT_POLICIES);
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
    appVersion: '1.0.0-dpc',
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

  const setActivePlatform = (platform: DevicePlatform) => {
    setActivePlatformState(platform);
    ZenFocusNative.setActivePlatformOverride(platform);
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
            const completedMins = Math.max(1, Math.round(prev.totalSeconds / 60));
            setLastCompletedMinutes(completedMins);
            setIsCelebrationOpen(true);
            const newSess: CompletedSession = {
              id: `sess_${Date.now()}`,
              durationMinutes: completedMins,
              completedAt: new Date().toISOString(),
              sessionType: 'Deep Work Session',
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
    // In child account: only child dashboard is visible
    // In parent account: both dashboards are accessible, defaults to PARENT
    setActiveViewState(role === 'PARENT' ? 'PARENT' : 'CHILD');
    await AsyncStorage.setItem('zenfocus_user_account', JSON.stringify(newAccount));
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

  // Toggle Parent Policy: Executes native platform restriction (Android DPC or iOS Screen Time)
  const toggleParentPolicy = async (policyId: string, desiredState: 'active' | 'inactive'): Promise<CommandReceipt> => {
    const targetPolicy = policies.find((p) => p.id === policyId);
    if (!targetPolicy) throw new Error('Policy not found');

    const isSuspended = desiredState === 'active';
    const receipt = await ZenFocusNative.applyAppRestriction(targetPolicy.targetPackage, isSuspended);

    // Update policies with monotonic version increment
    setPolicies((prev) =>
      prev.map((p) =>
        p.id === policyId
          ? {
              ...p,
              desiredState,
              version: p.version + 1,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );

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
      if (existing) {
        return prev.map((p) =>
          p.id === existing.id ? { ...p, desiredState: active ? 'active' : 'inactive', updatedAt: new Date().toISOString() } : p
        );
      } else {
        const newChildRule: RestrictionPolicy = {
          id: `pol_child_${Date.now()}`,
          familyRelationshipId: 'fam_default',
          targetDeviceId: 'dev_galaxy_s24',
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
        return [...prev, newChildRule];
      }
    });
  };

  const addParentPolicy = (newPolicyData: Omit<RestrictionPolicy, 'id' | 'version' | 'createdAt' | 'updatedAt'>) => {
    const newPolicy: RestrictionPolicy = {
      ...newPolicyData,
      id: `pol_${Date.now()}`,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPolicies((prev) => [...prev, newPolicy]);
  };

  // Student submits an exception request
  const submitExceptionRequest = (targetPackage: string, appName: string, durationMinutes: number, reason: string) => {
    const newReq: ApprovalRequest = {
      id: `req_${Date.now()}`,
      childUserId: 'usr_leo_child',
      childName: 'Leo',
      targetDeviceId: 'dev_galaxy_s24',
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
      actor: 'Leo (Child)',
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
    setTimer((prev) => ({
      ...prev,
      totalSeconds: minutes * 60,
      remainingSeconds: minutes * 60,
      isRunning: false,
    }));
  };

  const startTimer = () => {
    setTimer((prev) => ({ ...prev, isRunning: true }));
  };

  const pauseTimer = () => {
    setTimer((prev) => ({ ...prev, isRunning: false }));
  };

  const resetTimer = () => {
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
        toggleParentPolicy,
        toggleChildSelfPolicy,
        addParentPolicy,
        submitExceptionRequest,
        decideApprovalRequest,
        setTimerPreset,
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
