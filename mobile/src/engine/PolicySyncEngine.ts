// ============================================================================
// ZENFOCUS POLICY SYNCHRONIZATION & PAIRING ENGINE
// Versioned Sync, Durable Command Queue, Single-Use Pairing, & Conflict Resolution
// Derived from Sections 6, 7, 8 & 9 of ZENFOCUS Master Implementation Specification
// ============================================================================

import {
  RestrictionPolicy,
  CommandReceipt,
  Schedule,
  ChildDevice,
  DevicePlatform,
  PolicyOwner,
  AuditEvent,
} from '../types';

export interface PairingSession {
  code: string; // e.g. "ZEN-8942"
  parentUserId: string;
  parentName: string;
  expiresAt: number; // wall-clock ms
  attempts: number;
  maxAttempts: number;
  status: 'PENDING' | 'REDEEMED' | 'EXPIRED' | 'LOCKED';
  createdAt: number;
}

export interface DurableCommand {
  commandId: string;
  targetDeviceId: string;
  policyId: string;
  policyVersion: number;
  action: 'APPLY_RESTRICTION' | 'REMOVE_RESTRICTION' | 'SCHEDULE_WINDOW' | 'REVOKE_DEVICE';
  payload: Record<string, any>;
  status: 'queued' | 'in_flight' | 'applied' | 'partial' | 'failed' | 'unsupported' | 'offline';
  retryCount: number;
  maxRetries: number;
  createdAt: number;
  expiresAt: number;
  receipt?: CommandReceipt;
}

export interface SyncResult {
  appliedCount: number;
  rejectedCount: number;
  conflictsResolved: number;
  receipts: CommandReceipt[];
}

export class PolicySyncEngine {
  private activePairingSessions: Map<string, PairingSession> = new Map();
  private commandQueue: DurableCommand[] = [];
  private localPolicyStore: Map<string, RestrictionPolicy> = new Map();
  private auditLog: AuditEvent[] = [];

  constructor(initialPolicies?: RestrictionPolicy[]) {
    if (initialPolicies) {
      for (const pol of initialPolicies) {
        this.localPolicyStore.set(pol.id, { ...pol });
      }
    }
  }

  // ===========================================================================
  // SECTION 6: PARENT-CHILD PAIRING & AUTHORIZATION
  // ===========================================================================

  /**
   * Generates a short-lived, single-use pairing code with 15-minute expiration
   */
  public generatePairingCode(
    parentUserId: string,
    parentName: string,
    validDurationMs: number = 15 * 60 * 1000
  ): PairingSession {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const code = `ZEN-${randomDigits}`;
    const now = Date.now();

    const session: PairingSession = {
      code,
      parentUserId,
      parentName,
      expiresAt: now + validDurationMs,
      attempts: 0,
      maxAttempts: 5,
      status: 'PENDING',
      createdAt: now,
    };

    this.activePairingSessions.set(code, session);
    this.recordAudit({
      id: `aud_pair_gen_${now}`,
      timestamp: new Date(now).toISOString(),
      actor: parentName,
      actorRole: 'PARENT',
      eventType: 'DPC_ENROLLED',
      description: `Generated pairing invitation PIN ${code} (expires in ${Math.round(validDurationMs / 60000)}m).`,
    });

    return session;
  }

