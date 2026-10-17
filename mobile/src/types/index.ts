export type UserRole = 'PARENT' | 'CHILD';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pairingCode?: string;
  createdAt: string;
}

export type DevicePlatform = 'android' | 'ios';

export type PolicyOwner = 'parent' | 'child';

export type PolicyType = 'app_block' | 'category_block' | 'domain_block' | 'focus_session' | 'notification_focus';

export type EnforcementResultStatus = 'applied' | 'partial' | 'failed' | 'unsupported' | 'queued' | 'offline';

export interface AndroidDpcCapabilities {
  platform: 'android';
  isDeviceOwner: boolean;
  isProfileOwner: boolean;
  dpcEnrolled: boolean;
  setPackagesSuspendedSupported: boolean;
  setUninstallBlockedSupported: boolean;
  dndAccessGranted: boolean;
  batteryOptimizationIgnored: boolean;
  osVersion: string;
  appVersion: string;
}

export interface IosScreenTimeCapabilities {
  platform: 'ios';
  familyControlsAuthorized: boolean;
  managedSettingsShieldSupported: boolean;
  deviceActivityScheduled: boolean;
  denyAppRemovalSupported: boolean;
  shieldCustomizationActive: boolean;
  shieldsCurrentlyApplied: boolean;
  denyAppRemovalActive: boolean;
  osVersion: string;
  appVersion: string;
}

export type DeviceCapabilities = AndroidDpcCapabilities | IosScreenTimeCapabilities;

export interface RestrictionPolicy {
  id: string;
  familyRelationshipId: string;
  targetDeviceId: string;
  ownerType: PolicyOwner;
  policyType: PolicyType;
  targetPackage: string; // Android package name, e.g. "com.zhiliaoapp.musically"
  appName: string;
  appCategory: 'Social' | 'Entertainment' | 'Gaming' | 'Productivity';
  appIcon: string;
  iconBg: string;
  desiredState: 'active' | 'inactive';
  version: number;
  scheduleDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRequest {
  id: string;
  childUserId: string;
  childName: string;
  targetDeviceId: string;
  targetPackage: string;
  appName: string;
  durationMinutes: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requestedAt: string;
  decisionBy?: string;
  decisionAt?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: UserRole;
  eventType: 'POLICY_APPLIED' | 'POLICY_REMOVED' | 'EXCEPTION_REQUESTED' | 'REQUEST_APPROVED' | 'REQUEST_REJECTED' | 'DPC_ENROLLED';
  description: string;
  safeDiagnostic?: string;
}

export interface CommandReceipt {
  commandId: string;
  targetDeviceId: string;
  policyId: string;
  policyVersion: number;
  status: EnforcementResultStatus;
  platformCode?: string;
  platformErrorCode?: string;
  safeDiagnostic?: string;
  reportedAt: string;
}

export interface Schedule {
  id: string;
  name: string;
  days: string[];
  startTime: string;
  endTime: string;
  active: boolean;
  category: 'School' | 'Bedtime' | 'Study';
}

export interface PairingInvitation {
  code: string;
  expiresAt: string;
  status: 'invitation_created' | 'awaiting_child_acceptance' | 'awaiting_android_enrollment' | 'active';
}

export interface CompletedSession {
  id: string;
  durationMinutes: number;
  completedAt: string;
  sessionType: string;
}

export interface TemporaryUnlock {
  targetPackage: string;
  appName: string;
  expiresAt: string;
  durationMinutes: number;
}
