# System Architecture

## Cross-Platform Study Focus & Parental Control App

**Version:** 1.0 draft\
**Architecture principle:** One shared backend; separate native Android
and iOS clients/enforcement engines.

------------------------------------------------------------------------

## 1. Architecture Goals

-   Support parent and child accounts on either Android or iOS.
-   Allow a parent on one platform to manage a child on the other
    platform.
-   Keep the backend authoritative for identities, parent-child
    relationships, policy ownership, schedules, approvals, and
    synchronization.
-   Enforce restrictions locally through the target device's supported
    native APIs.
-   Avoid claiming an action is enforced until the child device reports
    the result.
-   Preserve privacy by minimizing collected data and never uploading
    notification contents.

## 2. System Context

``` mermaid
flowchart TB
    P1[Parent on Android<br/>Kotlin client]
    P2[Parent on iOS<br/>Swift client]
    C1[Child on Android<br/>Kotlin + DPC]
    C2[Child on iOS<br/>Swift + Screen Time APIs]
    API[Shared API Gateway]
    AUTH[Identity and Authorization]
    PAIR[Family and Device Pairing]
    POLICY[Policy and Schedule Service]
    CMD[Durable Command Queue]
    APPROVAL[Approval Request Service]
    AUDIT[Audit Service]
    DB[(Relational Database)]
    PUSH[Push Notification Adapters]
    P1 --> API
    P2 --> API
    C1 <--> API
    C2 <--> API
    API --> AUTH
    API --> PAIR
    API --> POLICY
    API --> APPROVAL
    POLICY --> DB
    PAIR --> DB
    APPROVAL --> DB
    API --> CMD
    CMD --> DB
    CMD --> PUSH
    API --> AUDIT
    AUDIT --> DB
    PUSH -. wake-up hint .-> C1
    PUSH -. wake-up hint .-> C2
```

Push is a best-effort wake-up hint. The durable backend queue and
authenticated device synchronization are the source of truth.

## 3. Logical Layers

### 3.1 Native client layer

Each platform has a parent dashboard and child dashboard, which can be
shown according to the authenticated user's role.

Responsibilities: - Login/session management. - Pairing and device
setup. - Policy configuration UI. - Focus timer UI. - Approval request
UI. - Capability explanation and status display. - Local secure token
storage. - Sending commands to the backend and displaying results.

The UI is not the security boundary. Every sensitive action is validated
by the backend and enforced by the native target device.

### 3.2 Shared backend

Recommended logical services (these can begin as a modular monolith
rather than separate microservices):

1.  **Identity service:** registration, login, sessions, recovery,
    account state.
2.  **Relationship service:** parent-child relationships, invitations,
    revocation.
3.  **Device registry:** device registration, platform, capability
    state, authorization/enrollment state, last-seen time.
4.  **Policy service:** policy creation, versioning, ownership,
    schedules, conflict resolution.
5.  **Command service:** durable command creation, delivery attempts,
    expiry, acknowledgement, idempotency.
6.  **Approval service:** request lifecycle and parent decisions.
7.  **Push adapter:** APNs/FCM notifications containing minimal wake-up
    information.
8.  **Audit service:** append-only security-relevant events.
9.  **Observability:** metrics, redacted logs, tracing, alerting.

### 3.3 Native enforcement adapters

The enforcement engine runs on the child device, not on the parent's
phone or the server.

**Android adapter (Kotlin):** - Device Policy Controller
implementation. - `DevicePolicyManager` integration. - Eligible
`setPackagesSuspended()` and `setUninstallBlocked()` operations. -
DND/notification policy integration only after required authorization. -
Local policy cache, schedule evaluation, enforcement receipt
reporting. - Device-owner/profile-owner provisioning and capability
checks.

**iOS adapter (Swift):** - Family Controls authorization and entitlement
checks. - `FamilyActivityPicker` / `FamilyActivitySelection` for
supported selection. - ManagedSettings shields and restrictions. -
DeviceActivity schedules and monitoring extensions. - Local policy cache
and result reporting. - Capability checks for authorization, selected
tokens, and active schedules.

The server must not assume Android package names and iOS opaque app
tokens are interchangeable. A platform-specific target reference belongs
to the device that created it.

## 4. Cross-Platform Command Lifecycle

