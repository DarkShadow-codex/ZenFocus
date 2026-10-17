# Product Requirements Document (PRD)

## Cross-Platform Study Focus & Parental Control App

**Status:** Draft v1.0 --- requirements consolidated from product-owner
direction\
**Platforms:** Android and iOS\
**Product shape:** One product, two native clients/enforcement engines,
one shared backend

------------------------------------------------------------------------

## 1. Executive Summary

The product combines a study-focus application (focus timer, study
sessions, app restrictions, and reduced distractions) with a
parent-managed digital wellbeing and parental-control system.

There are two account roles:

-   **Parent:** Pairs with a child's account/device, creates and manages
    parent-owned restrictions, configures schedules, receives approval
    requests, and sees enforcement/synchronization status.
-   **Child:** Uses the child dashboard, runs focus sessions, creates
    optional self-imposed restrictions, and requests parent decisions
    for parent-protected actions.

The parent may use an iOS device to manage a child's Android device, or
an Android device to manage a child's iOS device. Cross-platform
operation is provided by a shared backend and secure policy/command
delivery. The child's own device applies policies using the appropriate
native enforcement engine.

**Core principle:** Parent-owned restrictions cannot be removed by
ordinary child-account actions. Child-owned restrictions can be changed
or removed by the child. Enforcement is limited to capabilities actually
granted by the operating system and the device's
enrollment/authorization state.

## 2. Problem Statement

Students can be distracted by apps and notifications while studying.
Existing focus tools and parental-control tools may address different
parts of the problem. Families need one coherent system that combines
focus sessions with parent-defined restrictions, regardless of whether
the parent and child use different mobile platforms.

## 3. Product Goals

1.  Provide one product experience across Android and iOS.
2.  Support parent and child accounts with explicit pairing and
    authorization.
3.  Allow parents to select supported apps/categories for restriction on
    a paired child's device.
4.  Suppress notifications from restricted apps where the platform
    provides a supported mechanism.
5.  Support focus timers and scheduled restrictions.
6.  Allow children to create their own removable restrictions.
7.  Protect parent-owned policies from being removed by the child
    through ordinary app controls.
8.  Provide a permission/approval workflow for uninstall-related
    requests where the operating system supports it.
9.  Show honest policy status: pending, applied, partially applied,
    failed, unsupported, or awaiting device authorization.
10. Keep one backend as the source of truth for accounts, pairing,
    policy ownership, schedules, approval requests, and synchronization.

## 4. Non-Goals (initial release)

-   Guaranteeing identical restrictions or notification behavior on
    every Android/iOS version or manufacturer.
-   Secretly monitoring private messages, keystrokes, photos, or
    notification contents.
-   Bypassing operating-system security, parental authorization,
    app-store rules, or device-owner requirements.
-   Guaranteeing remote control when a device is offline or has revoked
    required authorization.
-   Replacing emergency calling or other critical operating-system
    functions.
-   Treating the app's role-selection screen as sufficient proof that a
    user is a parent.
-   Promising that an ordinary app can prevent every uninstall attempt
    on every device.
-   Full mobile-device-management (MDM) functionality beyond the
    explicitly supported parental-control use cases.

## 5. Target Users and Roles

### 5.1 Parent

Needs to: - Create a parent account. - Pair with a child through a
secure invitation/approval flow. - View linked child devices and
platform capability status. - Select apps/categories for restrictions
where the OS exposes supported selection. - Create, schedule, pause, and
remove parent-owned restrictions. - Receive and decide approval
requests. - See whether a policy was actually applied on the child
device. - Review a minimal audit trail of important policy changes.

### 5.2 Child

Needs to: - Create a child account or accept a parent invitation. -
Complete required system authorization/device enrollment. - Use a study
timer and view active restrictions. - Create self-imposed restrictions
that they can remove. - Understand why an app is restricted and when a
scheduled restriction ends. - Submit a request to the parent where a
parent decision is required. - See a clear outcome when a request is
approved or rejected.

## 6. Platform Strategy

### 6.1 Android