  /**
   * Validates and redeems a single-use pairing code.
   * Enforces expiration, attempt rate limiting, and single-use redemption.
   */
  public redeemPairingCode(
    code: string,
    childUserId: string,
    childName: string,
    platform: DevicePlatform
  ): {
    success: boolean;
    error?: string;
    parentUserId?: string;
    parentName?: string;
    newDeviceId?: string;
  } {
    const session = this.activePairingSessions.get(code.trim().toUpperCase());
    const now = Date.now();

    if (!session) {
      return { success: false, error: 'INVALID_PAIRING_CODE: Code not found.' };
    }

    if (session.status === 'LOCKED') {
      return { success: false, error: 'RATE_LIMIT_EXCEEDED: Too many failed pairing attempts. Code is locked.' };
    }

    if (session.status === 'REDEEMED') {
      return { success: false, error: 'ALREADY_REDEEMED: This pairing code has already been used.' };
    }

    if (now > session.expiresAt) {
      session.status = 'EXPIRED';
      return { success: false, error: 'PAIRING_CODE_EXPIRED: Pairing invitation has expired. Request a new code.' };
    }

    session.attempts += 1;
    if (session.attempts > session.maxAttempts) {
      session.status = 'LOCKED';
      return { success: false, error: 'RATE_LIMIT_EXCEEDED: Maximum attempts reached. Code is locked.' };
    }

    // Success: mark single-use redemption
    session.status = 'REDEEMED';
    const newDeviceId = `dev_${childName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

    this.recordAudit({
      id: `aud_pair_redeem_${now}`,
      timestamp: new Date(now).toISOString(),
      actor: childName,
      actorRole: 'CHILD',
      eventType: 'DPC_ENROLLED',
      description: `Child device paired successfully using PIN ${code} under ${session.parentName}. Platform: ${platform.toUpperCase()}.`,
    });

    return {
      success: true,
      parentUserId: session.parentUserId,
      parentName: session.parentName,
      newDeviceId,
    };
  }

  /**
   * Revokes a child device relationship.
   */
  public revokeChildDevice(deviceId: string, parentUserId: string): boolean {
    const now = Date.now();
    // Invalidate any queued commands for this device
    this.commandQueue = this.commandQueue.filter((c) => c.targetDeviceId !== deviceId);

    // Deactivate policies belonging to this device
    for (const [id, pol] of this.localPolicyStore.entries()) {
      if (pol.targetDeviceId === deviceId) {
        this.localPolicyStore.set(id, {
          ...pol,
          desiredState: 'inactive',
          version: pol.version + 1,
          updatedAt: new Date(now).toISOString(),
        });
      }
    }

    this.recordAudit({
      id: `aud_revoke_${now}`,
      timestamp: new Date(now).toISOString(),
      actor: parentUserId,
      actorRole: 'PARENT',
      eventType: 'POLICY_REMOVED',
      description: `Revoked authorization for child device ${deviceId}. All restrictions cleared.`,
    });

    return true;
  }

  // ===========================================================================
  // SECTION 7: REMOTE POLICY SYNCHRONIZATION & MONOTONIC VERSIONING
  // ===========================================================================

  /**
   * Creates a versioned policy command and pushes to durable queue
   */
  public queuePolicyUpdate(
    policy: Omit<RestrictionPolicy, 'version' | 'createdAt' | 'updatedAt'>,
    ownerRole: 'PARENT' | 'CHILD'
  ): DurableCommand {
    const existing = this.localPolicyStore.get(policy.id);
    const nextVersion = existing ? existing.version + 1 : 1;
    const now = Date.now();

    // Verify ownership security rule: Child cannot modify parent-owned policy
    if (existing && existing.ownerType === 'parent' && ownerRole === 'CHILD') {
      throw new Error('IMMUTABLE_OWNERSHIP_VIOLATION: Child account cannot modify or remove parent-owned policy.');
    }

    const updatedPolicy: RestrictionPolicy = {
      ...policy,
      version: nextVersion,
      createdAt: existing ? existing.createdAt : new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
    };

    this.localPolicyStore.set(policy.id, updatedPolicy);

    const command: DurableCommand = {
      commandId: `cmd_${now}_${Math.random().toString(36).substring(2, 7)}`,
      targetDeviceId: policy.targetDeviceId,
      policyId: policy.id,
      policyVersion: nextVersion,
      action: policy.desiredState === 'active' ? 'APPLY_RESTRICTION' : 'REMOVE_RESTRICTION',
      payload: { ...updatedPolicy },
      status: 'queued',
      retryCount: 0,
      maxRetries: 3,
      createdAt: now,
      expiresAt: now + 24 * 3600 * 1000, // 24-hour command TTL
    };

    this.commandQueue.push(command);
    return command;
  }

  /**
   * Dispatches pending commands to child device with version validation & conflict resolution.
   * Supports offline devices, out-of-order rejection, and idempotent duplicate handling.
   */
  public syncPendingCommands(
    targetDeviceId: string,
    isDeviceOnline: boolean,
    nativeApplyFn: (cmd: DurableCommand) => Promise<CommandReceipt>
  ): Promise<SyncResult> {
    return new Promise(async (resolve) => {
      const receipts: CommandReceipt[] = [];
      let appliedCount = 0;
      let rejectedCount = 0;
      let conflictsResolved = 0;

      const deviceCommands = this.commandQueue.filter(
        (c) => c.targetDeviceId === targetDeviceId && (c.status === 'queued' || c.status === 'offline')
      );

      // Sort monotonically by policyVersion to ensure correct sequencing
      deviceCommands.sort((a, b) => a.policyVersion - b.policyVersion);

      if (!isDeviceOnline) {
        // Device is offline: retain commands in queue as 'offline'
        for (const cmd of deviceCommands) {
          cmd.status = 'offline';
          const offlineReceipt: CommandReceipt = {
            commandId: cmd.commandId,
            targetDeviceId,
            policyId: cmd.policyId,
            policyVersion: cmd.policyVersion,
            status: 'offline',
            safeDiagnostic: 'Child device currently offline. Command retained in durable queue for reconnection.',
            reportedAt: new Date().toISOString(),
          };
          cmd.receipt = offlineReceipt;
          receipts.push(offlineReceipt);
        }
        return resolve({ appliedCount: 0, rejectedCount: 0, conflictsResolved: 0, receipts });
      }

      for (const cmd of deviceCommands) {
        // Check command expiration
        if (Date.now() > cmd.expiresAt) {
          cmd.status = 'failed';
          rejectedCount++;
          const expiredReceipt: CommandReceipt = {
            commandId: cmd.commandId,
            targetDeviceId,
            policyId: cmd.policyId,
            policyVersion: cmd.policyVersion,
            status: 'failed',
            platformErrorCode: 'COMMAND_EXPIRED',
            safeDiagnostic: 'Command expired before target device reported receipt.',
            reportedAt: new Date().toISOString(),
          };
          cmd.receipt = expiredReceipt;
          receipts.push(expiredReceipt);
          continue;
        }

        // Monotonic version verification against current applied version
        const currentPolicy = this.localPolicyStore.get(cmd.policyId);
        if (currentPolicy && cmd.policyVersion < currentPolicy.version) {
          // Stale / out-of-order message rejection
          cmd.status = 'failed';
          rejectedCount++;
          conflictsResolved++;
          const staleReceipt: CommandReceipt = {
            commandId: cmd.commandId,
            targetDeviceId,
            policyId: cmd.policyId,
            policyVersion: cmd.policyVersion,
            status: 'failed',
            platformErrorCode: 'STALE_POLICY_VERSION_REJECTED',
            safeDiagnostic: `Rejected stale policy v${cmd.policyVersion}; device already at v${currentPolicy.version}.`,
            reportedAt: new Date().toISOString(),
          };
          cmd.receipt = staleReceipt;
          receipts.push(staleReceipt);
          continue;
        }

        // Apply via native adapter
        try {
          cmd.status = 'in_flight';
          const receipt = await nativeApplyFn(cmd);
          cmd.status = receipt.status;
          cmd.receipt = receipt;
          receipts.push(receipt);
          if (receipt.status === 'applied') {
            appliedCount++;
          } else {
            rejectedCount++;
          }
        } catch (err: any) {
          cmd.retryCount++;
          if (cmd.retryCount >= cmd.maxRetries) {
            cmd.status = 'failed';
          } else {
            cmd.status = 'queued'; // Will retry on next sync pass
          }
          rejectedCount++;
          receipts.push({
            commandId: cmd.commandId,
            targetDeviceId,
            policyId: cmd.policyId,
            policyVersion: cmd.policyVersion,
            status: 'failed',
            platformErrorCode: 'ADAPTER_EXECUTION_ERROR',
            safeDiagnostic: err?.message || 'Native adapter error during enforcement.',
            reportedAt: new Date().toISOString(),
          });
        }
      }

      // Cleanup resolved commands from queue
      this.commandQueue = this.commandQueue.filter((c) => c.status !== 'applied');

      resolve({ appliedCount, rejectedCount, conflictsResolved, receipts });
    });
  }

  // ===========================================================================
  // SECTION 8 & 9: SCHEDULING, TIME LIMITS, & CONFLICT RESOLUTION
  // ===========================================================================

  /**
   * Resolves conflicting schedules according to strict priority order:
   * Priority: 'Bedtime' (100) > 'School' (80) > 'Study' (50)
   * If a Bedtime schedule is active, study breaks or temporary unlocks cannot override it.
   */
  public resolveActiveSchedules(
    schedules: Schedule[],
    referenceDate: Date = new Date()
  ): {
    hasActiveSchedule: boolean;
    activeCategory?: 'School' | 'Bedtime' | 'Study';
    activeScheduleName?: string;
    shouldBlockDistractions: boolean;
  } {
    const activeSchedules = schedules.filter((s) => s.active && this.isScheduleActiveAt(s, referenceDate));

    if (activeSchedules.length === 0) {
      return { hasActiveSchedule: false, shouldBlockDistractions: false };
    }

    // Rank by priority
    const priorityWeights: Record<string, number> = {
      Bedtime: 100,
      School: 80,
      Study: 50,
    };

    activeSchedules.sort((a, b) => (priorityWeights[b.category] || 0) - (priorityWeights[a.category] || 0));

    const highest = activeSchedules[0];
    return {
      hasActiveSchedule: true,
      activeCategory: highest.category,
      activeScheduleName: highest.name,
      shouldBlockDistractions: true,
    };
  }

  /**
   * Evaluates if a recurring schedule is active at a given timestamp
   */
  public isScheduleActiveAt(schedule: Schedule, date: Date): boolean {
    if (!schedule.active) return false;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = dayNames[date.getDay()];

    const isDayMatch = schedule.days.includes('Daily') || schedule.days.includes(currentDay);
    if (!isDayMatch) return false;

    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const currentMinutes = date.getHours() * 60 + date.getMinutes();

    if (startMinutes <= endMinutes) {
      // Standard daytime window, e.g. 08:00 - 15:30
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Overnight bedtime window, e.g. 21:00 - 07:00
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  /**
   * Union rule: Computes effective restrictions combining active parent & child rules
   * Parent rules cannot be subtracted or bypassed by child self-rules.
   */
  public computeEffectiveRestrictions(
    policies: RestrictionPolicy[],
    childDeviceId: string
  ): RestrictionPolicy[] {
    const devicePolicies = policies.filter(
      (p) => p.targetDeviceId === childDeviceId || p.targetDeviceId === 'local_device'
    );

    const activeParent = devicePolicies.filter((p) => p.ownerType === 'parent' && p.desiredState === 'active');
    const activeChild = devicePolicies.filter((p) => p.ownerType === 'child' && p.desiredState === 'active');

    const map = new Map<string, RestrictionPolicy>();

    // 1. Add all active parent rules (authoritative)
    for (const p of activeParent) {
      map.set(p.targetPackage, p);
    }

    // 2. Add child-owned rules only where not conflicting with an active parent rule
    for (const c of activeChild) {
      if (!map.has(c.targetPackage)) {
        map.set(c.targetPackage, c);
      }
    }

    return Array.from(map.values());
  }

  public getPolicies(): RestrictionPolicy[] {
    return Array.from(this.localPolicyStore.values());
  }

  public getAuditLog(): AuditEvent[] {
    return [...this.auditLog];
  }

  private recordAudit(event: AuditEvent) {
    this.auditLog.unshift(event);
  }
}