Example: parent on iOS blocks a selected app on an Android child's
device.

1.  Parent configures a policy in the iOS app.
2.  Client submits policy intent to the backend over TLS.
3.  Backend authenticates the session and verifies parent-child
    relationship and policy authority.
4.  Backend validates the target device's capability state and the
    policy schema.
5.  Backend saves the new policy version and creates a durable command.
6.  Push adapter sends a minimal wake-up notification if possible.
7.  Android child client syncs and retrieves authorized pending
    commands.
8.  Android adapter validates command ID, target device, version,
    expiry, and local management state.
9.  Adapter applies the supported native policy.
10. Adapter reports a result with applied/partial/failed/unsupported
    status and a safe error code.
11. Backend stores the receipt and updates the parent dashboard.
12. On reconnection, device sync reconciles to the latest policy
    version.

The reverse direction uses the same lifecycle; the iOS child adapter
translates the policy into supported Family Controls / ManagedSettings
operations.

## 5. Policy Model and Ownership

Every restriction has immutable ownership semantics:

-   `PARENT`: only an authorized parent can modify/remove it.
-   `CHILD`: the child can modify/remove their own restriction.
-   A child-owned policy cannot override, cancel, or downgrade a
    parent-owned policy.

The effective restrictions are the union of all applicable parent-owned
restrictions and child-owned restrictions, subject to supported platform
semantics and an explicit conflict-resolution order.

Suggested resolution: 1. Safety/system exclusions and unsupported
targets are handled explicitly. 2. Active parent-owned deny restrictions
remain in force. 3. Child-owned restrictions can add additional
restrictions. 4. Child actions never subtract parent-owned restrictions.
5. Parent removal creates a new policy version and command; it does not
silently erase audit history. 6. If a policy is unsupported or partially
applied, the result is shown as such.

## 6. Data Model

Illustrative relational schema. Use UUIDs or equivalent opaque
identifiers; do not expose sequential IDs.

### `users`

-   `id`
-   `email_or_login_identifier`
-   `auth_provider`
-   `role_preference` (display preference only; not an authorization
    source)
-   `account_status`
-   `created_at`, `updated_at`

### `family_relationships`

-   `id`
-   `parent_user_id`
-   `child_user_id`
-   `status` (`pending`, `active`, `revoked`)
-   `created_at`, `revoked_at`

### `pairing_invitations`

-   `id`
-   `family_relationship_id`
-   `token_hash`
-   `expires_at`
-   `attempt_count`
-   `status`
-   `created_by`
-   `created_at`

### `devices`

-   `id`
-   `user_id`
-   `platform` (`android`, `ios`)
-   `app_version`
-   `os_version`
-   `device_public_key` or equivalent registration proof
-   `authorization_state`
-   `enrollment_state`
-   `capabilities_json`
-   `last_seen_at`
-   `last_policy_sync_at`
-   `status`

### `restriction_policies`

-   `id`
-   `family_relationship_id`
-   `target_device_id`
-   `owner_type` (`parent`, `child`)
-   `owner_user_id`
-   `policy_type` (`app_block`, `category_block`, `domain_block`,
    `focus_session`, `notification_focus`)
-   `platform`
-   `target_reference` (platform-specific opaque token/package reference
    as appropriate)
-   `schedule_id`
-   `desired_state`
-   `version`
-   `status`
-   `created_at`, `updated_at`, `deleted_at`

### `schedules`

-   `id`
-   `timezone`
-   `start_at`, `end_at`
-   `recurrence_rule`
-   `enabled`
-   `created_at`, `updated_at`

### `commands`

-   `id`
-   `target_device_id`
-   `policy_id`
-   `policy_version`
-   `command_type`
-   `payload_json`
-   `idempotency_key`
-   `created_at`
-   `expires_at`
-   `delivery_state`
-   `attempt_count`
-   `acknowledged_at`

### `enforcement_receipts`

-   `id`
-   `command_id`
-   `device_id`
-   `result` (`applied`, `partial`, `failed`, `unsupported`,
    `authorization_required`)
-   `platform_error_code`
-   `safe_diagnostic`
-   `reported_at`

### `approval_requests`