**Language:** Kotlin\
**Primary enforcement direction:** Android Device Policy Controller
(DPC) using supported `DevicePolicyManager` APIs, including package
suspension when the app is provisioned with an eligible
device-owner/profile-owner/delegated role. DPC-based suspension can
prevent apps from starting and suppress their notifications, subject to
platform policy and exceptions.

Supporting mechanisms: - `DevicePolicyManager` for eligible
device-management policy. - DND / notification-policy access as an
optional additional focus layer, with explicit user/system
authorization. - Native Android scheduling, local policy cache, and
enforcement-result reporting.

Important constraints: - Strong device-wide control generally requires
appropriate device-owner provisioning; device-owner setup commonly
involves a managed-device provisioning process and may require factory
reset. - A regular Play Store app cannot silently grant itself
device-owner powers. - Some system/critical packages cannot be
suspended. - DND is not a reliable per-app replacement for DPC package
suspension and can behave differently across OS versions/OEMs. -
Validate provisioning, distribution, Play policy, and target-device
requirements before promising consumer availability.

### 6.2 iOS

**Language:** Swift\
**Primary frameworks:** `FamilyControls`, `ManagedSettings`, and
`DeviceActivity`.

Capabilities: - Obtain required Family Controls
authorization/entitlement. - Use supported app/category/domain
selections. - Apply shields/restrictions through ManagedSettings. - Use
DeviceActivity schedules and monitoring extensions for time-based
policies.

Important constraints: - Family Controls entitlement and App Store
approval are required for distribution. - Child/guardian authorization
follows Apple's Family Controls rules, including Family Sharing where
applicable. - App shielding does not mean every notification from every
selected app is guaranteed to be suppressed. Notification behavior must
be tested and described accurately. - Native capabilities and available
data are deliberately privacy-preserving; do not design around
unrestricted app inventory or arbitrary remote device control.

### 6.3 Cross-platform rule

