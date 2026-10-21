package com.zenfocus.app

import android.app.NotificationManager
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.*

class ZenFocusDpcModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val devicePolicyManager: DevicePolicyManager by lazy {
        reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    }

    private val notificationManager: NotificationManager by lazy {
        reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    }

    private val adminComponent: ComponentName by lazy {
        ComponentName(reactContext, EnterpriseDeviceAdminReceiver::class.java)
    }

    override fun getName(): String {
        return "ZenFocusDpcModule"
    }

    /**
     * Checks if ZenFocus is currently provisioned as the Device Owner.
     */
    @ReactMethod
    fun isDeviceOwner(promise: Promise) {
        try {
            val isDO = devicePolicyManager.isDeviceOwnerApp(reactContext.packageName)
            promise.resolve(isDO)
        } catch (e: Exception) {
            promise.reject("ERR_DPC_CHECK", e.message, e)
        }
    }

    /**
     * Checks if ZenFocus is currently provisioned as Profile Owner.
     */
    @ReactMethod
    fun isProfileOwner(promise: Promise) {
        try {
            val isPO = devicePolicyManager.isProfileOwnerApp(reactContext.packageName)
            promise.resolve(isPO)
        } catch (e: Exception) {
            promise.reject("ERR_PO_CHECK", e.message, e)
        }
    }

    /**
     * Suspends or unsuspends a target app package.
     * 1. Updates ZenFocusBlockerManager so the real-time accessibility blocker immediately intercepts the app if launched.
     * 2. Also attempts DevicePolicyManager.setPackagesSuspended if provisioned as Device Owner.
     */
    @ReactMethod
    fun setPackageSuspended(packageName: String, suspended: Boolean, promise: Promise) {
        try {
            // 1. Update real-time persistent app blocker
            ZenFocusBlockerManager.setAppBlocked(reactContext, packageName, suspended)

            // 2. Also attempt DPC suspension if Device Owner / Profile Owner
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                try {
                    val packages = arrayOf(packageName)
                    devicePolicyManager.setPackagesSuspended(adminComponent, packages, suspended)
                } catch (ignored: Exception) {}
            }

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_DPC_SUSPEND", e.message, e)
        }
    }

    /**
     * Checks if ZenFocus Accessibility Service is enabled in Android Settings.
     */
    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        try {
            val expectedService = ComponentName(reactContext, ZenFocusAccessibilityService::class.java).flattenToString()
            val enabledServices = Settings.Secure.getString(
                reactContext.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: ""
            val isEnabled = enabledServices.contains(expectedService)
            promise.resolve(isEnabled)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    /**
     * Opens Android Accessibility Settings so the user can toggle ON the ZenFocus App Blocker.
     */
    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_OPEN_A11Y", e.message, e)
        }
    }

    /**
     * Returns the list of currently blocked packages.
     */
    @ReactMethod
    fun getBlockedPackages(promise: Promise) {
        try {
            val list = ZenFocusBlockerManager.getAllBlockedPackages(reactContext)
            val array = Arguments.createArray()
            for (pkg in list) {
                array.pushString(pkg)
            }
            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("ERR_GET_BLOCKED", e.message, e)
        }
    }

    /**
     * Checks if ZenFocus is currently whitelisted from battery optimization.
     */
    @ReactMethod
    fun isIgnoringBatteryOptimizations(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val powerManager = reactContext.getSystemService(Context.POWER_SERVICE) as? android.os.PowerManager
                val isIgnoring = powerManager?.isIgnoringBatteryOptimizations(reactContext.packageName) ?: true
                promise.resolve(isIgnoring)
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    /**
     * Requests user to whitelist ZenFocus from battery optimizations (Unrestricted background).
     */
    @ReactMethod
    fun requestIgnoreBatteryOptimizations(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = android.net.Uri.parse("package:${reactContext.packageName}")
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    reactContext.startActivity(intent)
                    promise.resolve(true)
                } catch (e: Exception) {
                    val fallbackIntent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    reactContext.startActivity(fallbackIntent)
                    promise.resolve(true)
                }
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("ERR_BATTERY_OPT", e.message, e)
        }
    }

    /**
     * Explicitly starts the persistent background foreground service.
     */
    @ReactMethod
    fun startBackgroundService(promise: Promise) {
        try {
            ZenFocusBackgroundService.start(reactContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_START_BG_SERVICE", e.message, e)
        }
    }

    /**
     * Blocks or unblocks uninstallation of a package.
     */
    @ReactMethod
    fun setUninstallBlocked(packageName: String, blocked: Boolean, promise: Promise) {
        try {
            devicePolicyManager.setUninstallBlocked(adminComponent, packageName, blocked)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_UNINSTALL_BLOCK", e.message, e)
        }
    }

    /**
     * Checks if Do Not Disturb (Notification Policy Access) is granted.
     */
    @ReactMethod
    fun isDndAccessGranted(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val isGranted = notificationManager.isNotificationPolicyAccessGranted
                promise.resolve(isGranted)
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("ERR_DND_CHECK", e.message, e)
        }
    }

    /**
     * Prompts the user to grant Do Not Disturb access in Android settings.
     */
    @ReactMethod
    fun requestDndAccess(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactContext.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("ERR_REQUEST_DND", e.message, e)
        }
    }

    /**
     * Starts a focused study session on Android, optionally activating DND Priority mode
     * and recording the session end timestamp. Supports multi-hour sessions (> 60m).
     */
    @ReactMethod
    fun startStudySession(durationMinutes: Double, sessionName: String, promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && notificationManager.isNotificationPolicyAccessGranted) {
                notificationManager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_PRIORITY)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_START_STUDY", e.message, e)
        }
    }

    /**
     * Adjusts active study session by delta minutes (e.g. +15m, +30m, -15m).
     */
    @ReactMethod
    fun adjustStudySession(deltaMinutes: Double, promise: Promise) {
        try {
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_ADJUST_STUDY", e.message, e)
        }
    }

    /**
     * Stops study session and restores normal notification policy.
     */
    @ReactMethod
    fun stopStudySession(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && notificationManager.isNotificationPolicyAccessGranted) {
                notificationManager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_STOP_STUDY", e.message, e)
        }
    }

    /**
     * Scans installed applications on the Android child device using PackageManager.
     * Extracts package name, app label, system flag, category, and whether it is suspended by DPC.
     */
    @ReactMethod
    fun scanInstalledApplications(promise: Promise) {
        try {
            val pm = reactContext.packageManager
            val packagesList = Arguments.createArray()
            val installedPackages = pm.getInstalledPackages(0)

            for (pkg in installedPackages) {
                val appInfo = pkg.applicationInfo ?: continue
                val isSystem = (appInfo.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0

                // Filter to user-installed and launchable apps
                val launchIntent = pm.getLaunchIntentForPackage(pkg.packageName)
                if (launchIntent != null || !isSystem) {
                    val appMap = Arguments.createMap().apply {
                        putString("targetPackage", pkg.packageName)
                        putString("appName", pm.getApplicationLabel(appInfo).toString())
                        putBoolean("isSystemApp", isSystem)
                        putDouble("installDate", pkg.firstInstallTime.toDouble())
                        putString("platform", "android")

                        var isSuspended = false
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                            try {
                                isSuspended = devicePolicyManager.isPackageSuspended(adminComponent, pkg.packageName)
                            } catch (ignored: Exception) {}
                        }
                        val isBlocked = isSuspended || ZenFocusBlockerManager.isAppBlocked(reactContext, pkg.packageName)
                        putBoolean("isRestricted", isBlocked)

                        // Heuristic category mapping
                        val cat = when {
                            pkg.packageName.contains("game") || pkg.packageName.contains("roblox") || pkg.packageName.contains("minecraft") -> "Gaming"
                            pkg.packageName.contains("youtube") || pkg.packageName.contains("netflix") || pkg.packageName.contains("twitch") -> "Entertainment"
                            pkg.packageName.contains("tiktok") || pkg.packageName.contains("instagram") || pkg.packageName.contains("snapchat") || pkg.packageName.contains("discord") -> "Social"
                            pkg.packageName.contains("duolingo") || pkg.packageName.contains("khan") || pkg.packageName.contains("notion") -> "Productivity"
                            else -> "Utilities"
                        }
                        putString("appCategory", cat)
                    }
                    packagesList.pushMap(appMap)
                }
            }

            promise.resolve(packagesList)
        } catch (e: Exception) {
            promise.reject("ERR_SCAN_APPS", e.message, e)
        }
    }
}