-   `id`
-   `family_relationship_id`
-   `requester_user_id`
-   `target_device_id`
-   `request_type`
-   `reason`
-   `status` (`pending`, `approved`, `rejected`, `expired`, `cancelled`)
-   `decision_by`
-   `decision_at`
-   `created_at`, `expires_at`

### `audit_events`

-   `id`
-   `family_relationship_id`
-   `actor_user_id`
-   `actor_device_id`
-   `event_type`
-   `target_type`, `target_id`
-   `metadata_redacted_json`
-   `created_at`

### `push_tokens`

-   `id`
-   `device_id`
-   `platform`
-   `token`
-   `updated_at`

Store only data necessary for the product. Protect platform-specific
app-selection tokens; do not attempt to translate opaque iOS tokens into
Android package names.

## 7. API Design

All routes use `/v1`. JSON examples are illustrative, not final
contracts.

### Authentication

-   `POST /auth/register`
-   `POST /auth/login`
-   `POST /auth/refresh`
-   `POST /auth/logout`
-   `POST /auth/recovery`

### Pairing and relationships

-   `POST /pairing/invitations`
-   `POST /pairing/accept`
-   `GET /families/{familyId}/children`
-   `DELETE /families/{familyId}/children/{childId}`

### Devices

-   `POST /devices/register`
-   `PATCH /devices/{deviceId}/capabilities`
-   `GET /children/{childId}/devices`
-   `POST /devices/{deviceId}/sync`

### Policies

-   `GET /devices/{deviceId}/policies`
-   `POST /children/{childId}/policies`
-   `PATCH /policies/{policyId}`
-   `DELETE /policies/{policyId}`

### Commands and receipts

-   `GET /devices/{deviceId}/commands?cursor=...`
-   `POST /devices/{deviceId}/commands/{commandId}/ack`
-   `POST /devices/{deviceId}/enforcement-receipts`

### Approvals

-   `POST /approval-requests`
-   `GET /approval-requests`
-   `POST /approval-requests/{requestId}/decision`

### Audit

-   `GET /audit-events`

Security rules: - Check authorization for every request on the server. -
Derive actor identity from the authenticated session, not a body
field. - Verify that the parent is actively paired with the target
child. - Verify that a child can only mutate child-owned policies. -
Require idempotency keys for policy-changing requests. - Reject expired,
replayed, or wrong-device commands. - Rate-limit pairing and approval
endpoints. - Return minimal error details to clients; log safe
diagnostics server-side.

## 8. Command Contract

Example policy command:

``` json
{
  "commandId": "uuid",
  "targetDeviceId": "uuid",
  "policyId": "uuid",
  "policyVersion": 12,
  "issuedAt": "2026-10-15T08:00:00Z",
  "expiresAt": "2026-10-15T08:10:00Z",
  "operation": "APPLY_POLICY",
  "policy": {
    "ownerType": "parent",
    "policyType": "app_block",
    "desiredState": "active",
    "scheduleId": "uuid"
  }
}
```

Avoid placing unnecessary personal data or app usage contents in push
payloads. A push should generally say "new policy available" and let the
authenticated client fetch the command.

## 9. Offline and Reconciliation Behavior

-   Device caches the last successfully synchronized policy set in
    secure/local app storage where appropriate.
-   Native OS-managed schedules should enforce locally where the
    platform supports it.
-   New parent commands cannot be guaranteed while the child device is
    offline.
-   On reconnect, client requests current policy version and pending
    commands.
-   Client applies the authoritative latest state, not an unbounded
    sequence of stale intermediate commands.
-   Device reports last sync time and policy version.
-   If the native authorization is revoked or the DPC loses required
    management status, client reports degraded protection.
-   Parent dashboard clearly differentiates "desired policy saved" from
    "enforcement confirmed."

## 10. Security Architecture

### Authentication and sessions

-   Use a vetted identity provider or well-reviewed authentication
    implementation.
-   Use short-lived access tokens and refresh-token rotation.
-   Store tokens in Android Keystore-backed secure storage / iOS
    Keychain.
-   Support remote session revocation and reauthentication for sensitive
    actions.

### Authorization

-   Server-side role and relationship checks on every endpoint.
-   Parent permissions scoped to linked child devices only.
-   Child cannot update parent-owned policies or fabricate enforcement
    receipts.
-   Devices authenticate as registered devices; consider per-device keys
    and request signing for higher assurance.

