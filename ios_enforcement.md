# 🍏 ZenFocus iOS Native Enforcement Architecture

## 1. Overview & Apple Screen Time Architecture
iOS does not permit arbitrary background processes to inspect other application windows, kill processes, or intercept touches. ZenFocus enforces restrictions on iOS using Apple's official **Screen Time Frameworks** introduced in iOS 16+:

1. **FamilyControls**: Guardian authorization and privacy-preserving application selection.
2. **ManagedSettings**: Authoritative system-level shields on applications, categories, and web domains, plus app removal prevention.
3. **DeviceActivity**: System-managed background schedule monitoring and timer tracking.
4. **ManagedSettingsUI**: Customized shield screens that match the ZenFocus design system.

---

## 2. iOS Component Architecture

```
                               ┌────────────────────────────────┐
                               │  ZenFocus React Native Client  │
                               └───────────────┬────────────────┘
                                               │ (Objective-C Bridge)
                                               ▼
                               ┌────────────────────────────────┐
                               │    ZenFocusScreenTimeBridge    │
                               └───────────────┬────────────────┘
                                               │
                               ┌───────────────┴────────────────┐
                               │     App Group (UserDefaults)   │
                               │     group.com.zenfocus.app     │
                               └───────────────┬────────────────┘
                                               │
         ┌─────────────────────────────────────┼─────────────────────────────────────┐
         ▼                                     ▼                                     ▼
 ┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────────────┐
 │ ManagedSettingsStore      │ │ DeviceActivityMonitor     │ │ ShieldConfigurationExt    │
 │ • shield.applications     │ │ • intervalDidStart        │ │ • configuration(shielding)│
 │ • shield.applicationCats  │ │ • intervalDidEnd          │ │ • "Request Exception" btn │
 │ • application.denyRemoval │ │ • 100% background-safe    │ │ • ZenFocus design tokens  │
 └───────────────────────────┘ └───────────────────────────┘ └───────────────────────────┘
```

---

## 3. Authorization & Privacy-Preserving App Selection

### 3.1 FamilyControls Authorization
To activate Screen Time restrictions, the app calls:
```swift
try await AuthorizationCenter.shared.requestAuthorization(for: .child)
```
- **Child / Guardian Mode**: Requires the device to be signed in to an Apple Family Sharing group where the user is designated as a child account.
- **Individual Mode Fallback**: For self-imposed study focus on student-owned personal devices, ZenFocus requests individual authorization:
```swift
try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
```

### 3.2 Opaque Tokens vs Bundle Identifiers
Apple's privacy model **does not reveal bundle identifiers** or app names to the application. Instead:
- The user selects apps via the native `FamilyActivityPicker`.
- Selections are stored as opaque `ApplicationToken` and `ActivityCategoryToken` structures.
- Tokens can only be passed directly to `ManagedSettingsStore`.
- ZenFocus serializes token selections into the shared App Group (`group.com.zenfocus.app`) using `NSKeyedArchiver`.

---

## 4. App Shielding & Anti-Tamper Protection

### 4.1 Named Shield Stores
To prevent ZenFocus from inadvertently clearing shields set by Apple's built-in Screen Time or other active schedules, ZenFocus uses a dedicated named store:
```swift
private let store = ManagedSettingsStore(named: .init("ZenFocusStore"))
```

### 4.2 Restricting Applications & Categories
- **Application Shields**: `store.shield.applications = selectedAppTokens`
- **Category Shields**: `store.shield.applicationCategories = .specific(selectedCategoryTokens)`
- **Web Domain Shields**: `store.shield.webDomains = selectedWebDomains`
- **Uninstall Prevention**: During active focus sessions or parent-locked schedules, ZenFocus activates:
```swift
store.application.denyAppRemoval = true
```
This removes the "Delete App" option from the iOS home screen context menu, preventing students from unlinking management during study hours.

---

## 5. Background Scheduled Enforcement (`DeviceActivityMonitor`)
Recurring schedules (School Hours: 08:00–15:30; Bedtime: 21:00–07:00) are registered with Apple's `DeviceActivityCenter`:
```swift
let schedule = DeviceActivitySchedule(
    intervalStart: DateComponents(hour: 8, minute: 0),
    intervalEnd: DateComponents(hour: 15, minute: 30),
    repeats: true
)
try activityCenter.startMonitoring(.init("SchoolHours"), during: schedule)
```
- The iOS operating system triggers `ZenFocusDeviceActivityMonitor.intervalDidStart()` in the background even if the ZenFocus app is closed or killed.
- The extension loads stored tokens from `group.com.zenfocus.app` and applies `store.shield.applications`.
- When the interval concludes, `intervalDidEnd()` safely restores access unless a manual focus session is active.

---

## 6. Required Apple Entitlements & Setup Guide

### 6.1 Entitlements (`app.json` / `ZenFocus.entitlements`)
```xml
<key>com.apple.developer.family-controls</key>
<true/>
<key>com.apple.security.application-groups</key>
<array>
    <string>group.com.zenfocus.app</string>
</array>
```

### 6.2 Production Apple Developer Requirements
1. **Family Controls Distribution Entitlement**: Apple requires developers to submit a request at [developer.apple.com/contact/request/family-controls-distribution](https://developer.apple.com/contact/request/family-controls-distribution) explaining the parental control use case.
2. **Development Testing**: On development builds, this capability is tested using explicit development provisioning profiles signed with an Apple Developer Program team account.
3. **Simulators**: Note that Apple `FamilyControls` and `ManagedSettings` require a physical iOS device running iOS 16.0+; simulators do not simulate native Screen Time shielding.
