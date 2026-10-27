# 🔒 ZenFocus Security Review & Threat Model Analysis

## 1. Executive Summary
ZenFocus enforces digital wellbeing and parental restrictions across diverse mobile platforms while adhering strictly to children's privacy principles. This document provides a threat model analysis, vulnerability assessment, and defense-in-depth security verification.

---

## 2. Threat Modeling & Adversary Scenarios

### Threat 1: Student Attempting Local Bypass via System Clock Tampering
- **Attack Vector**: Student rolls the device system time forward past the focus session deadline or scheduled bedtime to force-expire restrictions.
- **Countermeasure**:
  - `FocusEngine` does not rely solely on `Date.now()`.
  - The heartbeat monitors both wall-clock time and system monotonic time (`performance.now()`).
  - If a backward or forward jump in wall-clock time occurs while monotonic delta remains small, the engine detects clock manipulation and automatically offsets the deadline.
  - For schedules, recurrence checks recalculate against authoritative server timestamps upon reconnection.

### Threat 2: Student Attempting Application Uninstallation or Process Termination
- **Attack Vector**: Student attempts to uninstall ZenFocus or force-stop the background service.
- **Countermeasure**:
  - **Android (Device Owner)**: Calls `dpm.setUninstallBlocked(adminComponent, packageName, true)`. The system grey-outs the uninstall button in Android Settings.
  - **iOS**: Activates `store.application.denyAppRemoval = true`, removing the delete option from iOS Springboard.
  - **Android Foreground Service**: Declared with `foregroundServiceType="specialUse|dataSync"` and returns `START_STICKY`. `ZenFocusBootReceiver` restores execution upon `BOOT_COMPLETED` and `MY_PACKAGE_REPLACED`.

### Threat 3: Student Attempting to Downgrade Parent Policies
- **Attack Vector**: Student attempts to call local store functions or modify stored preferences to disable restrictions.
- **Countermeasure**:
  - **Immutable Ownership Rule**: The state machine enforces that policies with `ownerType: 'parent'` can only be updated if authenticated as a verified Parent.
  - **Server-Side Validation**: Even if a modified client issues a REST request to disable a parent policy, the backend validates `auth.uid() = parent_user_id` in `family_relationships`. Requests from child accounts are rejected with `403 Forbidden`.

### Threat 4: Unauthorized Account Claiming & Hijacking
- **Attack Vector**: Attacker attempts to guess a 4-digit pairing PIN to attach an existing child's device to a rogue parent account.
- **Countermeasure**:
  - **Cryptographic Expiration**: PINs have a 15-minute time-to-live.
  - **Rate Limiting**: Failed attempts increment `session.attempts`. After 5 consecutive invalid entries, the code transitions to `LOCKED` status.
  - **Single-Use**: Upon redemption, the code is immediately burned (`REDEEMED`).
  - **Existing Relationship Guard**: Once paired, a child device cannot be claimed by a different parent unless explicitly released by the original parent.

### Threat 5: Data Leakage Across Family Accounts
- **Attack Vector**: Malicious user attempts to query GraphQL/REST endpoints for devices or policies belonging to another family.
- **Countermeasure**:
  - **PostgreSQL Row Level Security (RLS)**: Enforced directly at the database engine level.
  - Parents can only select records where `family_relationships.parent_user_id = auth.uid()`.
  - Children can only select records for their own `user_id`.
  - Cross-family data queries return empty sets (`0 rows`) regardless of client query arguments.

---

## 3. Privacy & Children's Data Minimization
ZenFocus strictly adheres to COPPA and GDPR-K principles:
1. **Zero Content Inspection**: ZenFocus never reads, records, or uploads personal text messages, emails, photos, keystrokes, or microphone audio.
2. **Notification Privacy**: Android notification policy access is used strictly to engage Do Not Disturb (`INTERRUPTION_FILTER_PRIORITY`). Notification message text is never read or stored.
3. **Screen-Time Accuracy**: Screen time is aggregated as duration totals per application via `UsageStatsManager`. If permission is absent, statistics are omitted rather than fabricated.
4. **Data Retention**: Completed session logs and audit trails are retained locally, with minimal telemetry synced to cloud storage.

---

## 4. Credential & Keystore Protection
- **No Hardcoded Secrets**: All `.env`, keystore files (`.jks`, `.keystore`), and Apple developer certificates (`.p12`, `.mobileprovision`) are strictly excluded in `.gitignore`.
- **Least-Privilege API Tokens**: Mobile clients authenticate via short-lived JWT tokens. Database service-role keys are strictly kept on backend infrastructure and never shipped inside the mobile bundle.