### Transport and storage

-   TLS in transit.
-   Encrypt sensitive server data at rest.
-   Use managed secrets, never hard-code server credentials.
-   Separate development, staging, and production environments.
-   Minimize PII in logs and analytics.

### Threats to address

-   Parent account takeover.
-   Pairing code brute force or reuse.
-   Child forges parent role in API body.
-   Child replays an old "remove restriction" command.
-   A stale device command overrides a newer policy.
-   Unauthorized device submits a fake enforcement receipt.
-   Push token theft or reassignment.
-   Database leakage of pairing tokens or platform-specific targets.
-   Policy conflicts and time manipulation.
-   Rooted/jailbroken device or revoked system authorization.

### Mitigations

-   MFA/passkeys where feasible.
-   Short-lived hashed pairing tokens, expiry, attempt limits, and
    single use.
-   Monotonic policy versions and idempotency.
-   Per-device registration proof.
-   Server-authoritative policy ownership.
-   Audited high-risk actions.
-   Honest status when platform integrity cannot be verified.
-   Security review before production.

## 11. Platform-Specific Constraints

### Android

-   `DevicePolicyManager.setPackagesSuspended()` is available to
    eligible device/profile owners or delegated package-access roles.
-   Suspension hides notifications and prevents the package from
    starting, but some system/critical packages cannot be suspended.
-   `setUninstallBlocked()` is available only in eligible
    device-management configurations.
-   Device-owner provisioning and consumer setup friction must be
    validated early.
-   DND requires appropriate user/system access and is not equivalent to
    package suspension.
-   Do not use accessibility services as a covert substitute for
    supported management APIs.

### iOS

-   Family Controls requires capability/entitlement and Apple's approval
    for distribution.
-   Guardian authorization follows Apple's supported
    family/authorization flow.
-   ManagedSettings shields apps/categories/domains represented by
    supported selection tokens.
-   DeviceActivity supports schedules and monitoring extensions.
-   Do not assume universal notification suppression, arbitrary app
    inventory, or unrestricted remote device commands.
-   Test on physical devices and the exact OS versions targeted.

## 12. Observability and Operational Readiness

Metrics: - Registration/pairing success rate. - Device
authorization/enrollment completion. - Command queue age and delivery
latency. - Enforcement success/partial/failure rate by platform and OS
version. - Last successful sync. - Approval request delivery/decision
latency. - API error and authentication failure rates.

Do not log notification contents, private app content, or full sensitive
selection data.

## 13. Deployment Recommendation

Start with a modular backend (for example, a single well-structured
service plus a relational database and queue/outbox) rather than
premature microservices.

Production components: - API service. - Relational database with backups
and migrations. - Durable command/outbox table or queue. - Push
notification integration (FCM/APNs). - Secrets manager. - Centralized
redacted logs, metrics, and alerts. - Separate dev/staging/prod
environments. - CI checks, dependency scanning, signing, and release
approvals.

## 14. Technical Validation Checklist

Before committing to a release promise: - \[ \] Provision Android DPC on
each supported setup path. - \[ \] Test package suspension and
notification suppression on physical devices. - \[ \] Test system apps
that cannot be suspended. - \[ \] Test uninstall blocking only in
eligible configurations. - \[ \] Test DND behavior across Android
versions/OEMs. - \[ \] Obtain and validate Apple's Family Controls
entitlement. - \[ \] Test guardian authorization and app shielding on
physical iPhones. - \[ \] Verify DeviceActivity schedules when the app
is not open. - \[ \] Measure notification behavior rather than assuming
it. - \[ \] Test cross-platform parent-to-child commands. - \[ \] Test
offline, expired, duplicated, reordered, and replayed commands. - \[ \]
Test account unlinking, authorization revocation, and reinstall flows. -
\[ \] Review Google Play and App Store policy requirements.

## 15. Official References

-   Android DevicePolicyManager:
    https://developer.android.com/reference/android/app/admin/DevicePolicyManager
-   Android Enterprise DPC security:
    https://developer.android.com/work/dpc/security
-   Apple Screen Time frameworks:
    https://developer.apple.com/documentation/ScreenTimeAPIDocumentation
-   Apple Family Controls:
    https://developer.apple.com/documentation/familycontrols
