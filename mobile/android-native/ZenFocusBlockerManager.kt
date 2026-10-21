package com.zenfocus.app

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import android.util.Log

object ZenFocusBlockerManager {
    private const val TAG = "ZenFocusBlocker"
    private const val PREFS_NAME = "zenfocus_app_blocker_prefs"
    private const val KEY_BLOCKED_PACKAGES = "blocked_packages_set"

    @Volatile
    private var inMemoryBlockedSet: MutableSet<String>? = null

    private fun getPrefs(context: Context): SharedPreferences {
        return context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    @Synchronized
    private fun getBlockedSet(context: Context): MutableSet<String> {
        if (inMemoryBlockedSet == null) {
            val savedSet = getPrefs(context).getStringSet(KEY_BLOCKED_PACKAGES, emptySet()) ?: emptySet()
            inMemoryBlockedSet = HashSet(savedSet)
        }
        return inMemoryBlockedSet!!
    }

    /**
     * Checks if a package is currently blocked by ZenFocus policies.
     */
    fun isAppBlocked(context: Context, packageName: String): Boolean {
        if (packageName.isBlank()) return false
        val set = getBlockedSet(context)
        return set.contains(packageName)
    }

    /**
     * Sets the blocked status for a package.
     * Persists to SharedPreferences and updates native DPC package suspension if Device Owner.
     */
    @Synchronized
    fun setAppBlocked(context: Context, packageName: String, blocked: Boolean) {
        if (packageName.isBlank()) return
        val set = getBlockedSet(context)

        if (blocked) {
            set.add(packageName)
        } else {
            set.remove(packageName)
        }

        // Persist to SharedPreferences
        getPrefs(context).edit().putStringSet(KEY_BLOCKED_PACKAGES, HashSet(set)).apply()
        Log.i(TAG, "Updated blocked status for $packageName: blocked=$blocked. Total blocked: ${set.size}")

        // Attempt DevicePolicyManager.setPackagesSuspended if Device Owner is present
        try {
            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager
            val admin = ComponentName(context, EnterpriseDeviceAdminReceiver::class.java)
            if (dpm != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                if (dpm.isDeviceOwnerApp(context.packageName) || dpm.isProfileOwnerApp(context.packageName)) {
                    dpm.setPackagesSuspended(admin, arrayOf(packageName), blocked)
                    Log.i(TAG, "DPC setPackagesSuspended applied for $packageName: $blocked")
                }
            }
        } catch (e: Exception) {
            Log.d(TAG, "DPC setPackagesSuspended not active or not device owner: ${e.message}")
        }
    }

    /**
     * Returns a list of all currently blocked package names.
     */
    @Synchronized
    fun getAllBlockedPackages(context: Context): List<String> {
        return getBlockedSet(context).toList()
    }
}
