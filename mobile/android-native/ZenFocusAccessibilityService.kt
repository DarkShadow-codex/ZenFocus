package com.zenfocus.app

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.content.pm.PackageManager
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.widget.Toast

class ZenFocusAccessibilityService : AccessibilityService() {

    private val TAG = "ZenFocusA11y"
    private var lastBlockedPackage: String? = null
    private var lastBlockedTimestamp: Long = 0L

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: return

            // Never block ZenFocus itself or critical Android system components
            if (packageName == applicationContext.packageName ||
                packageName == "com.android.systemui" ||
                packageName == "com.android.settings" ||
                packageName.contains("launcher", ignoreCase = true)
            ) {
                return
            }

            // Check if this package is marked as blocked by ZenFocus policies
            if (ZenFocusBlockerManager.isAppBlocked(applicationContext, packageName)) {
                val now = System.currentTimeMillis()
                // Prevent duplicate trigger bursts
                if (packageName == lastBlockedPackage && (now - lastBlockedTimestamp) < 1500) {
                    return
                }
                lastBlockedPackage = packageName
                lastBlockedTimestamp = now

                Log.w(TAG, "Restricted app launched: $packageName -> Intercepting and closing!")

                // 1. Immediately send user back to Home screen to terminate app launch
                performGlobalAction(GLOBAL_ACTION_HOME)

                // 2. Resolve friendly app label
                var appLabel = packageName
                try {
                    val pm = applicationContext.packageManager
                    val appInfo = pm.getApplicationInfo(packageName, 0)
                    appLabel = pm.getApplicationLabel(appInfo).toString()
                } catch (ignored: Exception) {}

                // 3. Show Toast notification
                try {
                    Toast.makeText(
                        applicationContext,
                        "🔒 ZenFocus: $appLabel is restricted",
                        Toast.LENGTH_SHORT
                    ).show()
                } catch (ignored: Exception) {}

                // 4. Launch the ZenFocus Block Screen Activity
                try {
                    val blockIntent = Intent(applicationContext, ZenFocusBlockedActivity::class.java).apply {
                        putExtra(ZenFocusBlockedActivity.EXTRA_PACKAGE_NAME, packageName)
                        putExtra(ZenFocusBlockedActivity.EXTRA_APP_LABEL, appLabel)
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                    }
                    startActivity(blockIntent)
                } catch (e: Exception) {
                    Log.e(TAG, "Error launching ZenFocusBlockedActivity: ${e.message}")
                }
            }
        }
    }

    override fun onInterrupt() {
        Log.i(TAG, "ZenFocusAccessibilityService interrupted")
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.i(TAG, "ZenFocusAccessibilityService connected & active")
        ZenFocusBackgroundService.start(applicationContext)
    }
}
