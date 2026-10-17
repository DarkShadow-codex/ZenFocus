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
     * Suspends or unsuspends a target app package using DevicePolicyManager.setPackagesSuspended.
     * When suspended, the app icon is grayed out, unable to launch, and its notifications are suppressed.
     */
    @ReactMethod
    fun setPackageSuspended(packageName: String, suspended: Boolean, promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                val packages = arrayOf(packageName)
                val failedPackages = devicePolicyManager.setPackagesSuspended(adminComponent, packages, suspended)
                if (failedPackages == null || failedPackages.isEmpty()) {
                    promise.resolve(true)
                } else {
                    promise.resolve(false)
                }
            } else {
                promise.reject("ERR_UNSUPPORTED_API", "setPackagesSuspended requires Android 7.0 (API 24)+")
            }
        } catch (e: SecurityException) {
            promise.reject("ERR_SECURITY_DPC", "Caller must be Device Owner or Profile Owner: ${e.message}", e)
        } catch (e: Exception) {
            promise.reject("ERR_DPC_SUSPEND", e.message, e)
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
}
