# 🧘 ZenFocus

> **Cross-Platform Study Focus & Parental Control Ecosystem**  
> *Seamlessly combining student deep work sessions with parent-guided digital wellbeing across Android & iOS.*

---

## 🌟 Overview

Students often struggle with persistent digital distractions from social media and entertainment apps while studying. **ZenFocus** bridges the gap between student agency and parental guidance:

- **Students** build sustainable study habits using the signature **Zen Ring** Pomodoro focus timer, self-imposed distraction shields, and transparent exception requests.
- **Parents** manage digital wellbeing through authoritative restrictions enforced natively at the operating system level, schedules (School Hours & Bedtime Downtime), and real-time approval inboxes.
- **Cross-Platform Architecture:** One unified product experience across **Android** and **iOS**. A parent on iOS can manage a child on Android, and vice-versa.

---

## 🏗️ System Architecture & Native Enforcement

ZenFocus enforces restrictions locally through the target device's supported operating system APIs:

```
                      ┌────────────────────────────────────────┐
                      │          Shared Cross-Platform         │
                      │        React Native / Expo Client      │
                      └──────────────────┬─────────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
     ┌─────────────────────────────┐           ┌─────────────────────────────┐
     │       Android Native        │           │          iOS Native         │
     │  Device Policy Controller   │           │      Apple Screen Time      │
     ├─────────────────────────────┤           ├─────────────────────────────┤
     │ • DevicePolicyManager       │           │ • FamilyControls            │
     │ • setPackagesSuspended()    │           │ • ManagedSettings Shields   │
     │ • setUninstallBlocked()     │           │ • DeviceActivity Monitor    │
     │ • DND Notification Policy   │           │ • Deny App Removal          │
     │ • Enterprise Receiver       │           │ • Custom Shield Extension   │
     └─────────────────────────────┘           └─────────────────────────────┘
```

### 🤖 Android: Device Policy Controller (DPC)
- **Engine:** Kotlin native module (`ZenFocusDpcModule.kt`) and `EnterpriseDeviceAdminReceiver.kt`.
- **Enforcement:** Uses Android enterprise `DevicePolicyManager.setPackagesSuspended()` to silence notifications and hide application launcher icons.
- **Security:** `setUninstallBlocked()` prevents students from tampering with or removing the management profile.

### 🍏 iOS: Apple Screen Time & Family Controls
- **Engine:** Swift native module (`ZenFocusScreenTimeBridge.swift`).
- **Enforcement:** Apple `FamilyControls` authorization, `ManagedSettingsStore.shield.applications` for application and category blocking, and `ManagedSettingsStore.application.denyAppRemoval`.
- **Custom UI:** `ShieldConfigurationExtension` customizes the system block screen with ZenFocus styling and a direct "Request Study Exception" button.
- **Automation:** `DeviceActivityMonitorExtension` handles background interval transitions for recurring school and bedtime schedules.

---

## ✨ Key Features

| Feature | Student Focus Hub | Guardian Portal |
| :--- | :--- | :--- |
| **Study Timer** | Signature animated SVG Zen Ring with 15m, 25m, 45m, and 60m presets. | Real-time visibility into study streaks and session completion logs. |
| **Role Gating** | Exclusively locked to Student view. No access to parent controls. | Dual-view switcher (`🛡️ Parent Control` ↔ `🧘 Child View`). |
| **Restrictions** | Self-imposed distraction shields (Discord, Reddit, Roblox). | Authoritative parent-locked app rules and custom package blocks. |
| **Exception Requests** | One-tap request for 15m–60m temporary access with homework justification. | Real-time approval inbox with instant **Approve (+30m)** and **Reject** buttons. |
| **Grace Unlocks** | Real-time countdown banner during approved study grace periods. | Monotonic version increments and append-only audit trail. |
| **Schedules** | Automated focus intervals during school hours and bedtime downtime. | Configurable weekly schedules with recurrence rules. |
| **Pairing** | Simple 6-digit PIN entry to link with guardian. | Expiring invitation PIN generator (`ZEN-XXXX`) with QR instructions. |

---

## 📁 Repository Structure

```
ZenFocus/
├── DESIGN.md                          # Design system tokens, typography, and UX guidelines
├── PRD.md                             # Product Requirements Document
├── app_flow.md                        # User journeys, role workflows, and state diagrams
├── architecture.md                    # System architecture & command lifecycle specs
├── .gitignore                         # Security rules protecting all credentials & keystores
│
└── mobile/                            # Cross-Platform React Native / Expo Application
    ├── android-native/                # Native Kotlin DPC modules & receiver
    │   ├── EnterpriseDeviceAdminReceiver.kt
    │   ├── ZenFocusDpcModule.kt
    │   └── ZenFocusDpcPackage.kt
    │
    ├── ios-native/                    # Native Swift Screen Time & extension modules
    │   ├── ZenFocusScreenTimeBridge.swift
    │   ├── ZenFocusScreenTimeBridge.m
    │   ├── ZenFocusShieldExtension.swift
    │   └── ZenFocusDeviceActivityMonitor.swift
    │
    ├── plugins/                       # Expo Config Plugins
    │   ├── withAndroidDpc.js          # Injects Android DPC receiver into Manifest
    │   └── withIosScreenTime.js       # Configures iOS FamilyControls & App Groups
    │
    ├── src/
    │   ├── components/                # Reusable UI components (ZenRing, Modals, Cards)
    │   ├── native/                    # TypeScript native bridge adapters
    │   ├── screens/                   # WelcomeScreen, ChildDashboard, ParentDashboard
    │   ├── store/                     # ZenFocusContext (AsyncStorage & state engine)
    │   ├── theme/                     # Color tokens, radii, and typography
    │   └── types/                     # TypeScript contracts & data models
    │
    ├── App.tsx                        # Root router with role gating
    ├── app.json                       # Expo configuration & native plugin registrations
    └── test-suite.js                  # Automated test verification suite
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/go) on your Android or iOS device

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/DarkShadow-codex/ZenFocus.git
   cd ZenFocus/mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npx expo start
   ```

4. Open on your device:
   - Scan the terminal QR code with **Expo Go** on Android, or the **Camera app** on iOS.
   - Or press `w` to run the web preview in your browser at `http://localhost:8081`.

### Running Tests
To run the automated verification suite:
```bash
cd mobile
node test-suite.js
```

---

## 🔒 Security & Privacy

- **Immutable Ownership:** Parent-owned restrictions cannot be altered or removed by child accounts.
- **Privacy First:** ZenFocus does not secretly monitor private chats, keystrokes, photos, or browsing content.
- **Honest Status:** Device status transparently indicates whether an action is applied, partial, or pending operating system authorization.
- **Credential Protection:** All `.env`, keystore (`.jks`), and provisioning profile (`.p8`, `.p12`) files are protected by `.gitignore`.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](mobile/LICENSE) file for details.
