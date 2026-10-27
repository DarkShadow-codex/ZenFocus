// ============================================================================
// ZENFOCUS DETERMINISTIC SHARED FOCUS ENGINE
// State Machine, Deadline-Based Calculation, Monotonic Time, & Process Recovery
// Derived from Section 3 of ZENFOCUS Master Implementation Specification
// ============================================================================

export type FocusState =
  | 'IDLE'
  | 'PREPARING'
  | 'FOCUSING'
  | 'BREAK'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ERROR';

export interface FocusSessionMetadata {
  id: string;
  sessionType: string;
  durationMinutes: number;
  breakDurationMinutes: number;
  strictMode: boolean;
  selectedApps: string[];
  selectedCategories: string[];
  createdAt: string;
  startedAt?: number; // wall-clock ms
  deadline?: number;  // wall-clock ms = startedAt + (durationMinutes * 60 * 1000)
  completedAt?: string;
  pausedAt?: number;
  totalPausedDurationMs: number;
  status: FocusState;
  recoveryMetadata: {
    lastHeartbeatWallClock: number;
    lastKnownMonotonicMs: number;
    processStartWallClock: number;
    resumedCount: number;
  };
}

export interface FocusEngineConfig {
  defaultDurationMinutes?: number;
  defaultBreakMinutes?: number;
  strictMode?: boolean;
}

export type FocusEvent =
  | { type: 'PREPARE'; durationMinutes?: number; sessionType?: string; strictMode?: boolean; selectedApps?: string[] }
  | { type: 'START' }
  | { type: 'PAUSE'; reason?: string }
  | { type: 'RESUME' }
  | { type: 'START_BREAK'; breakDurationMinutes?: number }
  | { type: 'END_BREAK' }
  | { type: 'ADJUST_DEADLINE'; deltaMinutes: number }
  | { type: 'CANCEL'; isParentAuthorized?: boolean }
  | { type: 'COMPLETE' }
  | { type: 'HEARTBEAT'; wallClockMs?: number; monotonicMs?: number }
  | { type: 'ERROR'; message: string };

// Strict valid transition matrix
const VALID_TRANSITIONS: Record<FocusState, FocusState[]> = {
  IDLE: ['PREPARING'],
  PREPARING: ['FOCUSING', 'CANCELLED', 'ERROR'],
  FOCUSING: ['PAUSED', 'BREAK', 'COMPLETED', 'CANCELLED', 'ERROR'],
  BREAK: ['FOCUSING', 'COMPLETED', 'CANCELLED', 'ERROR'],
  PAUSED: ['FOCUSING', 'CANCELLED', 'ERROR'],
  COMPLETED: ['IDLE'],
  CANCELLED: ['IDLE'],
  ERROR: ['IDLE'],
};

export class FocusEngine {
  private state: FocusState = 'IDLE';
  private currentSession: FocusSessionMetadata | null = null;
  private isCompletionIdempotentHandled = false;
  private onStateChangeListeners: Array<(state: FocusState, session: FocusSessionMetadata | null) => void> = [];
  private onSessionCompletedListeners: Array<(session: FocusSessionMetadata) => void> = [];

  constructor(initialSession?: FocusSessionMetadata) {
    if (initialSession) {
      this.recoverSession(initialSession, Date.now(), this.getMonotonicTimeMs());
    }
  }