The backend stores platform-neutral intent (for example, "restrict this
selected app token during this schedule"), not OS-specific promises.
Each native enforcement adapter translates the policy to supported APIs
and returns a truthful result. If the platform cannot implement a
requested behavior, the UI must show that limitation rather than report
success.

## 7. Functional Requirements

Priority: **P0 = required for first usable release**, **P1 = important
follow-up**, **P2 = later enhancement**.

### 7.1 Registration and role selection

-   **FR-001 (P0):** First launch presents "I am a Parent" and "I am a
    Child."
-   **FR-002 (P0):** Users can register/sign in securely.
-   **FR-003 (P0):** Role selection determines the initial dashboard,
    but the backend enforces authorization independently.
-   **FR-004 (P0):** Account recovery and session revocation are
    supported.
-   **FR-005 (P0):** Users are shown privacy terms, consent, and
    platform-specific authorization requirements.

### 7.2 Parent-child pairing

-   **FR-010 (P0):** A parent can create a time-limited invitation or
    pairing code.
-   **FR-011 (P0):** The child must accept the pairing and complete any
    required OS authorization.
-   **FR-012 (P0):** The backend records the parent-child relationship
    and the authorized devices.
-   **FR-013 (P0):** Pairing can be revoked; revocation blocks future
    parent commands and triggers a defined policy cleanup/reconciliation
    process.
-   **FR-014 (P0):** The system must prevent unauthorized account
    takeover or pairing-code guessing through rate limits and expiry.

### 7.3 Device registration and capability checks

-   **FR-020 (P0):** Each client registers platform, app version, OS
    version, capability state, and a device identifier.
-   **FR-021 (P0):** The child client runs a capability check before a
    parent can activate a restriction.
-   **FR-022 (P0):** The UI distinguishes "supported," "needs
    authorization/enrollment," "partially supported," and "unsupported."
-   **FR-023 (P0):** The system never displays "Applied" until the child
    device confirms the enforcement result.
-   **FR-024 (P1):** Capability changes trigger re-evaluation of active
    policies.

### 7.4 Parent-managed restrictions

-   **FR-030 (P0):** Parent can select supported apps/categories/domains
    on the child's device using the platform's approved selection
    interface.
-   **FR-031 (P0):** Parent can create, update, schedule, pause, and
    remove parent-owned restrictions.
-   **FR-032 (P0):** A child cannot remove or weaken a parent-owned
    restriction using ordinary child-app controls.
-   **FR-033 (P0):** Parent restrictions include owner, target,
    schedule, priority, creation time, version, and desired state.
-   **FR-034 (P0):** Policy changes are versioned and auditable.
-   **FR-035 (P0):** Parent can choose individual supported apps or an
    available category/group. "All apps" is offered only where platform
    selection/enforcement supports it; protected/system apps are
    excluded or clearly identified.
-   **FR-036 (P0):** Conflicting policies are resolved deterministically
    and shown to the user.
-   **FR-037 (P0):** Emergency/system-critical apps are not blocked by
    unsupported or unsafe blanket policies.

### 7.5 Child-created focus restrictions

-   **FR-040 (P0):** Child can create a self-imposed restriction or
    focus session.
-   **FR-041 (P0):** Child-owned restrictions can be stopped/removed by
    the child.
-   **FR-042 (P0):** A child action cannot change the ownership of a
    parent restriction.
-   **FR-043 (P0):** The enforcement engine combines applicable policies
    so parent restrictions remain active even if a child removes a
    self-imposed restriction.

### 7.6 Notification suppression

-   **FR-050 (P0):** When a platform's native enforcement mechanism
    suppresses notifications for a restricted app, the product reports
    that outcome.
-   **FR-051 (P0):** Android uses DPC package suspension when eligible;
    DND may supplement focus sessions but is not represented as a
    universal per-app blocker.
-   **FR-052 (P0):** iOS uses supported Screen Time frameworks and must
    accurately disclose notification limitations.
-   **FR-053 (P0):** Notification contents are not collected by the
    backend.
-   **FR-054 (P1):** Parent dashboard can display
    notification-suppression capability/status by device.

### 7.7 Focus timer and schedules

-   **FR-060 (P0):** Child can start a timed focus session.
-   **FR-061 (P0):** Parent can create recurring or one-time
    restrictions with start/end times and timezone.
-   **FR-062 (P0):** Device-side enforcement must continue through
    temporary network loss for already-synchronized schedules, to the
    extent supported by the OS.
-   **FR-063 (P0):** Time handling accounts for timezone changes,
    daylight saving where relevant, device clock changes, and schedule
    conflicts.
-   **FR-064 (P1):** Focus history and aggregate session completion
    statistics are available without collecting unnecessary activity
    content.

### 7.8 Approval requests and uninstall protection

-   **FR-070 (P0):** Child can submit a request that requires parent
    approval, with a reason and request status.
-   **FR-071 (P0):** Parent receives an in-app/push notification when a
    request is created, where delivery is available.
-   **FR-072 (P0):** Parent can approve or reject with a timestamped
    audit event.
-   **FR-073 (P0):** On rejection, the child sees a clear "Permission
    rejected" message.
-   **FR-074 (P0):** If rejection concerns a supported protected action,
    the native platform mechanism maintains the restriction. The app
    must not claim it can intercept or cancel every system uninstall
    dialog.
-   **FR-075 (P0):** Android may use `setUninstallBlocked` only in
    eligible device-owner/device-management configurations and only
    where supported.
-   **FR-076 (P0):** iOS relies on authorized Family Controls behavior
    and Apple's supported protections; no custom app can universally
    intercept every uninstall attempt.
-   **FR-077 (P1):** If a parent approval is pending, the UI explains
    the state and does not fake a system lock. A "lock" action is
    available only if a supported, explicitly authorized OS mechanism
    exists.

### 7.9 Cross-platform command delivery and synchronization

-   **FR-080 (P0):** Parent commands are sent to the shared backend from
    either platform.
-   **FR-081 (P0):** Backend validates identity, relationship, role,
    target device, policy ownership, and request freshness.
-   **FR-082 (P0):** Command delivery uses platform-appropriate
    push/wakeup plus authenticated client pull/acknowledgement; push
    alone is not considered guaranteed delivery.
-   **FR-083 (P0):** Child device applies policy locally and reports a
    signed/authenticated result.
-   **FR-084 (P0):** Commands are idempotent and carry policy version,
    command ID, expiry, and target device ID.
-   **FR-085 (P0):** The UI shows
    queued/offline/pending/applied/partial/failed/unsupported states.
-   **FR-086 (P0):** Reconnected devices reconcile the latest
    authoritative policy state rather than blindly replaying stale
    commands.
-   **FR-087 (P1):** Parent can view last-seen time and last successful
    policy sync.

### 7.10 Audit and transparency

-   **FR-090 (P0):** Record important events: pairing, authorization
    changes, policy creation/edit/removal, approval decisions,
    enforcement results, and device unlinking.
-   **FR-091 (P0):** Audit events exclude notification contents and
    unnecessary sensitive usage details.
-   **FR-092 (P1):** Parent and child can view a suitable, role-filtered
    history of policy changes.

## 8. Non-Functional Requirements

### Security

-   TLS for all network traffic.
-   Short-lived access tokens and rotating refresh tokens or equivalent
    secure session design.
-   Secure storage for tokens using Android Keystore-backed storage and
    iOS Keychain.
-   Server-side authorization on every sensitive endpoint.
-   Rate limiting, abuse detection, replay protection, and idempotency
    keys.
-   Encryption at rest for sensitive records.
-   No hard-coded secrets in mobile clients.
-   Separate production and development credentials.
-   Administrative access is least-privilege and audited.
-   Child clients cannot authoritatively decide whether a parent policy
    is valid.

### Reliability

-   Commands are retryable and idempotent.
-   Offline behavior is explicit.
-   Policy status reflects device acknowledgement, not merely server
    acceptance.
-   Monitoring and error reporting avoid collecting private content.

### Privacy

-   Data minimization by default.
-   No collection of notification contents.
-   Clear parent/child disclosures and consent/authorization flows.
-   Retention periods and account deletion workflows are defined before
    production.
-   Support data export/deletion as legally required.
-   Avoid covert surveillance and provide age-appropriate transparency.

### Accessibility and UX

-   Accessible color contrast, text scaling, screen-reader labels, and
    localization-ready UI.
-   Clear explanations for restrictions and permission failures.
-   Never use misleading success indicators.

## 9. High-Level Data Entities

-   `User`: identity, role/status, account state.
-   `FamilyRelationship`: parent-child link and lifecycle state.
-   `Device`: platform, OS/app version, capabilities, last seen,
    authorization/enrollment state.
-   `PairingInvitation`: hashed token, expiry, status.
-   `RestrictionPolicy`: owner, target, platform-neutral rule, schedule,
    version, state.
-   `PolicyTarget`: selected app/category/domain token and platform.
-   `Schedule`: timezone, recurrence, start/end, enabled state.
-   `Command`: command ID, target device, policy version, expiry,
    delivery state.
-   `EnforcementReceipt`: applied/partial/failed/unsupported result and
    safe diagnostic code.
-   `ApprovalRequest`: requester, type, reason, state, decision
    actor/time.
-   `AuditEvent`: actor, event type, target, timestamp, minimal
    metadata.
-   `PushToken`: device push token and platform.

Sensitive app-selection tokens should be stored only as required and
protected according to platform privacy requirements. Do not assume iOS
tokens can be converted into Android package names or vice versa.

## 10. High-Level API Requirements

Illustrative REST API; exact contracts to be finalized during technical
design.

-   `POST /v1/auth/register`
-   `POST /v1/auth/login`
-   `POST /v1/auth/refresh`
-   `POST /v1/pairing/invitations`
-   `POST /v1/pairing/accept`
-   `DELETE /v1/families/{familyId}/children/{childId}`
-   `POST /v1/devices/register`
-   `PATCH /v1/devices/{deviceId}/capabilities`
-   `GET /v1/children/{childId}/devices`
-   `GET /v1/devices/{deviceId}/policies`
-   `POST /v1/children/{childId}/policies`
-   `PATCH /v1/policies/{policyId}`
-   `DELETE /v1/policies/{policyId}`
-   `POST /v1/devices/{deviceId}/commands/ack`
-   `POST /v1/devices/{deviceId}/enforcement-receipts`
-   `POST /v1/approval-requests`
-   `GET /v1/approval-requests`
-   `POST /v1/approval-requests/{requestId}/decision`
-   `GET /v1/audit-events`
-   `POST /v1/devices/{deviceId}/sync`

All endpoints require authentication as appropriate, server-side
authorization, schema validation, rate limits, and audit coverage. A
client-supplied `role`, `parentId`, `childId`, or `createdBy` field must
never be trusted without verifying it against server records.

## 11. Acceptance Criteria for MVP

1.  User can register as parent or child and reach the correct
    dashboard.
2.  A parent can securely pair with a child.
3.  Parent can see child platform, authorization/enrollment state, and
    supported capabilities.
4.  Parent can create a supported restriction from either Android or iOS
    parent client.
5.  The backend validates and delivers the policy to a
    different-platform child device.
6.  The child native engine applies a supported policy and reports a
    truthful result.
7.  Child cannot remove parent-owned restrictions through ordinary app
    UI/API calls.
8.  Child can create and remove their own restrictions without affecting
    parent-owned restrictions.
9.  Schedules work locally for already-synchronized policies during
    temporary network loss, where supported.
10. Approval requests can be created, approved/rejected, and audited.
11. Uninstall protection is advertised only for configurations where the
    platform supports it.
12. Unsupported capabilities are shown clearly, never falsely marked as
    applied.
13. No notification contents are uploaded to the backend.
14. Security tests cover cross-account access, forged roles, stale
    commands, replay, and pairing abuse.

## 12. Key Risks and Mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Android device-owner provisioning   Make enrollment requirements
  is too demanding for some users     visible early; validate consumer
                                      distribution feasibility

  iOS entitlement/authorization       Apply early for Family Controls
  constraints                         entitlement; prototype on real
                                      devices

  Notification behavior differs by    Capability matrix and device-level
  platform                            acceptance tests

  Push delivery is delayed or lost    Push as wakeup, durable command
                                      queue, client sync, acknowledgement

  Child removes/revokes authorization Show protection degradation
  or goes offline                     honestly; reconcile on reconnect

  OS updates change behavior          Automated regression suite and
                                      release capability checks

  Parent account compromise           MFA/passkeys where feasible,
                                      session management,
                                      sensitive-action reauthentication

  Over-collection of child data       Data minimization, explicit
                                      disclosures, retention limits
  -----------------------------------------------------------------------

## 13. MVP Development Phases

1.  **Feasibility spike:** Prove Android DPC provisioning/suspension and
    iOS Family Controls authorization/shielding on physical devices.
2.  **Backend foundation:** Authentication, relationships, devices,
    policies, commands, receipts, audit.
3.  **Native child enforcement:** Android and iOS capability adapters
    and local schedule enforcement.
4.  **Parent dashboard:** Pairing, policy configuration,
    capability/status display.
5.  **Focus tools:** Timer, child-owned restrictions, schedules.
6.  **Approval workflow:** Request, notification, decision, and audit.
7.  **Security and reliability:** Threat modeling, offline tests,
    platform/version matrix.
8.  **Pilot and distribution review:** Test app-store policies,
    permissions, onboarding friction, and support process.

## 14. Official Technical References

-   Android `DevicePolicyManager`:
    https://developer.android.com/reference/android/app/admin/DevicePolicyManager
-   Android Enterprise DPC security:
    https://developer.android.com/work/dpc/security
-   Apple Screen Time frameworks:
    https://developer.apple.com/documentation/ScreenTimeAPIDocumentation
-   Apple Family Controls:
    https://developer.apple.com/documentation/familycontrols

This PRD is a product specification, not a guarantee that every desired
control is available on every consumer device. Platform feasibility must
be verified with prototypes and current store policies before launch.
