package com.zenfocus.app

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast

class EnterpriseDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.i(TAG, "ZenFocus DPC Device Admin Enabled")
        Toast.makeText(context, "ZenFocus DPC Protection Activated", Toast.LENGTH_SHORT).show()
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.w(TAG, "ZenFocus DPC Device Admin Disabled")
    }

    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        Log.i(TAG, "ZenFocus Profile Provisioning Complete")
    }

    companion object {
        private const val TAG = "ZenFocusDpcReceiver"
    }
}