  /**
   * Helper to get system monotonic time in milliseconds
   * Uses performance.now() where available, with fallback to Date.now()
   */
  public getMonotonicTimeMs(): number {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now();
    }
    return Date.now();
  }

  public getState(): FocusState {
    return this.state;
  }

  public getCurrentSession(): FocusSessionMetadata | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  public subscribe(listener: (state: FocusState, session: FocusSessionMetadata | null) => void): () => void {
    this.onStateChangeListeners.push(listener);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter((l) => l !== listener);
    };
  }

  public onCompleted(listener: (session: FocusSessionMetadata) => void): () => void {
    this.onSessionCompletedListeners.push(listener);
    return () => {
      this.onSessionCompletedListeners = this.onSessionCompletedListeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.onStateChangeListeners) {
      try {
        listener(this.state, this.getCurrentSession());
      } catch (err) {
        console.error('FocusEngine listener error:', err);
      }
    }
  }

  /**
   * Evaluates if a transition is valid according to the state machine
   */
  public canTransition(targetState: FocusState): boolean {
    return VALID_TRANSITIONS[this.state]?.includes(targetState) ?? false;
  }

  /**
   * Main transition handler with policy checks (e.g. Strict Mode)
   */
  public transition(targetState: FocusState, reason?: string): boolean {
    if (!this.canTransition(targetState)) {
      console.warn(`FocusEngine: Invalid transition rejected: ${this.state} -> ${targetState} (${reason || 'no reason'})`);
      return false;
    }

    // Policy check: Strict Mode prevents PAUSE unless authorized or policy allows
    if (targetState === 'PAUSED' && this.currentSession?.strictMode) {
      console.warn('FocusEngine: Cannot pause session while Strict Mode is active.');
      return false;
    }

    // Policy check: Strict Mode prevents CANCEL unless parent-authorized
    if (targetState === 'CANCELLED' && this.currentSession?.strictMode && reason !== 'PARENT_OVERRIDE') {
      console.warn('FocusEngine: Self-cancellation blocked by Strict Mode. Parent authorization required.');
      return false;
    }

    this.state = targetState;
    if (this.currentSession) {
      this.currentSession.status = targetState;
    }

    this.notify();
    return true;
  }

  /**
   * Prepares a new focus session
   */
  public prepareSession(config: {
    durationMinutes: number;
    breakDurationMinutes?: number;
    sessionType?: string;
    strictMode?: boolean;
    selectedApps?: string[];
    selectedCategories?: string[];
  }): boolean {
    if (this.state !== 'IDLE' && this.state !== 'COMPLETED' && this.state !== 'CANCELLED' && this.state !== 'ERROR') {
      console.warn(`FocusEngine: Cannot prepare new session from state ${this.state}`);
      return false;
    }

    if (this.state !== 'IDLE') {
      this.state = 'IDLE';
    }

    const now = Date.now();
    const monotonicNow = this.getMonotonicTimeMs();

    this.isCompletionIdempotentHandled = false;
    this.currentSession = {
      id: `sess_${now}_${Math.random().toString(36).substring(2, 7)}`,
      sessionType: config.sessionType || (config.durationMinutes >= 60 ? 'Mastery Study Flow' : 'Deep Work Session'),
      durationMinutes: Math.max(1, config.durationMinutes),
      breakDurationMinutes: config.breakDurationMinutes ?? 5,
      strictMode: config.strictMode ?? false,
      selectedApps: config.selectedApps || [],
      selectedCategories: config.selectedCategories || ['Social', 'Entertainment', 'Gaming'],
      createdAt: new Date(now).toISOString(),
      totalPausedDurationMs: 0,
      status: 'PREPARING',
      recoveryMetadata: {
        lastHeartbeatWallClock: now,
        lastKnownMonotonicMs: monotonicNow,
        processStartWallClock: now,
        resumedCount: 0,
      },
    };

    this.state = 'PREPARING';
    this.notify();
    return true;
  }

  /**
   * Starts or resumes the focusing session
   */
  public startFocus(): boolean {
    if (this.state === 'PREPARING') {
      if (!this.currentSession) return false;
      const now = Date.now();
      const monotonicNow = this.getMonotonicTimeMs();
      const durationMs = this.currentSession.durationMinutes * 60 * 1000;

      this.currentSession.startedAt = now;
      this.currentSession.deadline = now + durationMs;
      this.currentSession.recoveryMetadata.lastHeartbeatWallClock = now;
      this.currentSession.recoveryMetadata.lastKnownMonotonicMs = monotonicNow;

      this.state = 'FOCUSING';
      this.currentSession.status = 'FOCUSING';
      this.notify();
      return true;
    }

    if (this.state === 'PAUSED' || this.state === 'BREAK') {
      const now = Date.now();
      if (this.currentSession && this.currentSession.pausedAt) {
        const pauseDuration = now - this.currentSession.pausedAt;
        this.currentSession.totalPausedDurationMs += pauseDuration;
        // Extend the deadline by the paused duration so student gets full allocated study time
        if (this.currentSession.deadline) {
          this.currentSession.deadline += pauseDuration;
        }
        this.currentSession.pausedAt = undefined;
      }
      this.state = 'FOCUSING';
      if (this.currentSession) this.currentSession.status = 'FOCUSING';
      this.notify();
      return true;
    }

    return false;
  }

  /**
   * Pauses the active session (if permitted by policy)
   */
  public pauseFocus(reason?: string): boolean {
    if (this.state !== 'FOCUSING') return false;
    if (this.currentSession?.strictMode) {
      console.warn('FocusEngine: Cannot pause because Strict Mode is enabled.');
      return false;
    }

    const now = Date.now();
    if (this.currentSession) {
      this.currentSession.pausedAt = now;
    }

    return this.transition('PAUSED', reason);
  }

  /**
   * Takes a study break
   */
  public startBreak(breakMinutes?: number): boolean {
    if (this.state !== 'FOCUSING') return false;
    const now = Date.now();
    if (this.currentSession) {
      this.currentSession.pausedAt = now;
      if (breakMinutes) {
        this.currentSession.breakDurationMinutes = breakMinutes;
      }
    }
    return this.transition('BREAK');
  }

  /**
   * Adjusts active session deadline (+/- minutes)
   */
  public adjustDeadline(deltaMinutes: number): boolean {
    if (!this.currentSession || !this.currentSession.deadline) return false;
    if (this.state !== 'FOCUSING' && this.state !== 'PAUSED' && this.state !== 'BREAK') return false;

    const deltaMs = deltaMinutes * 60 * 1000;
    const newDeadline = this.currentSession.deadline + deltaMs;
    const now = Date.now();

    // Prevent reducing deadline below current elapsed time
    if (newDeadline <= now) {
      console.warn('FocusEngine: Cannot adjust deadline to a past timestamp.');
      return false;
    }

    this.currentSession.deadline = newDeadline;
    this.currentSession.durationMinutes = Math.max(1, this.currentSession.durationMinutes + deltaMinutes);
    this.notify();
    return true;
  }

  /**
   * Authoritative remaining duration calculation
   * Compares the stored session deadline against current time
   */
  public getRemainingDurationMs(wallClockNow: number = Date.now()): number {
    if (!this.currentSession || !this.currentSession.deadline) {
      return 0;
    }

    if (this.state === 'COMPLETED' || this.state === 'CANCELLED' || this.state === 'IDLE') {
      return 0;
    }

    if (this.state === 'PAUSED' && this.currentSession.pausedAt) {
      // While paused, deadline extends so remaining time is frozen from pausedAt
      return Math.max(0, this.currentSession.deadline - this.currentSession.pausedAt);
    }

    return Math.max(0, this.currentSession.deadline - wallClockNow);
  }

  public getRemainingSeconds(wallClockNow: number = Date.now()): number {
    return Math.ceil(this.getRemainingDurationMs(wallClockNow) / 1000);
  }

  /**
   * Heartbeat to detect clock tampering or deadline expiration
   */
  public heartbeat(wallClockNow: number = Date.now(), monotonicNow: number = this.getMonotonicTimeMs()): FocusState {
    if (!this.currentSession) return this.state;

    // Detect clock rollback or forward jump:
    const prevHeartbeat = this.currentSession.recoveryMetadata.lastHeartbeatWallClock;
    const prevMonotonic = this.currentSession.recoveryMetadata.lastKnownMonotonicMs;
    const wallClockDelta = wallClockNow - prevHeartbeat;
    const monotonicDelta = monotonicNow - prevMonotonic;

    // If clock stepped backwards significantly (> 5s) while monotonic moved forward
    if (wallClockDelta < -5000 && monotonicDelta > 0) {
      console.warn('FocusEngine: System wall-clock rollback detected. Compensating using monotonic clock.');
      if (this.currentSession.deadline) {
        this.currentSession.deadline += Math.abs(wallClockDelta);
      }
    }

    this.currentSession.recoveryMetadata.lastHeartbeatWallClock = wallClockNow;
    this.currentSession.recoveryMetadata.lastKnownMonotonicMs = monotonicNow;

    // Check for deadline expiration during active FOCUSING
    if (this.state === 'FOCUSING') {
      const remaining = this.getRemainingDurationMs(wallClockNow);
      if (remaining <= 0) {
        this.completeSession();
      }
    }

    return this.state;
  }

  /**
   * Idempotent completion of the focus session
   */
  public completeSession(): boolean {
    if (this.isCompletionIdempotentHandled) {
      return true; // Already processed, no duplicate completion event
    }

    if (this.state !== 'FOCUSING' && this.state !== 'BREAK') {
      return false;
    }

    this.isCompletionIdempotentHandled = true;
    this.state = 'COMPLETED';

    if (this.currentSession) {
      this.currentSession.status = 'COMPLETED';
      this.currentSession.completedAt = new Date().toISOString();
      // Notify completion listeners
      for (const listener of this.onSessionCompletedListeners) {
        try {
          listener({ ...this.currentSession });
        } catch (err) {
          console.error('FocusEngine onCompleted error:', err);
        }
      }
    }

    this.notify();
    return true;
  }

  /**
   * Cancels the session
   */
  public cancelSession(isParentAuthorized = false): boolean {
    if (this.state === 'IDLE' || this.state === 'COMPLETED' || this.state === 'CANCELLED') {
      return false;
    }

    if (this.currentSession?.strictMode && !isParentAuthorized) {
      console.warn('FocusEngine: Cancellation blocked by Strict Mode. Parent authorization required.');
      return false;
    }

    const reason = isParentAuthorized ? 'PARENT_OVERRIDE' : 'USER_REQUEST';
    this.transition('CANCELLED', reason);
    return true;
  }

  /**
   * Recovers a session from persistent storage after app termination or reboot
   */
  public recoverSession(
    persisted: FocusSessionMetadata,
    currentWallClock: number = Date.now(),
    currentMonotonic: number = this.getMonotonicTimeMs()
  ): FocusState {
    this.currentSession = {
      ...persisted,
      recoveryMetadata: {
        ...persisted.recoveryMetadata,
        resumedCount: (persisted.recoveryMetadata.resumedCount || 0) + 1,
        lastHeartbeatWallClock: currentWallClock,
        lastKnownMonotonicMs: currentMonotonic,
      },
    };

    if (persisted.status === 'FOCUSING') {
      if (persisted.deadline && currentWallClock >= persisted.deadline) {
        // Session expired while app was closed or device rebooted
        console.log(`FocusEngine: Session ${persisted.id} deadline passed during app downtime. Completing idempotently.`);
        this.state = 'COMPLETED';
        this.currentSession.status = 'COMPLETED';
        this.currentSession.completedAt = new Date(persisted.deadline).toISOString();
        this.isCompletionIdempotentHandled = true;
        this.notify();
        return 'COMPLETED';
      } else {
        // Still active!
        this.state = 'FOCUSING';
        this.isCompletionIdempotentHandled = false;
        this.notify();
        return 'FOCUSING';
      }
    }

    this.state = persisted.status;
    this.notify();
    return this.state;
  }

  /**
   * Resets engine back to IDLE
   */
  public reset(): void {
    this.state = 'IDLE';
    this.currentSession = null;
    this.isCompletionIdempotentHandled = false;
    this.notify();
  }
}
