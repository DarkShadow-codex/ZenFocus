# 🤖 ZenFocus Android Native Enforcement Architecture

## 1. Overview
The ZenFocus Android Enforcement Engine provides native app restriction, real-time distraction interception, screen-time tracking, and focus notification management.

Unlike standard consumer apps that merely run in-memory timers, ZenFocus combines two native Android subsystems:
1. **Android Enterprise Device Policy Controller (DPC)**: For true hardware-level package suspension and uninstall blocking when enrolled as Device Owner.
2. **Android Accessibility Framework & Foreground Service**: For consumer-grade real-time foreground application detection and block intervention UI.

---

## 2. Component Architecture

```
                               ┌────────────────────────────────┐
                               │  ZenFocus React Native Client  │
                               └───────────────┬────────────────┘
                                               │ (JNI / ReactMethod)
                                               ▼
                               ┌────────────────────────────────┐
                               │       ZenFocusDpcModule        │
                               └───────┬──────────────┬─────────┘
                                       │              │
                   ┌───────────────────┴───┐      ┌───┴───────────────────┐
                   ▼                       ▼      ▼                       ▼
     ┌────────────────────────┐  ┌──────────────────┐  ┌───────────────────────┐
     │ DevicePolicyManager    │  │ BlockerManager   │  │ UsageStatsTracker     │
     │ • setPackagesSuspended │  │ • BlockedSet     │  │ • queryUsageStats     │
     │ • setUninstallBlocked  │  │ • SharedPreferences│ │ • hasUsagePermission │
     └────────────────────────┘  └─────────┬────────┘  └───────────────────────┘
                                           │
                         ┌─────────────────┴──────────────────┐
                         ▼                                    ▼
           ┌───────────────────────────┐        ┌───────────────────────────┐
           │ AccessibilityService      │        │ ZenFocusBackgroundService │
           │ • TYPE_WINDOW_STATE_CHANGE│        │ • Foreground Service      │
           │ • GLOBAL_ACTION_HOME      │        │ • Boot completed auto-run │
           │ • ZenFocusBlockedActivity │        │ • START_STICKY resilience │
           └───────────────────────────┘        └───────────────────────────┘
```

---

## 3. App Restriction Enforcement Mechanisms

### 3.1 Mode A: Device Owner (Enterprise DPC)
When ZenFocus is provisioned as the Device Owner via ADB or QR provisioning (`dpm.isDeviceOwnerApp(packageName)`):
- **Package Suspension**: Calls `devicePolicyManager.setPackagesSuspended(adminComponent, packages, true)`.
- **Operating System Behavior**: The Android launcher greys out the app icon, disables notification generation, and prevents the app from being scheduled or started by intents.
- **Tamper Protection**: `devicePolicyManager.setUninstallBlocked(adminComponent, packageName, true)` prevents uninstallation of either ZenFocus or the restricted app.

### 3.2 Mode B: Accessibility Real-Time Blocker (Consumer Standard)
When provisioned without Device Owner rights, ZenFocus uses `ZenFocusAccessibilityService`:
- **Detection**: Listens for `AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED`.
- **System Exclusions**: Whitelists ZenFocus itself, `com.android.systemui`, `com.android.settings`, and system launchers to prevent device soft-locks.
- **Intervention Execution**:
  1. Checks `ZenFocusBlockerManager.isAppBlocked(context, packageName)`.
  2. Executes `performGlobalAction(GLOBAL_ACTION_HOME)` to immediately collapse the restricted app.
  3. Launches fullscreen `ZenFocusBlockedActivity` presenting the student with focus information and a direct "Request Study Exception" button.
- **Anti-Burst Filter**: Implements a 1500ms timestamp debounce to prevent launch loop cascades.

---

## 4. Screen-Time Tracking via `UsageStatsManager`

### 4.1 Permission Authorization
Screen-time tracking requires the Android `PACKAGE_USAGE_STATS` permission. Because this cannot be granted automatically at install time, ZenFocus:
1. Checks `AppOpsManager.MODE_ALLOWED` for `AppOpsManager.OPSTR_GET_USAGE_STATS`.
2. Directs the user to `Settings.ACTION_USAGE_ACCESS_SETTINGS` when permission is needed.

### 4.2 Aggregation & Overlapping Interval Resolution
- Uses `UsageStatsManager.queryUsageStats(INTERVAL_DAILY, startTime, endTime)`.
- Aggregates foreground time per package to merge duplicate interval slices.
- Resolves application labels using `PackageManager.getApplicationLabel()`.
- Distinguishes user-installed apps from system apps (`ApplicationInfo.FLAG_SYSTEM`).
- **Honest Data Rule**: If permission is denied or revoked, ZenFocus returns `permissionGranted: false` and `totalForegroundMinutes: 0`. It **never fabricates fake screen-time data**.

---

## 5. Notification & Do Not Disturb (DND) Management
- **DND Access**: Checks `notificationManager.isNotificationPolicyAccessGranted`.
- **Activation**: When starting a study session, sets `notificationManager.setInterruptionFilter(INTERRUPTION_FILTER_PRIORITY)` to silence distraction pings while permitting emergency calls.
- **Restoration**: On session completion, restores `INTERRUPTION_FILTER_ALL`.
- **Limitation Transparency**: Explains clearly that third-party notification content is never inspected or uploaded to cloud servers.

---

## 6. Recovery & Fault Tolerance

| Event | System Response |
| :--- | :--- |
| **Accessibility Revoked** | `getEnforcementStatus()` reports `protectionActive: false` and `diagnostic: "ENFORCEMENT_UNAVAILABLE"`. UI warns user immediately. |
| **Device Reboot** | `ZenFocusBootReceiver` handles `BOOT_COMPLETED` and `QUICKBOOT_POWERON`, restarting `ZenFocusBackgroundService` and restoring blocked package sets. |
| **Service Process Killed** | `ZenFocusBackgroundService.onStartCommand` returns `START_STICKY`. Android restarts the service with active foreground notification. |
| **App Resume / Wakeup** | `ZenFocusDpcModule.reconcileRestrictions()` synchronizes in-memory blocked sets with persistent `SharedPreferences` and re-applies DPC suspension. |
