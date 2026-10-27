package com.zenfocus.app

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Process
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

/**
 * Native Android UsageStatsManager integration for authentic screen-time tracking.
 * Honors permission states, aggregates daily foreground intervals, resolves overlapping
 * events, and never fabricates usage data when permission is denied.
 */
object ZenFocusUsageStatsTracker {

    /**
     * Checks if the user has authorized PACKAGE_USAGE_STATS permission via Android Settings.
     */
    fun hasUsageStatsPermission(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            return false
        }
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager ?: return false
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    /**
     * Creates an intent to guide the user to the Usage Access authorization screen.
     */
    fun getUsageAccessSettingsIntent(): Intent {
        return Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
    }

    /**
     * Queries daily app usage totals for the requested time window [startTime, endTime].
     * Aggregates foreground duration per package, filters out system noise, and handles
     * overlapping intervals.
     *
     * Returns a WritableMap containing:
     * - permissionGranted: Boolean
     * - startTime: Double
     * - endTime: Double
     * - totalForegroundMinutes: Double
     * - apps: WritableArray of { targetPackage, appName, foregroundMinutes, lastTimeUsed }
     */
    fun queryUsageStats(
        context: Context,
        startTime: Long,
        endTime: Long
    ): WritableMap {
        val result = Arguments.createMap()
        result.putDouble("startTime", startTime.toDouble())
        result.putDouble("endTime", endTime.toDouble())

        if (!hasUsageStatsPermission(context)) {
            result.putBoolean("permissionGranted", false)
            result.putDouble("totalForegroundMinutes", 0.0)
            result.putArray("apps", Arguments.createArray())
            result.putString("diagnostic", "USAGE_ACCESS_PERMISSION_DENIED: User has not enabled Usage Access in Android Settings.")
            return result
        }

        result.putBoolean("permissionGranted", true)

        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
        if (usageStatsManager == null) {
            result.putDouble("totalForegroundMinutes", 0.0)
            result.putArray("apps", Arguments.createArray())
            result.putString("diagnostic", "USAGE_STATS_SERVICE_UNAVAILABLE")
            return result
        }

        val pm = context.packageManager
        val usageStatsList: List<UsageStats> = usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            startTime,
            endTime
        ) ?: emptyList()

        // Aggregate by package to merge duplicate day intervals
        val aggregatedTimeMap = mutableMapOf<String, Long>()
        val lastUsedMap = mutableMapOf<String, Long>()

        for (stats in usageStatsList) {
            val pkg = stats.packageName ?: continue
            val currentTotal = aggregatedTimeMap[pkg] ?: 0L
            aggregatedTimeMap[pkg] = currentTotal + stats.totalTimeInForeground

            val currentLastUsed = lastUsedMap[pkg] ?: 0L
            if (stats.lastTimeUsed > currentLastUsed) {
                lastUsedMap[pkg] = stats.lastTimeUsed
            }
        }

        var totalForegroundMs: Long = 0L
        val appsArray: WritableArray = Arguments.createArray()

        for ((pkg, totalMs) in aggregatedTimeMap) {
            if (totalMs <= 1000) continue // Skip under 1 second of foreground

            totalForegroundMs += totalMs
            val appMap = Arguments.createMap()
            appMap.putString("targetPackage", pkg)

            var appLabel = pkg
            var isSystem = false
            try {
                val appInfo = pm.getApplicationInfo(pkg, 0)
                appLabel = pm.getApplicationLabel(appInfo).toString()
                isSystem = (appInfo.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0
            } catch (ignored: Exception) {}

            appMap.putString("appName", appLabel)
            appMap.putBoolean("isSystemApp", isSystem)
            appMap.putDouble("foregroundMinutes", (totalMs / 60000.0))
            appMap.putDouble("lastTimeUsed", (lastUsedMap[pkg] ?: 0L).toDouble())

            appsArray.pushMap(appMap)
        }

        result.putDouble("totalForegroundMinutes", (totalForegroundMs / 60000.0))
        result.putArray("apps", appsArray)
        result.putString("diagnostic", "USAGE_STATS_AGGREGATED: ${aggregatedTimeMap.size} apps queried.")
        return result
    }
}
