package com.zenfocus.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

/**
 * ZenFocus Background Foreground Service.
 * Guarantees that ZenFocus remains running in the background to enforce:
 * - Active study focus timers
 * - Real-time app restrictions and window monitoring
 * - Instant child/parent restriction synchronization
 */
class ZenFocusBackgroundService : Service() {

    companion object {
        const val CHANNEL_ID = "zenfocus_background_channel"
        const val NOTIFICATION_ID = 2002

        fun start(context: Context) {
            try {
                val intent = Intent(context, ZenFocusBackgroundService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        fun stop(context: Context) {
            try {
                val intent = Intent(context, ZenFocusBackgroundService::class.java)
                context.stopService(intent)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startServiceInForeground()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startServiceInForeground()
        // START_STICKY ensures the OS automatically restarts the service if memory is ever recovered
        return START_STICKY
    }

    private fun startServiceInForeground() {
        try {
            val notification = buildNotification()
            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
                )
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    0
                )
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (e: Exception) {
            try {
                startForeground(NOTIFICATION_ID, buildNotification())
            } catch (ignored: Exception) {
                ignored.printStackTrace()
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        // Signal restart receiver to keep background protection active
        try {
            val restartIntent = Intent(applicationContext, ZenFocusBootReceiver::class.java).apply {
                action = "com.zenfocus.app.RESTART_SERVICE"
            }
            sendBroadcast(restartIntent)
        } catch (ignored: Exception) {}
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "ZenFocus Background Protection",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps ZenFocus running in the background to enforce study rules and app restrictions"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName) ?: Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT else PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("ZenFocus Protection Active")
            .setContentText("Enforcing study session & app restrictions in background")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}
